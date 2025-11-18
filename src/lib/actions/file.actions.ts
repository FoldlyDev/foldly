// =============================================================================
// FILE ACTIONS - Global File CRUD Operations
// =============================================================================
// Used by: workspace module, uploads module, links module
// Handles file record creation, deletion, and querying operations

'use server';

// Import from global utilities
import { withAuthAndRateLimit, withAuthInputAndRateLimit, validateInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFileOwnership, verifyFolderOwnership } from '@/lib/utils/authorization';
import { validateBucketConfiguration } from '@/lib/utils/storage-helpers';
import { createZipFromFiles, type FileForDownload } from '@/lib/utils/download-helpers';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getFileById,
  getFilesByIds,
  getWorkspaceFiles,
  getFilesByFolder,
  getFilesByEmail,
  getFilesByDateRange,
  searchFiles,
  createFile,
  updateFileMetadata,
  deleteFile,
  bulkDeleteFiles,
  checkFilenameExists,
  getFolderById,
  getFolderTreeFiles,
} from '@/lib/database/queries';

// Import storage client
import { deleteFile as deleteFileFromStorage, getSignedUrl } from '@/lib/storage/client';

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
  moveFileSchema,
  deleteFileSchema,
  bulkDeleteFilesSchema,
  bulkDownloadFilesSchema,
  bulkDownloadMixedSchema,
  searchFilesSchema,
  getFilesByEmailSchema,
  getFilesByFolderSchema,
  UPLOADS_BUCKET_NAME,
  type CreateFileInput,
  type UpdateFileMetadataInput,
  type MoveFileInput,
  type DeleteFileInput,
  type BulkDeleteFilesInput,
  type BulkDownloadFilesInput,
  type BulkDownloadMixedInput,
  type SearchFilesInput,
  type GetFilesByEmailInput,
  type GetFilesByFolderInput,
} from '@/lib/validation';

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Get all files for the authenticated user's workspace
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @returns Action response with array of files for the user's workspace
 *
 * @example
 * ```typescript
 * const result = await getWorkspaceFilesAction();
 * if (result.success) {
 *   console.log('Files:', result.data); // File[]
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
 * Get files by folder (root or specific folder)
 * Universal action for folder navigation
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @param input - Files by folder input
 * @param input.parentFolderId - Parent folder ID (null for root files)
 * @returns Action response with array of files in the specified folder
 *
 * @example
 * ```typescript
 * // Get root-level files
 * const rootResult = await getFilesByFolderAction({ parentFolderId: null });
 * if (rootResult.success) {
 *   console.log('Root files:', rootResult.data); // File[]
 * }
 *
 * // Get files in a specific folder
 * const folderResult = await getFilesByFolderAction({ parentFolderId: 'folder_123' });
 * if (folderResult.success) {
 *   console.log('Folder files:', folderResult.data); // File[]
 * }
 * ```
 */
export const getFilesByFolderAction = withAuthInputAndRateLimit<GetFilesByFolderInput, File[]>(
  'getFilesByFolderAction',
  RateLimitPresets.GENEROUS,
  async (userId, input) => {
    // Validate input
    const validatedInput = validateInput(getFilesByFolderSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Get files by folder
    const files = await getFilesByFolder(workspace.id, validatedInput.parentFolderId);

    return {
      success: true,
      data: files,
    } as const;
  }
);

/**
 * Get files filtered by uploader email
 * Core feature for email-centric file collection
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @param input - Files by email input
 * @param input.uploaderEmail - Email address of the uploader (normalized lowercase)
 * @returns Action response with array of files uploaded by the specified email
 *
 * @example
 * ```typescript
 * const result = await getFilesByEmailAction({ uploaderEmail: 'john@example.com' });
 * if (result.success) {
 *   console.log('Files by john@example.com:', result.data); // File[]
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
 * Cross-folder search with fuzzy matching using PostgreSQL full-text search
 * Searches across filename and uploader email fields
 * Rate limited: 100 requests per minute (GENEROUS preset)
 *
 * @param input - Search input
 * @param input.query - Search query string (1-100 characters) - searches filename and uploader email
 * @returns Action response with array of matching files
 *
 * @example
 * ```typescript
 * const result = await searchFilesAction({ query: 'invoice' });
 * if (result.success) {
 *   console.log('Search results:', result.data); // File[]
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
 * IMPORTANT: Storage upload must complete BEFORE calling this action
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - File creation input
 * @param input.filename - Original filename (1-255 characters)
 * @param input.fileSize - File size in bytes (max 100MB per VALIDATION_LIMITS)
 * @param input.mimeType - MIME type (e.g., 'application/pdf', 'image/png')
 * @param input.storagePath - Path to file in storage bucket (GCS path format)
 * @param input.parentFolderId - Optional parent folder ID (null for root-level files)
 * @param input.linkId - Optional shareable link ID if uploaded via link
 * @param input.uploaderEmail - Email address of uploader (required for tracking)
 * @param input.uploaderName - Optional name of uploader
 * @param input.uploaderMessage - Optional message from uploader
 * @returns Action response with created file record
 * @throws Error if parent folder not found or doesn't belong to user's workspace
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
 * if (result.success) {
 *   console.log('File record created:', result.data.id);
 * }
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

    // Note: Duplicate detection already handled in initiateUploadAction
    // The filename passed here is already unique (Windows-style: photo.jpg → photo (1).jpg)

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
 * Does NOT modify the actual file in storage - only the database record
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - File metadata update input
 * @param input.fileId - ID of the file to update
 * @param input.filename - Optional new filename (1-255 characters)
 * @param input.uploaderName - Optional uploader name to update
 * @param input.uploaderMessage - Optional uploader message to update
 * @returns Action response with updated file data
 * @throws Error if file not found or doesn't belong to user's workspace
 *
 * @example
 * ```typescript
 * const result = await updateFileMetadataAction({
 *   fileId: 'file_123',
 *   filename: 'renamed-invoice.pdf',
 *   uploaderName: 'John Smith'
 * });
 * if (result.success) {
 *   console.log('File updated:', result.data.filename);
 * }
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
 * Move a file to a new parent folder
 * Validates ownership, verifies destination folder, and checks for duplicate filenames
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Move file input
 * @param input.fileId - ID of the file to move
 * @param input.newParentId - ID of the new parent folder (null or undefined to move to root)
 * @returns Action response with updated file data
 * @throws Error if file not found or doesn't belong to user's workspace
 * @throws Error if destination folder doesn't exist or doesn't belong to user's workspace
 * @throws Error if file with same name already exists in destination
 *
 * @example
 * ```typescript
 * // Move to root
 * const result = await moveFileAction({
 *   fileId: 'file_123',
 *   newParentId: null
 * });
 *
 * // Move to another folder
 * const result = await moveFileAction({
 *   fileId: 'file_123',
 *   newParentId: 'folder_456'
 * });
 * ```
 */
export const moveFileAction = withAuthInputAndRateLimit<MoveFileInput, File>(
  'moveFileAction',
  RateLimitPresets.MODERATE,
  async (userId, input) => {
    // Validate input
    const validated = validateInput(moveFileSchema, input);

    // Get user's workspace
    const workspace = await getAuthenticatedWorkspace(userId);

    // Verify file ownership
    const existingFile = await verifyFileOwnership(
      validated.fileId,
      workspace.id,
      'moveFileAction'
    );

    // Early return if file is already in target location (idempotent no-op)
    // Normalize both values to handle null vs undefined comparison
    const normalizedNewParentId = validated.newParentId ?? null;
    const normalizedCurrentParentId = existingFile.parentFolderId ?? null;

    if (normalizedNewParentId === normalizedCurrentParentId) {
      logger.info('File already in target location (no-op)', {
        userId,
        fileId: validated.fileId,
        parentFolderId: normalizedCurrentParentId,
      });

      // Return success with existing file data (idempotent operation)
      return {
        success: true,
        data: existingFile,
      } as const;
    }

    // Verify destination folder exists and belongs to workspace (if moving to folder)
    if (validated.newParentId) {
      await verifyFolderOwnership(
        validated.newParentId,
        workspace.id,
        'moveFileAction'
      );
    }

    // Check filename uniqueness in new location
    const filenameExists = await checkFilenameExists(
      validated.newParentId,
      existingFile.filename
    );

    if (filenameExists) {
      logger.warn('File with same name already exists in destination', {
        userId,
        fileId: validated.fileId,
        filename: existingFile.filename,
        newParentId: validated.newParentId,
      });
      throw {
        success: false,
        error: 'A file with this name already exists in the destination folder.',
      } as const;
    }

    // Move file (update parentFolderId)
    const updatedFile = await updateFileMetadata(validated.fileId, {
      parentFolderId: validated.newParentId,
    });

    logger.info('File moved successfully', {
      userId,
      fileId: validated.fileId,
      oldParentId: existingFile.parentFolderId,
      newParentId: validated.newParentId,
    });

    return {
      success: true,
      data: updatedFile,
    } as const;
  }
);

/**
 * Delete a file (both record and storage)
 * Validates ownership before deletion
 * CRITICAL: Storage-first deletion to prevent charging users for orphaned files
 * Users pay for storage - orphaned storage files = unethical billing
 * Pattern: Delete storage FIRST, then DB record
 * If storage deletion fails, operation aborts (user can retry)
 * If DB deletion fails after storage success, orphaned DB record logged for cleanup
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - File deletion input
 * @param input.fileId - ID of the file to delete
 * @returns Action response with success status
 * @throws Error if file not found or doesn't belong to user's workspace
 * @throws Error if storage deletion fails (operation aborted, user should retry)
 *
 * @example
 * ```typescript
 * const result = await deleteFileAction({ fileId: 'file_123' });
 * if (result.success) {
 *   console.log('File deleted successfully (storage + DB)');
 * }
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
 * PARTIAL SUCCESS PATTERN: Deletes storage first, only removes DB records for successful deletions
 * Storage-first deletion to prevent charging users for orphaned files
 * Rate limited: 20 requests per minute (MODERATE preset)
 *
 * @param input - Bulk file deletion input
 * @param input.fileIds - Array of file IDs to delete (1-100 files per request)
 * @returns Action response with count of successfully deleted files
 * @throws Error if any file not found or doesn't belong to user's workspace
 *
 * @remarks
 * Partial success semantics: For each file, delete storage FIRST. Only delete DB records
 * for files where storage deletion succeeded. This prevents billing integrity violations
 * while maximizing successful deletions. Users see which files failed and can retry.
 *
 * Design decision documented in code (lines 445-474) explains why partial success
 * is better than fail-fast all-or-nothing for bulk operations.
 *
 * @example
 * ```typescript
 * const result = await bulkDeleteFilesAction({
 *   fileIds: ['file_123', 'file_456', 'file_789']
 * });
 * if (result.success) {
 *   console.log(`Deleted ${result.data.deletedCount} files`);
 *   // Could be 3, 2, 1, or 0 depending on storage deletion success
 * }
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

// =============================================================================
// FILE ACCESS ACTIONS
// =============================================================================

/**
 * Get signed URL for file preview/download
 * Returns temporary URL for accessing private storage files
 *
 * Used by:
 * - Workspace file thumbnails (image previews)
 * - File download functionality
 * - File preview modals
 *
 * Security:
 * - Verifies file ownership before granting access
 * - URLs expire after 24 hours (configurable)
 * - Only works for files in user's workspace
 *
 * @param fileId - UUID of the file to access
 * @returns Signed URL valid for 24 hours
 *
 * @example
 * ```typescript
 * const result = await getFileSignedUrlAction({ fileId: 'file_123' });
 * if (result.success) {
 *   // Display image: <img src={result.data} />
 *   // Or download: window.open(result.data);
 * }
 * ```
 */
export const getFileSignedUrlAction = withAuthInputAndRateLimit<
  DeleteFileInput,
  string
>('getFileSignedUrlAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate input
  const validated = validateInput(deleteFileSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify file ownership and get file data (throws if not found/unauthorized)
  const file = await verifyFileOwnership(
    validated.fileId,
    workspace.id,
    'getFileSignedUrlAction'
  );

  // Validate bucket configuration
  const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
  if (bucketError) return bucketError;

  // Generate signed URL (24 hour expiry)
  const signedUrl = await getSignedUrl({
    gcsPath: file.storagePath,
    bucket: UPLOADS_BUCKET_NAME,
    expiresIn: 86400, // 24 hours in seconds
  });

  logger.info('File signed URL generated', {
    userId,
    fileId: file.id,
    filename: file.filename,
  });

  return {
    success: true,
    data: signedUrl,
  } as const;
});

// =============================================================================
// FILE DOWNLOAD ACTIONS
// =============================================================================

/**
 * Download multiple files as a ZIP archive
 * Creates a ZIP containing all specified files from user's workspace
 *
 * Used by:
 * - Workspace bulk file download
 * - Multi-select file operations
 *
 * Security:
 * - Verifies all files belong to user's workspace
 * - Generates temporary signed URLs for ZIP creation
 * - Maximum 100 files per download (validation limit)
 *
 * @param fileIds - Array of file UUIDs to download (max 100)
 * @returns ZIP archive as number array (serializable across server/client boundary)
 *
 * @example
 * ```typescript
 * const result = await bulkDownloadFilesAction({
 *   fileIds: ['file_1', 'file_2', 'file_3']
 * });
 * if (result.success) {
 *   // Create download: const blob = new Blob([new Uint8Array(result.data)], { type: 'application/zip' });
 * }
 * ```
 */
export const bulkDownloadFilesAction = withAuthInputAndRateLimit<
  BulkDownloadFilesInput,
  number[]
>('bulkDownloadFilesAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate input
  const validated = validateInput(bulkDownloadFilesSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Validate bucket configuration
  const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
  if (bucketError) return bucketError;

  // Get all files and verify ownership
  const files = await getFilesByIds(validated.fileIds, workspace.id);

  // Verify all files exist and belong to user's workspace
  const unauthorizedFiles = files.filter((file) => file.workspaceId !== workspace.id);
  if (unauthorizedFiles.length > 0) {
    logger.warn('Attempted download of unauthorized files', {
      userId,
      workspaceId: workspace.id,
      fileIds: unauthorizedFiles.map((f) => f.id),
    });

    return {
      success: false,
      error: ERROR_MESSAGES.FILE.ACCESS_DENIED,
    } as const;
  }

  // Check if all requested files were found
  if (files.length !== validated.fileIds.length) {
    logger.warn('Some files not found for bulk download', {
      userId,
      requestedCount: validated.fileIds.length,
      foundCount: files.length,
    });

    return {
      success: false,
      error: 'One or more files were not found.',
    } as const;
  }

  // Generate signed URLs for all files
  const filesForDownload: FileForDownload[] = await Promise.all(
    files.map(async (file) => {
      const signedUrl = await getSignedUrl({
        gcsPath: file.storagePath,
        bucket: UPLOADS_BUCKET_NAME,
        expiresIn: 3600, // 1 hour for ZIP creation
      });

      return {
        filename: file.filename,
        signedUrl,
      };
    })
  );

  // Create ZIP archive
  const zipBuffer = await createZipFromFiles(filesForDownload, 'files');

  logger.info('Bulk file download completed', {
    userId,
    workspaceId: workspace.id,
    fileCount: files.length,
    zipSizeBytes: zipBuffer.length,
  });

  // Convert Buffer to number array for Next.js serialization
  // Buffers/Uint8Arrays cannot be serialized across server/client boundary
  return {
    success: true,
    data: Array.from(zipBuffer),
  } as const;
});

/**
 * Download files and folders as a single ZIP archive (mixed selection)
 * Creates a ZIP containing selected files (at root) and selected folders (with structure)
 *
 * Used by:
 * - Workspace bulk download (mixed file/folder selection)
 *
 * Security:
 * - Verifies all files and folders belong to user's workspace
 * - Generates temporary signed URLs for ZIP creation
 * - Maximum 100 items total (validation limit)
 *
 * ZIP Structure:
 * - Selected files appear at root level
 * - Selected folders appear with full hierarchy preserved
 *
 * @param fileIds - Array of file UUIDs to download at root level
 * @param folderIds - Array of folder UUIDs to download with structure
 * @returns ZIP archive as number array (serializable across server/client boundary)
 *
 * @example
 * ```typescript
 * const result = await bulkDownloadMixedAction({
 *   fileIds: ['file_1', 'file_2'],
 *   folderIds: ['folder_1']
 * });
 * if (result.success) {
 *   // Creates: download.zip with file_1, file_2 (at root) + Folder1/ (with contents)
 * }
 * ```
 */
export const bulkDownloadMixedAction = withAuthInputAndRateLimit<
  BulkDownloadMixedInput,
  number[]
>('bulkDownloadMixedAction', RateLimitPresets.GENEROUS, async (userId, input) => {
  // Validate input
  const validated = validateInput(bulkDownloadMixedSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Validate bucket configuration
  const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
  if (bucketError) return bucketError;

  const allFilesForDownload: FileForDownload[] = [];

  // Process directly selected files (root level in ZIP)
  if (validated.fileIds.length > 0) {
    const files = await getFilesByIds(validated.fileIds, workspace.id);

    // Verify ownership
    const unauthorizedFiles = files.filter((file) => file.workspaceId !== workspace.id);
    if (unauthorizedFiles.length > 0) {
      logger.warn('Attempted download of unauthorized files', {
        userId,
        workspaceId: workspace.id,
        fileIds: unauthorizedFiles.map((f) => f.id),
      });

      return {
        success: false,
        error: ERROR_MESSAGES.FILE.ACCESS_DENIED,
      } as const;
    }

    // Check if all requested files were found
    if (files.length !== validated.fileIds.length) {
      logger.warn('Some files not found for bulk download', {
        userId,
        requestedCount: validated.fileIds.length,
        foundCount: files.length,
      });

      return {
        success: false,
        error: 'One or more files were not found.',
      } as const;
    }

    // Generate signed URLs for root-level files
    const rootFiles = await Promise.all(
      files.map(async (file) => {
        const signedUrl = await getSignedUrl({
          gcsPath: file.storagePath,
          bucket: UPLOADS_BUCKET_NAME,
          expiresIn: 3600,
        });

        return {
          filename: file.filename,
          signedUrl,
          // No folderPath = root level in ZIP
        };
      })
    );

    allFilesForDownload.push(...rootFiles);
  }

  // Process selected folders (with hierarchy preserved in ZIP)
  if (validated.folderIds.length > 0) {
    for (const folderId of validated.folderIds) {
      // Verify folder ownership
      const folder = await getFolderById(folderId);
      if (!folder || folder.workspaceId !== workspace.id) {
        logger.warn('Attempted download of unauthorized folder', {
          userId,
          workspaceId: workspace.id,
          folderId,
        });

        return {
          success: false,
          error: ERROR_MESSAGES.FOLDER.ACCESS_DENIED,
        } as const;
      }

      // Get all files in folder tree (with folder paths)
      const folderFiles = await getFolderTreeFiles(folderId, workspace.id);

      // Generate signed URLs for folder files
      const folderFilesForDownload = await Promise.all(
        folderFiles.map(async (file) => {
          const signedUrl = await getSignedUrl({
            gcsPath: file.storagePath,
            bucket: UPLOADS_BUCKET_NAME,
            expiresIn: 3600,
          });

          return {
            filename: file.filename,
            signedUrl,
            folderPath: file.folderPath, // Preserves hierarchy
          };
        })
      );

      allFilesForDownload.push(...folderFilesForDownload);
    }
  }

  // Create ZIP archive with mixed structure
  const zipBuffer = await createZipFromFiles(
    allFilesForDownload,
    'download'
  );

  logger.info('Mixed bulk download completed', {
    userId,
    workspaceId: workspace.id,
    fileCount: validated.fileIds.length,
    folderCount: validated.folderIds.length,
    totalFilesInZip: allFilesForDownload.length,
    zipSizeBytes: zipBuffer.length,
  });

  // Convert Buffer to number array for Next.js serialization
  return {
    success: true,
    data: Array.from(zipBuffer),
  } as const;
});
