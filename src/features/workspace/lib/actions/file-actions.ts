'use server';

import { auth } from '@clerk/nextjs/server';
import { FileService } from '@/lib/services/files/file-service';
import type { DatabaseId } from '@/lib/database/types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  quotaInfo?: any;
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const fileService = new FileService();
    const result = await fileService.renameFile(fileId, newName);

    if (result.success) {
      // Don't revalidate path - React Query handles cache updates
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to rename file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename file',
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { StorageService } = await import(
      '@/lib/services/files/storage-service'
    );
    const { createServerSupabaseClient } = await import(
      '@/lib/config/supabase-server'
    );
    
    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);
    const fileService = new FileService();

    // Use the optimized deletion method that handles both DB and storage
    const result = await fileService.deleteFileWithStorage(fileId, storageService);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Get updated storage info after deletion
    const { getUserStorageDashboard } = await import('@/lib/services/storage/storage-tracking-service');
    const updatedStorageInfo = await getUserStorageDashboard(userId, 'free'); // TODO: Get actual user plan
    
    return { 
      success: true, 
      data: result.data,
      storageInfo: {
        usagePercentage: updatedStorageInfo.usagePercentage,
        remainingBytes: updatedStorageInfo.remainingBytes,
        shouldShowWarning: false, // Deletion always reduces usage
      }
    };
  } catch (error) {
    console.error('Failed to delete file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
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
      const { workspaceService } = await import('@/lib/services/workspace');
      const workspace = await workspaceService.getWorkspaceByUserId(userId);
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
      // Don't revalidate path - React Query handles cache updates
      return {
        success: true,
        data: {
          ...result.data,
          renamedTo:
            finalFileName !== fileToMove.fileName ? finalFileName : undefined,
        },
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to move file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move file',
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { StorageService } = await import(
      '@/lib/services/files/storage-service'
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

    return {
      success: true,
      data: {
        file,
        downloadUrl: downloadResult.data.url,
        expiresAt: new Date(Date.now() + downloadResult.data.expiresIn * 1000),
      },
    };
  } catch (error) {
    console.error('Failed to prepare file for download:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to prepare file for download',
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { StorageService } = await import(
      '@/lib/services/files/storage-service'
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
      return {
        success: false,
        error: `Storage initialization failed: ${bucketInit.error}`,
      };
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

    // Determine upload path - must start with userId for RLS policy
    const uploadPath = folderId ? `${userId}/folders/${folderId}` : `${userId}/workspace`;

    // Upload file with quota validation (workspace context for personal files)
    const uploadResult = await storageService.uploadFileWithQuotaCheck(
      file,
      uploadPath,
      userId,
      undefined, // No linkId for workspace files
      'workspace',
      clientIp
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      };
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
      userId,
      folderId: folderId || null,
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
      // Calculate storage info for client
      const quotaInfo = uploadResult.data!.quotaInfo;
      const storageInfo = {
        usagePercentage: quotaInfo.usagePercentage,
        remainingBytes: quotaInfo.storageLimit - quotaInfo.newUsage,
        shouldShowWarning: quotaInfo.usagePercentage >= 80,
      };
      
      return {
        success: true,
        data: result.data,
        storageInfo,
      };
    } else {
      // If database creation fails, clean up the uploaded file
      await storageService.deleteFile(uploadResult.data!.path, 'workspace');
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to upload file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
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

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { StorageService } = await import(
      '@/lib/services/files/storage-service'
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
      return {
        success: false,
        error: `Storage initialization failed: ${bucketInit.error}`,
      };
    }

    // Determine upload path for shared files
    const uploadPath = folderId ? `${linkId}/folders/${folderId}` : linkId;

    // Upload file with quota validation (shared context for link files)
    const uploadResult = await storageService.uploadFileWithQuotaCheck(
      file,
      uploadPath,
      userId,
      linkId, // Include linkId for link-specific quota checking
      'shared',
      clientIp
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      };
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
      userId,
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
      isPublic: true, // Link files are typically public
      sharedAt: new Date(),
      uploadedAt: new Date(),
    };

    const result = await fileService.createFile(fileData);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        quotaInfo: uploadResult.data!.quotaInfo,
      };
    } else {
      // If database creation fails, clean up the uploaded file
      await storageService.deleteFile(uploadResult.data!.path, 'shared');
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to upload file to link:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to upload file to link',
    };
  }
}
