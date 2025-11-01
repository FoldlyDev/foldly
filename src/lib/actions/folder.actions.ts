// =============================================================================
// FOLDER ACTIONS - Global Folder CRUD Operations
// =============================================================================
// Used by: workspace module, links module, file organization
// Handles creation, reading, updating, moving, and deletion of folders

'use server';

// Import from global utilities
import { withAuthAndRateLimit, withAuthInputAndRateLimit, validateInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFolderOwnership } from '@/lib/utils/authorization';
import { withTransaction } from '@/lib/database/transactions';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getRootFolders,
  getSubfolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  isFolderNameAvailable,
  getFolderHierarchy,
  getFolderDepth,
} from '@/lib/database/queries';

// Import rate limiting
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Folder } from '@/lib/database/schemas';

// Import global validation schemas
import {
  createFolderSchema,
  updateFolderSchema,
  moveFolderSchema,
  deleteFolderSchema,
  getFolderHierarchySchema,
  type CreateFolderInput,
  type UpdateFolderInput,
  type MoveFolderInput,
  type DeleteFolderInput,
  type GetFolderHierarchyInput,
} from '@/lib/validation';

// Import constants
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Get all root folders for the authenticated user's workspace
 * Root folders have parentFolderId = NULL
 * Rate limited: 100 requests per minute
 *
 * @returns Array of root folders for the user's workspace
 *
 * @example
 * ```typescript
 * const result = await getRootFoldersAction();
 * if (result.success) {
 *   console.log('Root folders:', result.data);
 * }
 * ```
 */
export const getRootFoldersAction = withAuthAndRateLimit<Folder[]>(
  'getRootFoldersAction',
  RateLimitPresets.GENEROUS,
  async (userId) => {
    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Get all root folders for workspace
    const folders = await getRootFolders(workspace.id);

    return {
      success: true,
      data: folders,
    } as const;
  }
);

/**
 * Get folder hierarchy (breadcrumb path)
 * Returns array of folders from root to current folder
 * Validates that the folder belongs to the authenticated user's workspace
 * Rate limited: 100 requests per minute
 *
 * @param input - Object containing folderId
 * @returns Array of folders in hierarchy order (root to current)
 *
 * @example
 * ```typescript
 * const result = await getFolderHierarchyAction({ folderId: 'folder_123' });
 * if (result.success) {
 *   console.log('Breadcrumb:', result.data);
 * }
 * ```
 */
export const getFolderHierarchyAction = withAuthInputAndRateLimit<
  GetFolderHierarchyInput,
  Folder[]
>('getFolderHierarchyAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate input
  const validated = validateInput(getFolderHierarchySchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify folder ownership
  await verifyFolderOwnership(
    validated.folderId,
    workspace.id,
    'getFolderHierarchyAction'
  );

  // Get folder hierarchy (ownership already verified)
  const hierarchy = await getFolderHierarchy(validated.folderId);

  return {
    success: true,
    data: hierarchy,
  } as const;
});

// =============================================================================
// WRITE ACTIONS
// =============================================================================

/**
 * Create a new folder
 * Validates name uniqueness within parent context and enforces nesting depth limit (20 levels)
 * Rate limited: 20 requests per minute
 *
 * @param data - Folder creation data
 * @returns Created folder
 *
 * @example
 * ```typescript
 * const result = await createFolderAction({
 *   name: 'Tax Documents',
 *   parentFolderId: 'folder_123', // null for root folder
 * });
 * ```
 */
export const createFolderAction = withAuthInputAndRateLimit<CreateFolderInput, Folder>(
  'createFolderAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // If parentFolderId is provided, verify it exists and belongs to workspace
    if (validated.parentFolderId) {
      await verifyFolderOwnership(
        validated.parentFolderId,
        workspace.id,
        'createFolderAction'
      );

      // Check nesting depth: Child will be at parentDepth + 1
      // Reject if child depth would reach MAX_NESTING_DEPTH (20 levels = depth 0-19)
      const parentDepth = await getFolderDepth(validated.parentFolderId);
      const childDepth = parentDepth + 1;
      if (childDepth >= VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH) {
        logSecurityEvent('folderNestingLimitExceeded', {
          userId,
          parentFolderId: validated.parentFolderId,
          parentDepth,
          childDepth,
          limit: VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH,
        });
        throw {
          success: false,
          error: `Cannot create folder. Maximum nesting depth (${VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH} levels) reached.`,
        } as const;
      }
    }

    // Check name availability within parent context
    const nameAvailable = await isFolderNameAvailable(
      workspace.id,
      validated.name,
      validated.parentFolderId ?? null
    );

    if (!nameAvailable) {
      logSecurityEvent('folderNameAlreadyExists', {
        userId,
        name: validated.name,
        parentFolderId: validated.parentFolderId,
      });
      throw {
        success: false,
        error: 'A folder with this name already exists in this location.',
      } as const;
    }

    // Create folder
    const folder = await createFolder({
      workspaceId: workspace.id,
      name: validated.name,
      parentFolderId: validated.parentFolderId ?? null,
      linkId: validated.linkId ?? null,
      uploaderEmail: validated.uploaderEmail ?? null,
      uploaderName: validated.uploaderName ?? null,
    });

    logger.info('Folder created successfully', {
      userId,
      folderId: folder.id,
      name: folder.name,
      parentFolderId: folder.parentFolderId,
    });

    return {
      success: true,
      data: folder,
    } as const;
  }
);

/**
 * Update folder details (name)
 * Validates ownership and name uniqueness if name is being changed
 * Rate limited: 20 requests per minute
 *
 * @param data - Folder update data
 * @returns Updated folder
 *
 * @example
 * ```typescript
 * const result = await updateFolderAction({
 *   folderId: 'folder_123',
 *   name: 'Updated Folder Name',
 * });
 * ```
 */
export const updateFolderAction = withAuthInputAndRateLimit<UpdateFolderInput, Folder>(
  'updateFolderAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder ownership
    const existingFolder = await verifyFolderOwnership(
      validated.folderId,
      workspace.id,
      'updateFolderAction'
    );

    // If name is being changed, validate uniqueness
    if (validated.name && validated.name !== existingFolder.name) {
      const nameAvailable = await isFolderNameAvailable(
        workspace.id,
        validated.name,
        existingFolder.parentFolderId,
        validated.folderId // Exclude current folder from check
      );

      if (!nameAvailable) {
        logSecurityEvent('folderNameAlreadyExists', {
          userId,
          folderId: validated.folderId,
          name: validated.name,
          parentFolderId: existingFolder.parentFolderId,
        });
        throw {
          success: false,
          error: 'A folder with this name already exists in this location.',
        } as const;
      }
    }

    // Update folder
    const updatedFolder = await updateFolder(validated.folderId, {
      name: validated.name,
    });

    logger.info('Folder updated successfully', {
      userId,
      folderId: validated.folderId,
      fieldsUpdated: {
        name: validated.name !== undefined,
      },
    });

    return {
      success: true,
      data: updatedFolder,
    } as const;
  }
);

/**
 * Move a folder to a new parent
 * Validates ownership, prevents circular references, and enforces nesting depth limit (20 levels)
 * Rate limited: 20 requests per minute
 *
 * @param data - Move folder data
 * @returns Updated folder
 *
 * @example
 * ```typescript
 * const result = await moveFolderAction({
 *   folderId: 'folder_123',
 *   newParentId: 'folder_456', // null to move to root
 * });
 * ```
 */
export const moveFolderAction = withAuthInputAndRateLimit<MoveFolderInput, Folder>(
  'moveFolderAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(moveFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder ownership
    const existingFolder = await verifyFolderOwnership(
      validated.folderId,
      workspace.id,
      'moveFolderAction'
    );

    // Perform all business logic validations BEFORE transaction
    // Following pattern from link.actions.ts - validations don't need transaction atomicity
    if (validated.newParentId) {
      // Prevent moving folder into itself
      if (validated.newParentId === validated.folderId) {
        logSecurityEvent('folderCircularReference', {
          userId,
          folderId: validated.folderId,
          newParentId: validated.newParentId,
        });
        throw {
          success: false,
          error: ERROR_MESSAGES.FOLDER.CIRCULAR_REFERENCE,
        } as const;
      }

      // Verify new parent exists and belongs to workspace
      await verifyFolderOwnership(
        validated.newParentId,
        workspace.id,
        'moveFolderAction'
      );

      // Check if new parent is a descendant of the folder being moved (prevents circular reference)
      const newParentHierarchy = await getFolderHierarchy(validated.newParentId);
      const isDescendant = newParentHierarchy.some((f) => f.id === validated.folderId);

      if (isDescendant) {
        logSecurityEvent('folderCircularReference', {
          userId,
          folderId: validated.folderId,
          newParentId: validated.newParentId,
        });
        throw {
          success: false,
          error: ERROR_MESSAGES.FOLDER.CIRCULAR_REFERENCE,
        } as const;
      }

      // Check nesting depth: Moved folder will be at newParentDepth + 1
      // Reject if new depth would reach MAX_NESTING_DEPTH (20 levels = depth 0-19)
      const newParentDepth = await getFolderDepth(validated.newParentId);
      const newDepth = newParentDepth + 1;
      if (newDepth >= VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH) {
        logSecurityEvent('folderNestingLimitExceeded', {
          userId,
          folderId: validated.folderId,
          newParentId: validated.newParentId,
          newParentDepth,
          newDepth,
          limit: VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH,
        });
        throw {
          success: false,
          error: `Cannot move folder. Maximum nesting depth (${VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH} levels) would be exceeded.`,
        } as const;
      }
    }

    // Check name uniqueness in new location
    const nameAvailable = await isFolderNameAvailable(
      workspace.id,
      existingFolder.name,
      validated.newParentId,
      validated.folderId // Exclude current folder from check
    );

    if (!nameAvailable) {
      logSecurityEvent('folderNameAlreadyExists', {
        userId,
        folderId: validated.folderId,
        name: existingFolder.name,
        newParentId: validated.newParentId,
      });
      throw {
        success: false,
        error: 'A folder with this name already exists in the destination.',
      } as const;
    }

    // Execute move operation in transaction (only the database update)
    // Following link.actions.ts pattern - transaction wraps only the DB operation
    const transactionResult = await withTransaction(
      async (tx) => {
        // Move folder (update parentFolderId)
        const updatedFolder = await updateFolder(validated.folderId, {
          parentFolderId: validated.newParentId,
        });

        if (!updatedFolder) {
          throw new Error('Failed to move folder: Database update returned no rows');
        }

        return updatedFolder;
      },
      {
        name: 'move-folder',
        maxRetries: 1, // Retry once on serialization errors
        context: { userId, folderId: validated.folderId, newParentId: validated.newParentId }
      }
    );

    // Check transaction result and RETURN error (don't throw - HOF will handle)
    // Following link.actions.ts pattern
    if (!transactionResult.success || !transactionResult.data) {
      logger.error('Folder move transaction failed', {
        userId,
        folderId: validated.folderId,
        error: transactionResult.error,
      });
      return {
        success: false,
        error: transactionResult.error || 'Failed to move folder',
      } as const;
    }

    logger.info('Folder moved successfully', {
      userId,
      folderId: validated.folderId,
      oldParentId: existingFolder.parentFolderId,
      newParentId: validated.newParentId,
    });

    return {
      success: true,
      data: transactionResult.data,
    } as const;
  }
);

/**
 * Delete a folder
 * Validates ownership before deletion
 * Note: Cascade deletes all subfolders; files have their parent_folder_id set to NULL
 * Rate limited: 20 requests per minute
 *
 * @param data - Object containing folderId
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await deleteFolderAction({ folderId: 'folder_123' });
 * ```
 */
export const deleteFolderAction = withAuthInputAndRateLimit<DeleteFolderInput, void>(
  'deleteFolderAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder ownership
    await verifyFolderOwnership(
      validated.folderId,
      workspace.id,
      'deleteFolderAction'
    );

    // Delete folder (cascade deletes subfolders, sets parent_folder_id to NULL in files)
    await deleteFolder(validated.folderId);

    logger.info('Folder deleted successfully', {
      userId,
      folderId: validated.folderId,
    });

    return {
      success: true,
    } as const;
  }
);
