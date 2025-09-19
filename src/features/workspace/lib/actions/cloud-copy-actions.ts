'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { files, folders } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import { sanitizeUserId } from '@/lib/utils/security';
import { logger } from '@/lib/services/logging/logger';
import { StorageService } from '@/lib/services/storage/storage-operations-service';
import { createServerSupabaseClient } from '@/lib/config/supabase-server';
import { GoogleDriveProvider } from '@/lib/services/cloud-storage/providers/google-drive';
import { OneDriveProvider } from '@/lib/services/cloud-storage/providers/onedrive';
import { getCloudProviderToken } from '@/lib/services/cloud-storage/actions/cloud-actions';
import type { CloudProvider, CloudProviderApi } from '@/lib/services/cloud-storage/providers/types';
import type { File } from '@/lib/database/types';

interface CopyToCloudResult {
  success: boolean;
  copiedCount?: number;
  errors?: string[];
  error?: string;
}

interface WorkspaceItem {
  id: string;
  name: string;
  isFolder: boolean;
}

/**
 * Copy workspace items (files/folders) to cloud storage provider
 */
export async function copyWorkspaceItemsToCloudAction(
  items: WorkspaceItem[],
  provider: CloudProvider['id'],
  targetFolderId: string | null
): Promise<CopyToCloudResult> {
  try {
    const { userId } = await auth();
    const sanitizedUserId = sanitizeUserId(userId);

    if (!sanitizedUserId) {
      logger.warn('Unauthorized cloud copy attempt');
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Get cloud provider token
    const tokenResult = await getCloudProviderToken(provider);
    if (!tokenResult.success || !tokenResult.token) {
      return {
        success: false,
        error: 'Cloud provider not connected. Please connect your account first.',
      };
    }

    // Create cloud provider API instance
    const cloudApi = provider === 'google-drive'
      ? new GoogleDriveProvider(tokenResult.token)
      : new OneDriveProvider(tokenResult.token);

    // Initialize Supabase for file downloads
    const supabaseClient = await createServerSupabaseClient();
    const storageService = new StorageService(supabaseClient);

    let copiedCount = 0;
    const errors: string[] = [];

    // Process each item
    for (const item of items) {
      try {
        if (item.isFolder) {
          // Create folder in cloud storage
          const folderResult = await cloudApi.createFolder(item.name, targetFolderId || undefined);

          if (!folderResult.success) {
            errors.push(`Failed to create folder "${item.name}": ${folderResult.error.message}`);
            continue;
          }

          // Get all files in this folder recursively
          const folderFiles = await getFilesInFolderRecursive(item.id);

          // Copy each file to the new cloud folder
          for (const file of folderFiles) {
            const fileCopyResult = await copyFileToCloud(
              file,
              cloudApi,
              storageService,
              folderResult.data.id
            );

            if (fileCopyResult.success) {
              copiedCount++;
            } else {
              errors.push(fileCopyResult.error || `Failed to copy file "${file.fileName}"`);
            }
          }

          copiedCount++; // Count the folder itself
        } else {
          // Get file details from database
          const [file] = await db
            .select()
            .from(files)
            .where(eq(files.id, item.id));

          if (!file) {
            errors.push(`File "${item.name}" not found`);
            continue;
          }

          // Copy file to cloud
          const copyResult = await copyFileToCloud(
            file,
            cloudApi,
            storageService,
            targetFolderId || undefined
          );

          if (copyResult.success) {
            copiedCount++;
          } else {
            errors.push(copyResult.error || `Failed to copy file "${item.name}"`);
          }
        }
      } catch (error) {
        logger.error(`Failed to copy item "${item.name}" to cloud`, error);
        errors.push(`Failed to copy "${item.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logger.info('Workspace items copied to cloud', {
      userId: sanitizedUserId,
      provider,
      targetFolderId,
      totalItems: items.length,
      copiedCount,
      errorCount: errors.length,
    });

    if (errors.length > 0) {
      return {
        success: copiedCount > 0,
        copiedCount,
        errors,
      };
    }

    return {
      success: copiedCount > 0,
      copiedCount,
    };
  } catch (error) {
    logger.error('Failed to copy items to cloud storage', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy items to cloud storage',
    };
  }
}

/**
 * Helper function to copy a single file to cloud storage
 */
async function copyFileToCloud(
  file: File,
  cloudApi: CloudProviderApi,
  storageService: StorageService,
  targetFolderId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Download file from Supabase storage
    const downloadResult = await storageService.getDownloadUrl(
      file.storagePath,
      'workspace',
      3600
    );

    if (!downloadResult.success) {
      return { success: false, error: `Failed to get download URL: ${downloadResult.error}` };
    }

    // Fetch the file content
    const response = await fetch(downloadResult.data.url);
    if (!response.ok) {
      return { success: false, error: 'Failed to download file from storage' };
    }

    const blob = await response.blob();
    const fileObj = new File([blob], file.fileName, { type: file.mimeType });

    // Upload to cloud provider
    const uploadResult = await cloudApi.uploadFile(fileObj, targetFolderId);

    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to copy file'
    };
  }
}

/**
 * Get all files in a folder recursively
 */
async function getFilesInFolderRecursive(folderId: string): Promise<File[]> {
  const allFiles: File[] = [];

  // Get direct files in this folder
  const directFiles = await db
    .select()
    .from(files)
    .where(eq(files.folderId, folderId));

  allFiles.push(...directFiles);

  // Get subfolders
  const subfolders = await db
    .select()
    .from(folders)
    .where(eq(folders.parentFolderId, folderId));

  // Recursively get files from subfolders
  for (const subfolder of subfolders) {
    const subfolderFiles = await getFilesInFolderRecursive(subfolder.id);
    allFiles.push(...subfolderFiles);
  }

  return allFiles;
}