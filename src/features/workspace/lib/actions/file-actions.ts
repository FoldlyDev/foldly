'use server';

import { auth } from '@clerk/nextjs/server';
import { FileService } from '@/lib/services/file-system/file-service';
import type { DatabaseId } from '@/lib/database/types';
import {
  sanitizePath,
  isValidFolderId,
  sanitizeUserId,
} from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
  type ErrorCode,
} from '@/lib/types/error-response';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  storageInfo?: {
    usagePercentage: number;
    remainingBytes: number;
    shouldShowWarning: boolean;
  };
}

// =============================================================================
// FILE ACTIONS
// =============================================================================

/**
 * Rename a file
 */
export async function renameFileAction(
  fileId: DatabaseId,
  newName: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized rename file attempt', { fileId });
      return {
        success: false,
        error: 'Unauthorized',
        code: ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Sanitize the new file name to prevent path traversal
    const sanitizedName = sanitizePath(newName, '/');
    if (
      !sanitizedName ||
      sanitizedName.includes('..') ||
      sanitizedName.includes('/')
    ) {
      logger.logSecurityEvent('Invalid file name in rename attempt', 'medium', {
        fileId,
        attemptedName: newName,
        userId: sanitizedUserId,
      });
      return {
        success: false,
        error: 'Invalid file name',
        code: ERROR_CODES.INVALID_INPUT,
      };
    }

    const fileService = new FileService();
    const result = await fileService.renameFile(fileId, sanitizedName);

    if (result.success) {
      logger.info('File renamed successfully', {
        userId: sanitizedUserId,
        fileId,
        newName: sanitizedName,
      });
      return { success: true, data: result.data };
    } else {
      logger.error('File rename failed', undefined, {
        userId: sanitizedUserId,
        fileId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error,
        ...(result.code && { code: result.code }),
      };
    }
  } catch (error) {
    logger.error('Failed to rename file', error, { fileId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename file',
      code: ERROR_CODES.INTERNAL_ERROR,
    };
  }
}

/**
 * Delete a file
 */
export async function deleteFileAction(
  fileId: DatabaseId
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized delete file attempt', { fileId });
      return {
        success: false,
        error: 'Unauthorized',
        code: ERROR_CODES.UNAUTHORIZED,
      };
    }

    const { StorageService } = await import(
      '@/lib/services/storage/storage-operations-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );

    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);
    const fileService = new FileService();

    // Use the optimized deletion method that handles both DB and storage
    const result = await fileService.deleteFileWithStorage(
      fileId,
      storageService
    );
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Get updated storage info after deletion
    const { getUserStorageInfoAction } = await import(
      '@/lib/actions/storage-actions'
    );
    const storageResult = await getUserStorageInfoAction();
    const updatedStorageInfo = storageResult.success && 'data' in storageResult && storageResult.data ? {
      usagePercentage: storageResult.data.usagePercentage,
      remainingBytes: storageResult.data.availableSpace,
    } : {
      usagePercentage: 0,
      remainingBytes: 0,
    };

    logger.info('File deleted successfully', {
      userId: sanitizedUserId,
      fileId,
    });

    return {
      success: true,
      data: result.data,
      storageInfo: {
        usagePercentage: updatedStorageInfo.usagePercentage,
        remainingBytes: updatedStorageInfo.remainingBytes,
        shouldShowWarning: false, // Deletion always reduces usage
      },
    };
  } catch (error) {
    logger.error('Failed to delete file', error, { fileId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
      code: ERROR_CODES.INTERNAL_ERROR,
    };
  }
}

/**
 * Move a file to a different folder with conflict resolution
 */
export async function moveFileAction(
  fileId: DatabaseId,
  targetFolderId: DatabaseId
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized move file attempt', { fileId, targetFolderId });
      return {
        success: false,
        error: 'Unauthorized',
        code: ERROR_CODES.UNAUTHORIZED,
      };
    }

    // Validate target folder ID to prevent path traversal
    if (targetFolderId && !isValidFolderId(targetFolderId)) {
      logger.logSecurityEvent(
        'Invalid target folder ID in move attempt',
        'high',
        { fileId, targetFolderId, userId: sanitizedUserId }
      );
      return {
        success: false,
        error: 'Invalid target folder',
        code: ERROR_CODES.INVALID_INPUT,
      };
    }

    const fileService = new FileService();

    // Get the file being moved to check its name
    const fileResult = await fileService.getFileById(fileId);
    if (!fileResult.success) {
      return { success: false, error: 'File not found' };
    }

    const fileToMove = fileResult.data;
    let finalFileName = fileToMove.fileName;

    // Check for conflicts in target folder
    if (targetFolderId) {
      // Moving to a specific folder - check existing files in that folder
      const existingFilesResult =
        await fileService.getFilesByFolder(targetFolderId);
      if (existingFilesResult.success) {
        const existingFileNames = existingFilesResult.data
          .filter(f => f.id !== fileId) // Exclude the file being moved
          .map(f => f.fileName);

        // Check if there's a conflict
        if (existingFileNames.includes(fileToMove.fileName)) {
          // Import the generateUniqueName function
          const { generateUniqueName } = await import(
            '@/features/files/utils/file-operations'
          );

          // Generate unique name to avoid conflict
          finalFileName = generateUniqueName(
            fileToMove.fileName,
            existingFileNames
          );

          // Update file name if it changed
          if (finalFileName !== fileToMove.fileName) {
            const renameResult = await fileService.renameFile(
              fileId,
              finalFileName
            );
            if (!renameResult.success) {
              return {
                success: false,
                error: `Failed to rename file: ${renameResult.error}`,
              };
            }
          }
        }
      }
    } else {
      // Moving to root - check existing root files
      // Note: This handles workspace root files
      const { workspaceService } = await import(
        '@/features/workspace/lib/services/workspace-service'
      );
      const workspace =
        await workspaceService.getWorkspaceByUserId(sanitizedUserId);
      if (!workspace) {
        return { success: false, error: 'Workspace not found' };
      }

      const existingRootFilesResult = await fileService.getRootFilesByWorkspace(
        workspace.id
      );
      if (existingRootFilesResult.success) {
        const existingFileNames = existingRootFilesResult.data
          .filter(f => f.id !== fileId) // Exclude the file being moved
          .map(f => f.fileName);

        // Check if there's a conflict
        if (existingFileNames.includes(fileToMove.fileName)) {
          // Import the generateUniqueName function
          const { generateUniqueName } = await import(
            '@/features/files/utils/file-operations'
          );

          // Generate unique name to avoid conflict
          finalFileName = generateUniqueName(
            fileToMove.fileName,
            existingFileNames
          );

          // Update file name if it changed
          if (finalFileName !== fileToMove.fileName) {
            const renameResult = await fileService.renameFile(
              fileId,
              finalFileName
            );
            if (!renameResult.success) {
              return {
                success: false,
                error: `Failed to rename file: ${renameResult.error}`,
              };
            }
          }
        }
      }
    }

    // Now move the file (with potentially updated name)
    const result = await fileService.moveFile(fileId, targetFolderId);

    if (result.success) {
      logger.info('File moved successfully', {
        userId: sanitizedUserId,
        fileId,
        targetFolderId,
        renamedTo:
          finalFileName !== fileToMove.fileName ? finalFileName : undefined,
      });
      return {
        success: true,
        data: {
          ...result.data,
          renamedTo:
            finalFileName !== fileToMove.fileName ? finalFileName : undefined,
        },
      };
    } else {
      logger.error('File move failed', undefined, {
        userId: sanitizedUserId,
        fileId,
        targetFolderId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error,
        ...(result.code && { code: result.code }),
      };
    }
  } catch (error) {
    logger.error('Failed to move file', error, { fileId, targetFolderId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move file',
      code: ERROR_CODES.INTERNAL_ERROR,
    };
  }
}

/**
 * Prepare file for download
 */
export async function downloadFileAction(
  fileId: DatabaseId
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized download file attempt', { fileId });
      return {
        success: false,
        error: 'Unauthorized',
        code: ERROR_CODES.UNAUTHORIZED,
      };
    }

    const { StorageService } = await import(
      '@/lib/services/storage/storage-operations-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );

    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);
    const fileService = new FileService();

    const result = await fileService.prepareFileForDownload(fileId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const file = result.data;

    // Generate signed download URL (workspace files default to workspace context)
    const downloadResult = await storageService.getDownloadUrl(
      file.storagePath,
      'workspace',
      3600
    ); // 1 hour expiry

    if (!downloadResult.success) {
      return { success: false, error: downloadResult.error };
    }

    // Increment download count
    await fileService.incrementDownloadCount(fileId);

    logger.info('File prepared for download', {
      userId: sanitizedUserId,
      fileId,
      fileName: file.fileName,
    });

    return {
      success: true,
      data: {
        file,
        downloadUrl: downloadResult.data.url,
        expiresAt: new Date(Date.now() + downloadResult.data.expiresIn * 1000),
      },
    };
  } catch (error) {
    logger.error('Failed to prepare file for download', error, { fileId });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to prepare file for download',
      code: ERROR_CODES.INTERNAL_ERROR,
    };
  }
}

/**
 * Upload a file to the workspace with quota validation and auto-increment for duplicates
 */
export async function uploadFileAction(
  file: File,
  workspaceId: string,
  folderId?: string,
  clientIp?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn(
        'Unauthorized upload file attempt',
        folderId ? { workspaceId, folderId } : { workspaceId }
      );
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // Validate folder ID to prevent path traversal
    if (folderId && !isValidFolderId(folderId)) {
      logger.logSecurityEvent('Invalid folder ID in upload attempt', 'high', {
        workspaceId,
        folderId,
        userId: sanitizedUserId,
      });
      return createErrorResponse(
        'Invalid folder ID',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Validate workspace ID format
    if (!workspaceId || !isValidFolderId(workspaceId)) {
      logger.logSecurityEvent(
        'Invalid workspace ID in upload attempt',
        'high',
        { workspaceId, userId: sanitizedUserId }
      );
      return createErrorResponse(
        'Invalid workspace ID',
        ERROR_CODES.INVALID_INPUT
      );
    }

    const { StorageService } = await import(
      '@/lib/services/storage/storage-operations-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );

    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);
    const fileService = new FileService();

    // Initialize storage buckets if they don't exist
    const bucketInit = await storageService.initializeBuckets();
    if (!bucketInit.success) {
      logger.error('Storage bucket initialization failed', undefined, {
        userId: sanitizedUserId,
        metadata: { error: bucketInit.error },
      });
      return createErrorResponse(
        `Storage initialization failed: ${bucketInit.error}`,
        ERROR_CODES.STORAGE_ERROR
      );
    }

    // Check for existing files in the target folder and auto-increment name if needed
    let uniqueFileName = file.name;

    if (folderId) {
      // Get existing files in the folder
      const existingFilesResult = await fileService.getFilesByFolder(folderId);
      if (existingFilesResult.success) {
        const existingFileNames = existingFilesResult.data.map(f => f.fileName);

        // Import the generateUniqueName function
        const { generateUniqueName } = await import(
          '@/features/files/utils/file-operations'
        );

        // Generate unique name if duplicates exist
        uniqueFileName = generateUniqueName(file.name, existingFileNames);
      }
    } else {
      // For root files, check existing root files in workspace
      const existingRootFilesResult =
        await fileService.getRootFilesByWorkspace(workspaceId);
      if (existingRootFilesResult.success) {
        const existingFileNames = existingRootFilesResult.data.map(
          f => f.fileName
        );

        // Import the generateUniqueName function
        const { generateUniqueName } = await import(
          '@/features/files/utils/file-operations'
        );

        // Generate unique name if duplicates exist
        uniqueFileName = generateUniqueName(file.name, existingFileNames);
      }
    }

    // Sanitize and determine upload path - must start with userId for RLS policy
    const basePath = `${sanitizedUserId}/workspace`;
    const uploadPath = folderId
      ? sanitizePath(`${sanitizedUserId}/folders/${folderId}`, basePath) ||
        basePath
      : basePath;

    // Check quota first using centralized service
    const { checkUserQuotaAction } = await import('@/lib/actions/storage-actions');
    const quotaCheck = await checkUserQuotaAction(file.size, clientIp);
    
    if (!quotaCheck.success || !('data' in quotaCheck) || !quotaCheck.data?.allowed) {
      return createErrorResponse(
        ('data' in quotaCheck && quotaCheck.data?.message) || ('error' in quotaCheck && quotaCheck.error) || 'Quota exceeded',
        ERROR_CODES.QUOTA_EXCEEDED
      );
    }

    // Upload file without redundant quota check
    const uploadResult = await storageService.uploadFile(
      file,
      uploadPath,
      sanitizedUserId
    );

    if (!uploadResult.success) {
      return createErrorResponse(
        uploadResult.error || 'Upload failed',
        (uploadResult.code as ErrorCode) || ERROR_CODES.INTERNAL_ERROR
      );
    }

    // Calculate checksum for file integrity
    const checksum = await storageService.calculateChecksum(file);

    // IMPORTANT: If folderId equals workspaceId, it means we're uploading to the workspace root
    // In this case, folderId should be NULL because the workspace root is not a folder
    const actualFolderId = folderId === workspaceId ? null : folderId || null;

    // Create database record with storage information using unique file name
    const fileData = {
      fileName: uniqueFileName, // Use the unique name (auto-incremented if needed)
      originalName: file.name, // Keep original name for reference
      fileSize: file.size,
      mimeType: file.type,
      extension: uniqueFileName.split('.').pop() || '',
      folderId: actualFolderId,
      workspaceId: workspaceId, // Workspace file - NOT a link file
      linkId: null, // NULL for workspace files
      batchId: null, // NULL for workspace files
      storagePath: uploadResult.data!.path,
      storageProvider: 'supabase' as const,
      checksum,
      isSafe: true,
      virusScanResult: 'clean' as const,
      processingStatus: 'completed' as const,
      isOrganized: false,
      needsReview: false,
      downloadCount: 0,
      uploadedAt: new Date(),
    };

    const result = await fileService.createFile(fileData);

    if (result.success) {
      // Get updated storage info after successful upload
      const { getUserStorageInfoAction } = await import('@/lib/actions/storage-actions');
      const storageResult = await getUserStorageInfoAction();
      
      // Prepare storage info for client
      const storageInfo = storageResult.success && 'data' in storageResult && storageResult.data ? {
        usagePercentage: storageResult.data.usagePercentage,
        remainingBytes: storageResult.data.availableSpace,
        shouldShowWarning: storageResult.data.usagePercentage >= 80,
      } : {
        usagePercentage: 0,
        remainingBytes: 0,
        shouldShowWarning: false,
      };

      logger.info(
        'File uploaded successfully to workspace',
        folderId
          ? {
              userId: sanitizedUserId,
              workspaceId,
              folderId,
              fileId: result.data.id,
              fileName: uniqueFileName,
              fileSize: file.size,
            }
          : {
              userId: sanitizedUserId,
              workspaceId,
              fileId: result.data.id,
              fileName: uniqueFileName,
              fileSize: file.size,
            }
      );

      return createSuccessResponse(result.data, { storageInfo });
    } else {
      // If database creation fails, clean up the uploaded file
      await storageService.deleteFile(uploadResult.data!.path, 'workspace');
      logger.error(
        'Failed to create file record, cleaned up uploaded file',
        undefined,
        {
          userId: sanitizedUserId,
          workspaceId,
          error: result.error,
        }
      );
      return createErrorResponse(
        result.error || 'Database creation failed',
        result.code as ErrorCode
      );
    }
  } catch (error) {
    logger.error(
      'Failed to upload file',
      error,
      folderId ? { workspaceId, folderId } : { workspaceId }
    );
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to upload file',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}

/**
 * Upload a file to a specific link with quota validation
 */
export async function uploadFileToLinkAction(
  file: File,
  linkId: string,
  folderId?: string,
  clientIp?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn(
        'Unauthorized upload to link attempt',
        folderId ? { linkId, folderId } : { linkId }
      );
      return createErrorResponse('Unauthorized', ERROR_CODES.UNAUTHORIZED);
    }

    // Validate folder ID to prevent path traversal
    if (folderId && !isValidFolderId(folderId)) {
      logger.logSecurityEvent(
        'Invalid folder ID in link upload attempt',
        'high',
        { linkId, folderId, userId: sanitizedUserId }
      );
      return createErrorResponse(
        'Invalid folder ID',
        ERROR_CODES.INVALID_INPUT
      );
    }

    // Validate link ID format
    if (!linkId || !isValidFolderId(linkId)) {
      logger.logSecurityEvent('Invalid link ID in upload attempt', 'high', {
        linkId,
        userId: sanitizedUserId,
      });
      return createErrorResponse('Invalid link ID', ERROR_CODES.INVALID_INPUT);
    }

    const { StorageService } = await import(
      '@/lib/services/storage/storage-operations-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );

    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);
    const fileService = new FileService();

    // Initialize storage buckets if they don't exist
    const bucketInit = await storageService.initializeBuckets();
    if (!bucketInit.success) {
      logger.error('Storage bucket initialization failed', undefined, {
        userId: sanitizedUserId,
        metadata: { error: bucketInit.error },
      });
      return createErrorResponse(
        `Storage initialization failed: ${bucketInit.error}`,
        ERROR_CODES.STORAGE_ERROR
      );
    }

    // Sanitize and determine upload path for shared files
    const basePath = linkId;
    const uploadPath = folderId
      ? sanitizePath(`${linkId}/folders/${folderId}`, basePath) || basePath
      : basePath;

    // Check quota first using centralized service
    const { checkUserQuotaAction } = await import('@/lib/actions/storage-actions');
    const quotaCheck = await checkUserQuotaAction(file.size, clientIp);
    
    if (!quotaCheck.success || !('data' in quotaCheck) || !quotaCheck.data?.allowed) {
      return createErrorResponse(
        ('data' in quotaCheck && quotaCheck.data?.message) || ('error' in quotaCheck && quotaCheck.error) || 'Quota exceeded',
        ERROR_CODES.QUOTA_EXCEEDED
      );
    }

    // Upload file without redundant quota check
    const uploadResult = await storageService.uploadFile(
      file,
      uploadPath,
      sanitizedUserId
    );

    if (!uploadResult.success) {
      return createErrorResponse(
        uploadResult.error || 'Upload failed',
        (uploadResult.code as ErrorCode) || ERROR_CODES.INTERNAL_ERROR
      );
    }

    // Check for existing files in the target folder and auto-increment name if needed
    let uniqueFileName = file.name;

    if (folderId) {
      // Get existing files in the folder
      const existingFilesResult = await fileService.getFilesByFolder(folderId);
      if (existingFilesResult.success) {
        const existingFileNames = existingFilesResult.data.map(f => f.fileName);

        // Import the generateUniqueName function
        const { generateUniqueName } = await import(
          '@/features/files/utils/file-operations'
        );

        // Generate unique name if duplicates exist
        uniqueFileName = generateUniqueName(file.name, existingFileNames);
      }
    } else {
      // For link root files, check existing root files for this link
      const { db } = await import('@/lib/database/connection');
      const { files } = await import('@/lib/database/schemas');
      const { and, isNull, eq } = await import('drizzle-orm');

      const existingRootFilesResult = await db
        .select()
        .from(files)
        .where(
          and(
            isNull(files.folderId), // No folder (root level)
            eq(files.linkId, linkId) // Belongs to this link
          )
        );

      if (existingRootFilesResult && existingRootFilesResult.length > 0) {
        const existingFileNames = existingRootFilesResult.map(f => f.fileName);

        // Import the generateUniqueName function
        const { generateUniqueName } = await import(
          '@/features/files/utils/file-operations'
        );

        // Generate unique name if duplicates exist
        uniqueFileName = generateUniqueName(file.name, existingFileNames);
      }
    }

    // Calculate checksum for file integrity
    const checksum = await storageService.calculateChecksum(file);

    // Create database record with storage information using unique file name
    const fileData = {
      fileName: uniqueFileName, // Use the unique name (auto-incremented if needed)
      originalName: file.name, // Keep original name for reference
      fileSize: file.size,
      mimeType: file.type,
      extension: uniqueFileName.split('.').pop() || '',
      folderId: folderId || null,
      linkId, // Link to specific collection link
      batchId: linkId, // Batch identifier for link
      storagePath: uploadResult.data!.path,
      storageProvider: 'supabase' as const,
      checksum,
      isSafe: true,
      virusScanResult: 'clean' as const,
      processingStatus: 'completed' as const,
      isOrganized: false,
      needsReview: false,
      downloadCount: 0,
      uploadedAt: new Date(),
    };

    const result = await fileService.createFile(fileData);

    if (result.success) {
      logger.info(
        'File uploaded successfully to link',
        folderId
          ? {
              userId: sanitizedUserId,
              linkId,
              folderId,
              fileId: result.data.id,
              fileName: uniqueFileName,
              fileSize: file.size,
            }
          : {
              userId: sanitizedUserId,
              linkId,
              fileId: result.data.id,
              fileName: uniqueFileName,
              fileSize: file.size,
            }
      );

      // Get updated storage info after successful upload
      const { getUserStorageInfoAction } = await import('@/lib/actions/storage-actions');
      const storageResult = await getUserStorageInfoAction();
      
      const storageInfo = storageResult.success && 'data' in storageResult && storageResult.data ? {
        usagePercentage: storageResult.data.usagePercentage,
        remainingBytes: storageResult.data.availableSpace,
        shouldShowWarning: storageResult.data.usagePercentage >= 80,
      } : null;

      return createSuccessResponse(result.data, { storageInfo });
    } else {
      // If database creation fails, clean up the uploaded file
      await storageService.deleteFile(uploadResult.data!.path, 'shared');
      logger.error(
        'Failed to create file record for link upload, cleaned up uploaded file',
        undefined,
        {
          userId: sanitizedUserId,
          linkId,
          error: result.error,
        }
      );
      return createErrorResponse(
        result.error || 'Database creation failed',
        result.code as ErrorCode
      );
    }
  } catch (error) {
    logger.error(
      'Failed to upload file to link',
      error,
      folderId ? { linkId, folderId } : { linkId }
    );
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to upload file to link',
      ERROR_CODES.INTERNAL_ERROR
    );
  }
}
