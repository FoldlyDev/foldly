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
  getFoldersByParent,
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
  getFoldersByParentSchema,
  type CreateFolderInput,
  type UpdateFolderInput,
  type MoveFolderInput,
  type DeleteFolderInput,
  type GetFolderHierarchyInput,
  type GetFoldersByParentInput,
} from '@/lib/validation';

// Import constants
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Get all root folders for the authenticated user's workspace
 * Root folders have parentFolderId = NULL
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @returns Action response with array of root folders for the user's workspace
 *
 * @example
 * ```typescript
 * const result = await getRootFoldersAction();
 * if (result.success) {
 *   console.log('Root folders:', result.data); // Folder[]
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
 * Get folders by parent (root or child folders)
 * Universal action for folder navigation
 *
 * @param input - Folders by parent input
 * @param input.parentFolderId - Parent folder ID (null for root folders)
 * @returns Action response with array of folders at the specified location
 *
 * @example
 * ```typescript
 * const result = await getFoldersByParentAction({ parentFolderId: null });
 * if (result.success) {
 *   console.log('Root folders:', result.data);
 * }
 * ```
 */
export const getFoldersByParentAction = withAuthInputAndRateLimit<GetFoldersByParentInput, Folder[]>(
  'getFoldersByParentAction',
  RateLimitPresets.GENEROUS,
  async (userId, input) => {
    const validatedInput = validateInput(getFoldersByParentSchema, input);
    const workspace = await getAuthenticatedWorkspace(userId);
    const folders = await getFoldersByParent(workspace.id, validatedInput.parentFolderId);

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
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @param input - Folder hierarchy input
 * @param input.folderId - ID of the folder to get hierarchy for
 * @returns Action response with array of folders in hierarchy order (root to current)
 * @throws Error if folder not found or doesn't belong to user's workspace
 *
 * @example
 * ```typescript
 * const result = await getFolderHierarchyAction({ folderId: 'folder_123' });
 * if (result.success) {
 *   console.log('Breadcrumb:', result.data); // [rootFolder, parentFolder, currentFolder]
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
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Folder creation input
 * @param input.name - Folder name (1-255 characters)
 * @param input.parentFolderId - Optional parent folder ID (null or undefined for root folder)
 * @param input.linkId - Optional link ID if folder is associated with a shareable link
 * @param input.uploaderEmail - Optional uploader email for external uploads
 * @param input.uploaderName - Optional uploader name for external uploads
 * @returns Action response with created folder data
 * @throws Error if nesting depth limit (20 levels) would be exceeded
 * @throws Error if folder name already exists in parent context
 * @throws Error if parent folder not found or doesn't belong to user's workspace
 *
 * @example
 * ```typescript
 * // Create root folder
 * const result = await createFolderAction({ name: 'Tax Documents' });
 *
 * // Create nested folder
 * const result = await createFolderAction({
 *   name: '2024 Returns',
 *   parentFolderId: 'folder_123'
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
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Folder update input
 * @param input.folderId - ID of the folder to update
 * @param input.name - New folder name (1-255 characters)
 * @returns Action response with updated folder data
 * @throws Error if folder not found or doesn't belong to user's workspace
 * @throws Error if new name already exists in same parent context
 *
 * @example
 * ```typescript
 * const result = await updateFolderAction({
 *   folderId: 'folder_123',
 *   name: 'Updated Folder Name',
 * });
 * if (result.success) {
 *   console.log(result.data.name); // "Updated Folder Name"
 * }
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
 * Uses database transaction for atomicity
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Move folder input
 * @param input.folderId - ID of the folder to move
 * @param input.newParentId - ID of the new parent folder (null or undefined to move to root)
 * @returns Action response with updated folder data
 * @throws Error if folder not found or doesn't belong to user's workspace
 * @throws Error if circular reference detected (moving folder into itself or its descendant)
 * @throws Error if nesting depth limit (20 levels) would be exceeded
 * @throws Error if folder name already exists in destination
 *
 * @example
 * ```typescript
 * // Move to root
 * const result = await moveFolderAction({
 *   folderId: 'folder_123',
 *   newParentId: null
 * });
 *
 * // Move to another folder
 * const result = await moveFolderAction({
 *   folderId: 'folder_123',
 *   newParentId: 'folder_456'
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

    // Early return if folder is already in target location (idempotent no-op)
    // Normalize both values to handle null vs undefined comparison
    const normalizedNewParentId = validated.newParentId ?? null;
    const normalizedCurrentParentId = existingFolder.parentFolderId ?? null;

    if (normalizedNewParentId === normalizedCurrentParentId) {
      logger.info('Folder already in target location (no-op)', {
        userId,
        folderId: validated.folderId,
        parentFolderId: normalizedCurrentParentId,
      });

      // Return success with existing folder data (idempotent operation)
      return {
        success: true,
        data: existingFolder,
      } as const;
    }

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
 * Note: Cascade deletes all subfolders; files have their parent_folder_id set to NULL (preserving file accessibility)
 * Folders are purely database entities with no storage representation
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Folder deletion input
 * @param input.folderId - ID of the folder to delete
 * @returns Action response with success status
 * @throws Error if folder not found or doesn't belong to user's workspace
 *
 * @example
 * ```typescript
 * const result = await deleteFolderAction({ folderId: 'folder_123' });
 * if (result.success) {
 *   console.log('Folder and subfolders deleted successfully');
 * }
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
