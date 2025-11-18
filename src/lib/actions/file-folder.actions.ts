// =============================================================================
// FILE-FOLDER ACTIONS - Mixed File and Folder Operations
// =============================================================================
// Used by: workspace module (multi-selection bulk operations)
// Handles operations that work with both files and folders together

'use server';

// Import from global utilities
import { withAuthInputAndRateLimit, validateInput, type ActionResponse } from '@/lib/utils/action-helpers';
import { getAuthenticatedWorkspace, verifyFileOwnership, verifyFolderOwnership } from '@/lib/utils/authorization';
import { validateBucketConfiguration } from '@/lib/utils/storage-helpers';
import { createZipFromFiles, type FileForDownload } from '@/lib/utils/download-helpers';
import { ERROR_MESSAGES } from '@/lib/constants';

// Import database queries
import {
  getFilesByIds,
  getFolderById,
  getFolderTreeFiles,
  getFolderHierarchy,
  getFolderDepth,
  bulkDeleteFiles,
  deleteFolder,
  updateFileMetadata,
  updateFolder,
  checkFilenameExists,
  isFolderNameAvailable,
} from '@/lib/database/queries';

// Import storage client
import { deleteFile as deleteFileFromStorage, getSignedUrl } from '@/lib/storage/client';
import { UPLOADS_BUCKET_NAME } from '@/lib/validation';

// Import rate limiting
import { RateLimitPresets } from '@/lib/middleware/rate-limit';

// Import logging
import { logger, logSecurityEvent } from '@/lib/utils/logger';

// Import constants
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

// Import types
import type { File, Folder } from '@/lib/database/schemas';

// Import validation schemas
import {
  bulkDownloadMixedSchema,
  moveMixedSchema,
  deleteMixedSchema,
  type BulkDownloadMixedInput,
  type MoveMixedInput,
  type DeleteMixedInput,
} from '@/lib/validation';

// =============================================================================
// BULK DOWNLOAD MIXED ACTION
// =============================================================================

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

// =============================================================================
// BULK MOVE MIXED ACTION (FUTURE IMPLEMENTATION - PHASE 3)
// =============================================================================

/**
 * Move files and folders to a new parent folder (mixed selection)
 * Validates ownership, verifies destination folder, checks for circular references and name conflicts
 *
 * Edge Cases Handled:
 * - Circular references (folder cannot be moved into itself or descendant)
 * - Name conflicts in destination folder
 * - Permission verification for all items
 * - Idempotent operations (no-op if already in target location)
 *
 * @param fileIds - Array of file UUIDs to move
 * @param folderIds - Array of folder UUIDs to move
 * @param targetFolderId - ID of the target parent folder (null to move to root)
 * @returns Action response with success status
 *
 * @example
 * ```typescript
 * const result = await moveMixedAction({
 *   fileIds: ['file_1', 'file_2'],
 *   folderIds: ['folder_1'],
 *   targetFolderId: 'folder_target'
 * });
 * ```
 */
export const moveMixedAction = withAuthInputAndRateLimit<
  MoveMixedInput,
  { movedFileCount: number; movedFolderCount: number }
>('moveMixedAction', RateLimitPresets.MODERATE, async (userId, input) => {
  // Validate input
  const validated = validateInput(moveMixedSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Verify destination folder exists and belongs to workspace (if moving to folder)
  if (validated.targetFolderId) {
    await verifyFolderOwnership(
      validated.targetFolderId,
      workspace.id,
      'moveMixedAction'
    );
  }

  let movedFileCount = 0;
  let movedFolderCount = 0;

  // Move files
  if (validated.fileIds.length > 0) {
    // Verify ownership and get full file objects (includes parentFolderId)
    // Following pattern from moveFileAction
    for (const fileId of validated.fileIds) {
      const file = await verifyFileOwnership(
        fileId,
        workspace.id,
        'moveMixedAction'
      );

      // Skip if already in target location (idempotent no-op)
      const normalizedTarget = validated.targetFolderId ?? null;
      const normalizedCurrent = file.parentFolderId ?? null;

      if (normalizedTarget === normalizedCurrent) {
        continue;
      }

      // Check filename uniqueness in destination
      const filenameExists = await checkFilenameExists(
        validated.targetFolderId,
        file.filename
      );

      if (filenameExists) {
        logger.warn('File with same name already exists in destination', {
          userId,
          fileId: file.id,
          filename: file.filename,
          targetFolderId: validated.targetFolderId,
        });

        throw {
          success: false,
          error: `File "${file.filename}" already exists in the destination folder.`,
        } as const;
      }

      // Move file
      await updateFileMetadata(file.id, {
        parentFolderId: validated.targetFolderId,
      });

      movedFileCount++;
    }
  }

  // Move folders
  if (validated.folderIds.length > 0) {
    for (const folderId of validated.folderIds) {
      // Verify folder ownership
      const folder = await verifyFolderOwnership(
        folderId,
        workspace.id,
        'moveMixedAction'
      );

      // Skip if already in target location (idempotent no-op)
      const normalizedTarget = validated.targetFolderId ?? null;
      const normalizedCurrent = folder.parentFolderId ?? null;

      if (normalizedTarget === normalizedCurrent) {
        continue;
      }

      // Prevent circular reference (folder cannot be moved into itself)
      if (folderId === validated.targetFolderId) {
        logSecurityEvent('folderCircularReference', {
          userId,
          folderId,
          targetFolderId: validated.targetFolderId,
        });

        throw {
          success: false,
          error: ERROR_MESSAGES.FOLDER.CIRCULAR_REFERENCE,
        } as const;
      }

      // Prevent moving into descendant (circular reference)
      // Following pattern from moveFolderAction - use getFolderHierarchy for efficiency
      if (validated.targetFolderId) {
        const targetHierarchy = await getFolderHierarchy(validated.targetFolderId);
        const isDescendant = targetHierarchy.some((f) => f.id === folderId);

        if (isDescendant) {
          logSecurityEvent('folderCircularReference', {
            userId,
            folderId,
            targetFolderId: validated.targetFolderId,
          });

          throw {
            success: false,
            error: ERROR_MESSAGES.FOLDER.CIRCULAR_REFERENCE,
          } as const;
        }

        // Check nesting depth: Moved folder will be at targetDepth + 1
        // Following pattern from moveFolderAction
        const targetDepth = await getFolderDepth(validated.targetFolderId);
        const newDepth = targetDepth + 1;

        if (newDepth >= VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH) {
          logSecurityEvent('folderNestingLimitExceeded', {
            userId,
            folderId,
            targetFolderId: validated.targetFolderId,
            targetDepth,
            newDepth,
            limit: VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH,
          });

          throw {
            success: false,
            error: `Cannot move folder. Maximum nesting depth (${VALIDATION_LIMITS.FOLDER.MAX_NESTING_DEPTH} levels) would be exceeded.`,
          } as const;
        }
      }

      // Check folder name uniqueness in destination
      const folderNameAvailable = await isFolderNameAvailable(
        workspace.id,
        folder.name,
        validated.targetFolderId ?? null
      );

      if (!folderNameAvailable) {
        logger.warn('Folder with same name already exists in destination', {
          userId,
          folderId: folder.id,
          folderName: folder.name,
          targetFolderId: validated.targetFolderId,
        });

        throw {
          success: false,
          error: `Folder "${folder.name}" already exists in the destination folder.`,
        } as const;
      }

      // Move folder
      await updateFolder(folderId, {
        parentFolderId: validated.targetFolderId,
      });

      movedFolderCount++;
    }
  }

  logger.info('Mixed bulk move completed', {
    userId,
    workspaceId: workspace.id,
    movedFileCount,
    movedFolderCount,
    targetFolderId: validated.targetFolderId,
  });

  return {
    success: true,
    data: {
      movedFileCount,
      movedFolderCount,
    },
  } as const;
});

// =============================================================================
// BULK DELETE MIXED ACTION (FUTURE IMPLEMENTATION - PHASE 4)
// =============================================================================

/**
 * Delete files and folders (mixed selection)
 * Files: Storage-first deletion (billing integrity)
 * Folders: DB deletion with CASCADE (no storage representation)
 * Partial success pattern: Delete what succeeds, report what fails
 *
 * @param fileIds - Array of file UUIDs to delete
 * @param folderIds - Array of folder UUIDs to delete
 * @returns Action response with counts of successfully deleted items
 *
 * @example
 * ```typescript
 * const result = await deleteMixedAction({
 *   fileIds: ['file_1', 'file_2'],
 *   folderIds: ['folder_1']
 * });
 * if (result.success) {
 *   console.log(`Deleted ${result.data.deletedFileCount} files and ${result.data.deletedFolderCount} folders`);
 * }
 * ```
 */
export const deleteMixedAction = withAuthInputAndRateLimit<
  DeleteMixedInput,
  { deletedFileCount: number; deletedFolderCount: number }
>('deleteMixedAction', RateLimitPresets.MODERATE, async (userId, input) => {
  // Validate input
  const validated = validateInput(deleteMixedSchema, input);

  // Get user's workspace
  const workspace = await getAuthenticatedWorkspace(userId);

  // Validate bucket configuration (needed for file deletion)
  const bucketError = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
  if (bucketError) return bucketError;

  let deletedFileCount = 0;
  let deletedFolderCount = 0;

  // Delete files (storage-first pattern for billing integrity)
  if (validated.fileIds.length > 0) {
    // Verify all files belong to workspace
    const files = await getFilesByIds(validated.fileIds, workspace.id);

    if (files.length !== validated.fileIds.length) {
      logger.warn('Some files not found for deletion', {
        userId,
        requestedCount: validated.fileIds.length,
        foundCount: files.length,
      });

      throw {
        success: false,
        error: ERROR_MESSAGES.FILE.NOT_FOUND,
      } as const;
    }

    // Delete from storage FIRST (users pay for storage)
    // Use Promise.allSettled pattern to track individual deletion results
    const storageDeletePromises = files.map((file) =>
      deleteFileFromStorage({
        gcsPath: file.storagePath,
        bucket: UPLOADS_BUCKET_NAME,
      }).then(() => ({ status: 'fulfilled' as const, file }))
        .catch((error) => ({ status: 'rejected' as const, file, error }))
    );

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

      throw {
        success: false,
        error: ERROR_MESSAGES.STORAGE.DELETE_FAILED,
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
    try {
      const successfulFileIds = successfulDeletions.map(f => f.id);
      await bulkDeleteFiles(successfulFileIds);

      deletedFileCount = successfulDeletions.length;

      logger.info('Files deleted successfully', {
        userId,
        deletedCount: deletedFileCount,
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

      deletedFileCount = successfulDeletions.length;
    }
  }

  // Delete folders (DB deletion with CASCADE - no storage representation)
  if (validated.folderIds.length > 0) {
    for (const folderId of validated.folderIds) {
      try {
        // Verify folder ownership
        await verifyFolderOwnership(folderId, workspace.id, 'deleteMixedAction');

        // Delete folder (CASCADE deletes subfolders, sets file parent_folder_id to NULL)
        await deleteFolder(folderId);

        deletedFolderCount++;

        logger.info('Folder deleted successfully', {
          userId,
          folderId,
        });
      } catch (error) {
        logger.error('Failed to delete folder', {
          userId,
          folderId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Continue with other folders (partial success pattern)
      }
    }
  }

  logger.info('Mixed bulk delete completed', {
    userId,
    workspaceId: workspace.id,
    deletedFileCount,
    deletedFolderCount,
  });

  return {
    success: true,
    data: {
      deletedFileCount,
      deletedFolderCount,
    },
  } as const;
});
