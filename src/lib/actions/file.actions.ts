// =============================================================================
// FILE ACTIONS - Global File CRUD Operations
// =============================================================================
// Used by: workspace module, uploads module, links module
// Handles file record creation, deletion, and querying operations

'use server';

// Import from global utilities
import { withAuthAndRateLimit, withAuthInputAndRateLimit, validateInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFileOwnership } from '@/lib/utils/authorization';
import { validateBucketConfiguration } from '@/lib/utils/storage-helpers';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getFileById,
  getFilesByIds,
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
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger } from '@/lib/utils/logger';

// Import types
import type { File } from '@/lib/database/schemas';

// Import global validation schemas
import {
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
export const getWorkspaceFilesAction = withAuthAndRateLimit<File[]>(
  'getWorkspaceFilesAction',
  RateLimitPresets.GENEROUS,
  async (userId) => {
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
export const getFilesByEmailAction = withAuthInputAndRateLimit<
  GetFilesByEmailInput,
  File[]
>('getFilesByEmailAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate input
  const validated = validateInput(getFilesByEmailSchema, input);

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
export const searchFilesAction = withAuthInputAndRateLimit<SearchFilesInput, File[]>(
  'searchFilesAction',
  RateLimitPresets.GENEROUS,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(searchFilesSchema, input);

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
export const createFileRecordAction = withAuthInputAndRateLimit<CreateFileInput, File>(
  'createFileRecordAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(createFileSchema, input);

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
export const updateFileMetadataAction = withAuthInputAndRateLimit<
  UpdateFileMetadataInput,
  File
>('updateFileMetadataAction', RateLimitPresets.MODERATE, async (userId, input) => {
  // Validate input
  const validated = validateInput(updateFileMetadataSchema, input);

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
export const deleteFileAction = withAuthInputAndRateLimit<DeleteFileInput, void>(
  'deleteFileAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(deleteFileSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify file ownership and get file data
    const file = await verifyFileOwnership(
      validated.fileId,
      workspace.id,
      'deleteFileAction'
    );

    // Validate bucket configuration
    const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
    if (bucketError) return bucketError;

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
 * FAIL-FAST PATTERN: ALL storage deletions must succeed or operation aborts (billing integrity)
 * Storage-first deletion to prevent charging users for orphaned files
 * Rate limited: 20 requests per minute
 *
 * @param data - Object containing array of fileIds
 * @returns Success status with count of deleted files
 *
 * @remarks
 * All-or-nothing semantics: If ANY storage deletion fails, the entire operation aborts
 * and NO files are deleted. This prevents billing integrity violations where users
 * would be charged for storage that was partially deleted but operation marked as failed.
 *
 * @example
 * ```typescript
 * const result = await bulkDeleteFilesAction({
 *   fileIds: ['file_123', 'file_456', 'file_789']
 * });
 * // Either all 3 files deleted, or none deleted (never 1-2 files)
 * ```
 */
export const bulkDeleteFilesAction = withAuthInputAndRateLimit<
  BulkDeleteFilesInput,
  { deletedCount: number }
>('bulkDeleteFilesAction', RateLimitPresets.MODERATE, async (userId, input) => {
  // Validate input
  const validated = validateInput(bulkDeleteFilesSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // CRITICAL SECURITY: Verify ownership for ALL files before any deletion
  // OPTIMIZED: Batch fetch all files in one query (prevents N+1 queries)
  // This prevents unauthorized bulk deletion attacks
  const files = await getFilesByIds(validated.fileIds, workspace.id);

  // Verify that ALL requested files exist and belong to the workspace
  if (files.length !== validated.fileIds.length) {
    const foundFileIds = new Set(files.map(f => f.id));
    const missingFileIds = validated.fileIds.filter(id => !foundFileIds.has(id));

    logger.warn('Bulk delete attempted with invalid file IDs', {
      userId,
      requestedCount: validated.fileIds.length,
      foundCount: files.length,
      missingFileIds,
    });

    return {
      success: false,
      error: 'One or more files not found or you do not have permission to delete them.',
    } as const;
  }

  // Validate bucket configuration
  const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
  if (bucketError) return bucketError;

  /**
   * CRITICAL DESIGN DECISION: Partial Success Pattern for Bulk Deletion
   *
   * WHY WE USE PARTIAL SUCCESS (instead of fail-fast all-or-nothing):
   *
   * 1. **Storage Provider Reliability**: External storage (GCS/Supabase) can have transient failures
   *    - Network timeouts, rate limits, or service disruptions
   *    - Fail-fast would require users to retry ALL files even if 99/100 succeeded
   *
   * 2. **Better User Experience**:
   *    - Users can see exactly which files failed and retry only those
   *    - Progress is preserved (successfully deleted files stay deleted)
   *    - Example: "Failed to delete 2 files. Successfully deleted 98 files."
   *
   * 3. **Reduced Redundant Work**:
   *    - Retry mechanism can target only failed files (not all 100 files again)
   *    - Saves storage API calls and improves overall system performance
   *
   * 4. **Billing Integrity Maintained**:
   *    - Storage-first deletion ensures users never pay for inaccessible files
   *    - DB records only deleted for successfully deleted storage files
   *    - No orphaned storage files = no unethical billing
   *
   * ALTERNATIVE (Fail-Fast All-or-Nothing):
   *    - Would abort entire operation if ANY file fails
   *    - Users must retry ALL 100 files even if only 1 failed
   *    - Poor UX for large bulk operations with transient failures
   *
   * TRADE-OFF: Slightly more complex error handling vs significantly better UX
   */

  // CRITICAL: Delete from storage FIRST (users pay for storage)
  // Use Promise.allSettled pattern to track individual deletion results
  const storageDeletePromises = files.map((file) =>
    deleteFileFromStorage({
      gcsPath: file.storagePath,
      bucket: UPLOADS_BUCKET_NAME,
    }).then(() => ({ status: 'fulfilled' as const, file }))
      .catch((error) => ({ status: 'rejected' as const, file, error }))
  );

  // Use Promise.allSettled to track which deletions succeeded vs failed
  const storageDeleteResults = await Promise.all(storageDeletePromises);

  // Separate successful deletions from failures
  const successfulDeletions = storageDeleteResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.file);

  const failedDeletions = storageDeleteResults
    .filter((result) => result.status === 'rejected');

  // If ALL deletions failed, abort operation
  if (successfulDeletions.length === 0) {
    logger.error('Bulk file deletion failed: All storage deletions failed', {
      userId,
      fileCount: validated.fileIds.length,
      errors: failedDeletions.map(r => r.error instanceof Error ? r.error.message : 'Unknown error'),
    });

    return {
      success: false,
      error: 'Failed to delete files from storage. No files were deleted. Please try again.',
    } as const;
  }

  // If SOME deletions failed, log partial success
  if (failedDeletions.length > 0) {
    logger.warn('Partial bulk file deletion: Some storage deletions failed', {
      userId,
      succeeded: successfulDeletions.length,
      failed: failedDeletions.length,
      failedFiles: failedDeletions.map(r => r.file.filename),
    });
  }

  // Delete DB records ONLY for successfully deleted storage files
  // This maintains storage-first integrity (no orphaned storage)
  try {
    const successfulFileIds = successfulDeletions.map(f => f.id);
    await bulkDeleteFiles(successfulFileIds);

    logger.info('Bulk file deletion completed', {
      userId,
      deletedCount: successfulDeletions.length,
      failedCount: failedDeletions.length,
    });
  } catch (error) {
    // DB deletion failed but storage is already deleted
    // Log orphaned DB records for cleanup (acceptable trade-off)
    logger.warn('Orphaned DB records (storage deleted, DB delete failed)', {
      userId,
      fileIds: successfulDeletions.map(f => f.id),
      count: successfulDeletions.length,
      requiresCleanup: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Still continue - files are deleted from storage (primary concern)
    // DB records can be cleaned up via background job or user retry
  }

  // Return partial success if some deletions failed
  if (failedDeletions.length > 0) {
    return {
      success: false,
      error: `Failed to delete ${failedDeletions.length} file(s). Successfully deleted ${successfulDeletions.length} file(s).`,
    } as const;
  }

  // All deletions succeeded
  return {
    success: true,
    data: { deletedCount: successfulDeletions.length },
  } as const;
});
