'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { FileService } from '@/lib/services/shared/file-service';
import type { DatabaseId } from '@/lib/supabase/types';

// =============================================================================
// TYPES
// =============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  quotaInfo?: any;
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

    const { storageService } = await import(
      '@/lib/services/shared/storage-service'
    );
    const fileService = new FileService();

    // First get the file to obtain storage path
    const fileResult = await fileService.getFileById(fileId);
    if (!fileResult.success) {
      return { success: false, error: 'File not found' };
    }

    const file = fileResult.data;

    // Delete from database first
    const result = await fileService.deleteFile(fileId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Then delete from storage (non-blocking, but log errors)
    if (file.storagePath) {
      const storageResult = await storageService.deleteFile(
        file.storagePath,
        'workspace'
      );
      if (!storageResult.success) {
        console.error(
          `Failed to delete file from storage: ${storageResult.error}`
        );
        // Don't fail the entire operation if storage deletion fails
      }
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Failed to delete file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Move a file to a different folder
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
    const result = await fileService.moveFile(fileId, targetFolderId);

    if (result.success) {
      // Don't revalidate path - React Query handles cache updates
      return { success: true, data: result.data };
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

    const { storageService } = await import(
      '@/lib/services/shared/storage-service'
    );
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
 * Upload a file to the workspace with quota validation
 */
export async function uploadFileAction(
  file: File,
  workspaceId: string,
  folderId?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { storageService } = await import(
      '@/lib/services/shared/storage-service'
    );
    const fileService = new FileService();

    // Initialize storage buckets if they don't exist
    const bucketInit = await storageService.initializeBuckets();
    if (!bucketInit.success) {
      return {
        success: false,
        error: `Storage initialization failed: ${bucketInit.error}`,
      };
    }

    // Determine upload path
    const uploadPath = folderId ? `folders/${folderId}` : 'workspace';

    // Upload file with quota validation (workspace context for personal files)
    const uploadResult = await storageService.uploadFileWithQuotaCheck(
      file,
      uploadPath,
      userId,
      undefined, // No linkId for workspace files
      'workspace'
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      };
    }

    // Calculate checksum for file integrity
    const checksum = await storageService.calculateChecksum(file);

    // Create database record with storage information
    const fileData = {
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extension: file.name.split('.').pop() || '',
      userId,
      folderId: folderId || null,
      linkId: workspaceId, // Link to workspace
      batchId: workspaceId, // Batch identifier for workspace
      storagePath: uploadResult.data!.path,
      storageProvider: 'supabase' as const,
      checksum,
      isSafe: true,
      virusScanResult: 'clean' as const,
      processingStatus: 'completed' as const,
      isOrganized: false,
      needsReview: false,
      downloadCount: 0,
      isPublic: false,
      sharedAt: null,
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
  folderId?: string
): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const { storageService } = await import(
      '@/lib/services/shared/storage-service'
    );
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
      'shared'
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      };
    }

    // Calculate checksum for file integrity
    const checksum = await storageService.calculateChecksum(file);

    // Create database record with storage information
    const fileData = {
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      extension: file.name.split('.').pop() || '',
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
