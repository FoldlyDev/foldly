// =============================================================================
// FILE ACTIONS - Global File CRUD Operations
// =============================================================================
// Used by: workspace module, uploads module, links module
// Handles file record creation, deletion, and querying operations

'use server';

// Import from global utilities
import { withAuth, withAuthInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFileOwnership } from '@/lib/utils/authorization';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getFileById,
  getWorkspaceFiles,
  getFilesByEmail,
  getFilesByDateRange,
  searchFiles,
  createFile,
  updateFileMetadata,
  deleteFile,
  bulkDeleteFiles,
} from '@/lib/database/queries';

// Import storage client
import { deleteFile as deleteFileFromStorage } from '@/lib/storage/client';

// Import rate limiting
import { checkRateLimit, RateLimitPresets, RateLimitKeys } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logRateLimitViolation, logSecurityEvent } from '@/lib/utils/logger';

// Import types
import type { File } from '@/lib/database/schemas';

// Import global validation schemas
import {
  validateInput,
  createFileSchema,
  updateFileMetadataSchema,
  deleteFileSchema,
  bulkDeleteFilesSchema,
  searchFilesSchema,
  getFilesByEmailSchema,
  UPLOADS_BUCKET_NAME,
  type CreateFileInput,
  type UpdateFileMetadataInput,
  type DeleteFileInput,
  type BulkDeleteFilesInput,
  type SearchFilesInput,
  type GetFilesByEmailInput,
} from '@/lib/validation';

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Get all files for the authenticated user's workspace
 * Rate limited: 100 requests per minute
 *
 * @returns Array of files for the user's workspace
 *
 * @example
 * ```typescript
 * const result = await getWorkspaceFilesAction();
 * if (result.success) {
 *   console.log('Files:', result.data);
 * }
 * ```
 */
export const getWorkspaceFilesAction = withAuth<File[]>(
  'getWorkspaceFilesAction',
  async (userId) => {
    // Rate limiting: 100 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'list-files');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('File read rate limit exceeded', {
        userId,
        action: 'getWorkspaceFilesAction',
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

    // Get all files for workspace
    const files = await getWorkspaceFiles(workspace.id);

    return {
      success: true,
      data: files,
    } as const;
  }
);

/**
 * Get files filtered by uploader email
 * Core feature for email-centric file collection
 * Rate limited: 100 requests per minute
 *
 * @param input - Object containing uploaderEmail
 * @returns Array of files uploaded by the specified email
 *
 * @example
 * ```typescript
 * const result = await getFilesByEmailAction({ uploaderEmail: 'john@example.com' });
 * if (result.success) {
 *   console.log('Files by john@example.com:', result.data);
 * }
 * ```
 */
export const getFilesByEmailAction = withAuthInput<
  GetFilesByEmailInput,
  File[]
>('getFilesByEmailAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(getFilesByEmailSchema, input);

  // Rate limiting: 100 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'get-files-by-email');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('File read by email rate limit exceeded', {
      userId,
      action: 'getFilesByEmailAction',
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

  // Get files by email
  const files = await getFilesByEmail(workspace.id, validated.uploaderEmail);

  return {
    success: true,
    data: files,
  } as const;
});

/**
 * Search files by filename or uploader email
 * Cross-folder search with fuzzy matching
 * Rate limited: 100 requests per minute
 *
 * @param input - Object containing search query
 * @returns Array of matching files
 *
 * @example
 * ```typescript
 * const result = await searchFilesAction({ query: 'invoice' });
 * if (result.success) {
 *   console.log('Search results:', result.data);
 * }
 * ```
 */
export const searchFilesAction = withAuthInput<SearchFilesInput, File[]>(
  'searchFilesAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(searchFilesSchema, input);

    // Rate limiting: 100 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'search-files');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.GENEROUS);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('File search rate limit exceeded', {
        userId,
        action: 'searchFilesAction',
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

    // Search files
    const files = await searchFiles(workspace.id, validated.query);

    return {
      success: true,
      data: files,
    } as const;
  }
);

// =============================================================================
// WRITE ACTIONS
// =============================================================================

/**
 * Create a file record after successful storage upload
 * This action is called after the file has been uploaded to storage
 * Rate limited: 20 requests per minute
 *
 * @param data - File metadata
 * @returns Created file record
 *
 * @example
 * ```typescript
 * const result = await createFileRecordAction({
 *   filename: 'invoice.pdf',
 *   fileSize: 1048576,
 *   mimeType: 'application/pdf',
 *   storagePath: 'workspace123/folder456/invoice.pdf',
 *   parentFolderId: 'folder_456',
 *   uploaderEmail: 'john@example.com'
 * });
 * ```
 */
export const createFileRecordAction = withAuthInput<CreateFileInput, File>(
  'createFileRecordAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createFileSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'create-file');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('File creation rate limit exceeded', {
        userId,
        action: 'createFileRecordAction',
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
      const { verifyFolderOwnership } = await import('@/lib/utils/authorization');
      await verifyFolderOwnership(
        validated.parentFolderId,
        workspace.id,
        'createFileRecordAction'
      );
    }

    // Create file record
    const file = await createFile({
      workspaceId: workspace.id,
      filename: validated.filename,
      fileSize: validated.fileSize,
      mimeType: validated.mimeType,
      storagePath: validated.storagePath,
      parentFolderId: validated.parentFolderId ?? null,
      linkId: validated.linkId ?? null,
      uploaderEmail: validated.uploaderEmail ?? null,
      uploaderName: validated.uploaderName ?? null,
      uploaderMessage: validated.uploaderMessage ?? null,
    });

    logger.info('File record created successfully', {
      userId,
      fileId: file.id,
      filename: file.filename,
      fileSize: file.fileSize,
    });

    return {
      success: true,
      data: file,
    } as const;
  }
);

/**
 * Update file metadata (filename, uploader info)
 * Validates ownership before updating
 * Rate limited: 20 requests per minute
 *
 * @param data - File metadata update data
 * @returns Updated file
 *
 * @example
 * ```typescript
 * const result = await updateFileMetadataAction({
 *   fileId: 'file_123',
 *   filename: 'renamed-invoice.pdf',
 * });
 * ```
 */
export const updateFileMetadataAction = withAuthInput<
  UpdateFileMetadataInput,
  File
>('updateFileMetadataAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(updateFileMetadataSchema, input);

  // Rate limiting: 20 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'update-file');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('File update rate limit exceeded', {
      userId,
      fileId: validated.fileId,
      action: 'updateFileMetadataAction',
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

  // Verify file ownership
  await verifyFileOwnership(
    validated.fileId,
    workspace.id,
    'updateFileMetadataAction'
  );

  // Update file metadata
  const updatedFile = await updateFileMetadata(validated.fileId, {
    filename: validated.filename,
    uploaderName: validated.uploaderName,
    uploaderMessage: validated.uploaderMessage,
  });

  logger.info('File metadata updated successfully', {
    userId,
    fileId: validated.fileId,
    fieldsUpdated: {
      filename: validated.filename !== undefined,
      uploaderName: validated.uploaderName !== undefined,
      uploaderMessage: validated.uploaderMessage !== undefined,
    },
  });

  return {
    success: true,
    data: updatedFile,
  } as const;
});

/**
 * Delete a file (both record and storage)
 * Validates ownership before deletion
 * CRITICAL: Storage-first deletion to prevent charging users for orphaned files
 * Users pay for storage - orphaned storage files = unethical billing
 * Rate limited: 20 requests per minute
 *
 * @param data - Object containing fileId
 * @returns Success status
 *
 * @example
 * ```typescript
 * const result = await deleteFileAction({ fileId: 'file_123' });
 * ```
 */
export const deleteFileAction = withAuthInput<DeleteFileInput, void>(
  'deleteFileAction',
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteFileSchema, input);

    // Rate limiting: 20 requests/minute (using global preset)
    const rateLimitKey = RateLimitKeys.userAction(userId, 'delete-file');
    const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

    if (!rateLimitResult.allowed) {
      logRateLimitViolation('File deletion rate limit exceeded', {
        userId,
        fileId: validated.fileId,
        action: 'deleteFileAction',
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

    // Verify file ownership and get file data
    const file = await verifyFileOwnership(
      validated.fileId,
      workspace.id,
      'deleteFileAction'
    );

    // Validate bucket configuration
    if (!UPLOADS_BUCKET_NAME) {
      logger.error('Uploads bucket not configured');
      return {
        success: false,
        error: ERROR_MESSAGES.STORAGE.NOT_CONFIGURED,
      } as const;
    }

    // CRITICAL: Delete from storage FIRST (users pay for storage)
    // Orphaned storage files = users charged for files they can't access (unethical)
    // Orphaned DB records = UI shows files that don't exist (fixable with retry)
    try {
      await deleteFileFromStorage({
        gcsPath: file.storagePath,
        bucket: UPLOADS_BUCKET_NAME,
      });
    } catch (error) {
      // Storage deletion failed - ABORT operation
      // User can retry, and storage will eventually be deleted
      logger.error('Failed to delete file from storage - aborting operation', {
        userId,
        fileId: validated.fileId,
        filename: file.filename,
        storagePath: file.storagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: 'Failed to delete file from storage. Please try again.',
      } as const;
    }

    // Storage deleted successfully - now delete database record
    // If this fails, we have orphaned DB record (acceptable - can be cleaned up)
    try {
      await deleteFile(validated.fileId);

      logger.info('File deleted successfully (storage + DB)', {
        userId,
        fileId: validated.fileId,
        filename: file.filename,
        storagePath: file.storagePath,
      });
    } catch (error) {
      // DB deletion failed but storage is already deleted
      // Log orphaned DB record for cleanup
      logger.warn('Orphaned DB record (storage deleted, DB delete failed)', {
        userId,
        fileId: validated.fileId,
        filename: file.filename,
        requiresCleanup: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Still return success - file is deleted from storage (primary concern)
      // DB record can be cleaned up via background job or user retry
    }

    return {
      success: true,
    } as const;
  }
);

/**
 * Bulk delete files (both records and storage)
 * CRITICAL: Validates ownership for ALL files before deletion (security requirement)
 * Storage-first deletion to prevent charging users for orphaned files
 * Rate limited: 20 requests per minute
 *
 * @param data - Object containing array of fileIds
 * @returns Success status with count of deleted files
 *
 * @example
 * ```typescript
 * const result = await bulkDeleteFilesAction({
 *   fileIds: ['file_123', 'file_456', 'file_789']
 * });
 * ```
 */
export const bulkDeleteFilesAction = withAuthInput<
  BulkDeleteFilesInput,
  { deletedCount: number }
>('bulkDeleteFilesAction', async (userId, input) => {
  // Validate input
  const validated = validateInput(bulkDeleteFilesSchema, input);

  // Rate limiting: 20 requests/minute (using global preset)
  const rateLimitKey = RateLimitKeys.userAction(userId, 'bulk-delete-files');
  const rateLimitResult = await checkRateLimit(rateLimitKey, RateLimitPresets.MODERATE);

  if (!rateLimitResult.allowed) {
    logRateLimitViolation('Bulk file deletion rate limit exceeded', {
      userId,
      fileCount: validated.fileIds.length,
      action: 'bulkDeleteFilesAction',
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

  // CRITICAL SECURITY: Verify ownership for ALL files before any deletion
  // This prevents unauthorized bulk deletion attacks
  const files: Array<{ id: string; storagePath: string; filename: string }> = [];
  for (const fileId of validated.fileIds) {
    const file = await verifyFileOwnership(
      fileId,
      workspace.id,
      'bulkDeleteFilesAction'
    );
    files.push({ id: file.id, storagePath: file.storagePath, filename: file.filename });
  }

  // Validate bucket configuration
  if (!UPLOADS_BUCKET_NAME) {
    logger.error('Uploads bucket not configured');
    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE.NOT_CONFIGURED,
    } as const;
  }

  // CRITICAL: Delete from storage FIRST (users pay for storage)
  // Only delete DB records for successfully deleted storage files
  const storageDeletePromises = files.map(async (file) => {
    try {
      await deleteFileFromStorage({
        gcsPath: file.storagePath,
        bucket: UPLOADS_BUCKET_NAME,
      });
      return { success: true, fileId: file.id, filename: file.filename };
    } catch (error) {
      logger.error('Failed to delete file from storage (bulk)', {
        userId,
        fileId: file.id,
        filename: file.filename,
        storagePath: file.storagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { success: false, fileId: file.id, filename: file.filename };
    }
  });

  const storageResults = await Promise.all(storageDeletePromises);
  const successfullyDeletedFiles = storageResults.filter((r) => r.success);
  const failedFiles = storageResults.filter((r) => !r.success);

  // Only delete database records for files successfully deleted from storage
  const successfulFileIds = successfullyDeletedFiles.map((r) => r.fileId);
  if (successfulFileIds.length > 0) {
    try {
      await bulkDeleteFiles(successfulFileIds);
      logger.info('Bulk file deletion completed', {
        userId,
        requestedCount: validated.fileIds.length,
        storageDeletedCount: successfulFileIds.length,
        dbDeletedCount: successfulFileIds.length,
        failedCount: failedFiles.length,
      });
    } catch (error) {
      // DB deletion failed but storage is already deleted
      // Log orphaned DB records for cleanup
      logger.warn('Orphaned DB records (storage deleted, DB delete failed)', {
        userId,
        fileIds: successfulFileIds,
        count: successfulFileIds.length,
        requiresCleanup: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Log failed deletions for user notification
  if (failedFiles.length > 0) {
    logger.warn('Some files could not be deleted from storage', {
      userId,
      failedFiles: failedFiles.map(f => ({ id: f.fileId, name: f.filename })),
      count: failedFiles.length,
    });
  }

  return {
    success: true,
    data: { deletedCount: successfulFileIds.length },
  } as const;
});
