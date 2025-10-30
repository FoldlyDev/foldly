// =============================================================================
// FOLDER ACTIONS - Global Folder CRUD Operations
// =============================================================================
// Used by: workspace module, links module, file organization
// Handles creation, reading, updating, moving, and deletion of folders

'use server';

// Import from global utilities
import { withAuth, withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFolderOwnership } from '@/lib/utils/authorization';
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
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { Folder } from '@/lib/database/schemas';

// Import global validation schemas
import {
  validateInput,
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
export const getRootFoldersAction = withAuth<Folder[]>(
  'getRootFoldersAction',
  async (userId) => {
    // Rate limiting: 100 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'list-folders');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Folder read rate limit exceeded', {
        userId,
        action: 'getRootFoldersAction',
        limit: RateLimitPresets.GENEROUS.limit,
        window: RateLimitPresets.GENEROUS.windowMs,
        attempts: RateLimitPresets.GENEROUS.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

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
export const getFolderHierarchyAction = withAuthInput<
  GetFolderHierarchyInput,
  Folder[]
>('getFolderHierarchyAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(getFolderHierarchySchema, input);

  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'get-folder-hierarchy');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Folder hierarchy rate limit exceeded', {
      userId,
      folderId: validated.folderId,
      action: 'getFolderHierarchyAction',
      limit: RateLimitPresets.GENEROUS.limit,
      window: RateLimitPresets.GENEROUS.windowMs,
      attempts: RateLimitPresets.GENEROUS.limit - rateLimitResult.remaining,
    });

    throw {
      success: false,
      error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
      blocked: true,
      resetAt: rateLimitResult.resetAt,
    } as const;
  }

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
export const createFolderAction = withAuthInput<CreateFolderInput, Folder>(
  'createFolderAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createFolderSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'create-folder');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Folder creation rate limit exceeded', {
        userId,
        action: 'createFolderAction',
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // If parentFolderId is provided, verify it exists and belongs to workspace
    if (validated.parentFolderId) {
      await verifyFolderOwnership(
        validated.parentFolderId,
        workspace.id,
        'createFolderAction'
      );

      // Check nesting depth: Parent must be < 20 (so child will be ≤ 20)
      const parentDepth = await getFolderDepth(validated.parentFolderId);
      if (parentDepth >= VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH) {
        logSecurityEvent('folderNestingLimitExceeded', {
          userId,
          parentFolderId: validated.parentFolderId,
          parentDepth,
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
export const updateFolderAction = withAuthInput<UpdateFolderInput, Folder>(
  'updateFolderAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(updateFolderSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'update-folder');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Folder update rate limit exceeded', {
        userId,
        folderId: validated.folderId,
        action: 'updateFolderAction',
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

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
export const moveFolderAction = withAuthInput<MoveFolderInput, Folder>(
  'moveFolderAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(moveFolderSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'move-folder');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Folder move rate limit exceeded', {
        userId,
        folderId: validated.folderId,
        action: 'moveFolderAction',
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify folder ownership
    const existingFolder = await verifyFolderOwnership(
      validated.folderId,
      workspace.id,
      'moveFolderAction'
    );

    // If newParentId is provided, verify it exists and belongs to workspace
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

      // Check nesting depth: New parent must be < 20 (so moved folder will be ≤ 20)
      const newParentDepth = await getFolderDepth(validated.newParentId);
      if (newParentDepth >= VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH) {
        logSecurityEvent('folderNestingLimitExceeded', {
          userId,
          folderId: validated.folderId,
          newParentId: validated.newParentId,
          newParentDepth,
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

    // Move folder (update parentFolderId)
    const updatedFolder = await updateFolder(validated.folderId, {
      parentFolderId: validated.newParentId,
    });

    logger.info('Folder moved successfully', {
      userId,
      folderId: validated.folderId,
      oldParentId: existingFolder.parentFolderId,
      newParentId: validated.newParentId,
    });

    return {
      success: true,
      data: updatedFolder,
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
export const deleteFolderAction = withAuthInput<DeleteFolderInput, void>(
  'deleteFolderAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteFolderSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'delete-folder');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('Folder deletion rate limit exceeded', {
        userId,
        folderId: validated.folderId,
        action: 'deleteFolderAction',
        limit: RateLimitPresets.MODERATE.limit,
        window: RateLimitPresets.MODERATE.windowMs,
        attempts: RateLimitPresets.MODERATE.limit - rateLimitResult.remaining,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMIT.EXCEEDED,
        blocked: true,
        resetAt: rateLimitResult.resetAt,
      } as const;
    }

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
