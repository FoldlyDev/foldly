'use client';

import { useState, useCallback } from 'react';
import { useLinkUploadStagingStore } from '../stores/staging-store';
import { 
  createUploadBatchAction, 
  createLinkFolderAction,
  validatePasswordAction,
  updateBatchProgressAction 
} from '../lib/actions/upload-actions';
import { logger } from '@/lib/services/logging/logger';

interface UseLinkFileUploadProps {
  linkId: string;
  sourceFolderId?: string | null;
  onUploadComplete?: () => void;
}

interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * Hook for handling link file uploads using the centralized upload service
 */
export function useLinkFileUpload({ linkId, sourceFolderId, onUploadComplete }: UseLinkFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState(0);
  
  const { 
    getAllStagedItems, 
    clearAllStaged,
    updateFileStatus 
  } = useLinkUploadStagingStore();

  /**
   * Upload all staged files to the link
   */
  const uploadStagedFiles = useCallback(async (
    uploaderName: string,
    uploaderEmail?: string,
    password?: string
  ) => {
    const { files: stagedFiles, folders: stagedFolders } = getAllStagedItems();
    
    if (stagedFiles.length === 0) {
      logger.warn('No files to upload');
      return { success: false, error: 'No files to upload' };
    }

    setIsUploading(true);
    const progressMap = new Map<string, UploadProgress>();

    try {
      // Validate password if provided
      if (password) {
        const passwordResult = await validatePasswordAction(linkId, password);
        if (!passwordResult.success || !passwordResult.data) {
          throw new Error('Invalid password');
        }
      }

      // Create batch record - ensure email is undefined if empty
      // For generated links, use sourceFolderId as targetFolderId
      const batchResult = await createUploadBatchAction({
        linkId,
        uploaderName,
        ...(uploaderEmail && { uploaderEmail }),
        totalFiles: stagedFiles.length,
        totalSize: stagedFiles.reduce((sum, file) => sum + file.fileSize, 0),
        ...(sourceFolderId && { targetFolderId: sourceFolderId }),
      });

      if (!batchResult.success || !batchResult.data) {
        throw new Error(batchResult.error || 'Failed to create batch');
      }

      const batchId = batchResult.data.batchId;

      // Create folder structure first
      const folderIdMap = new Map<string, string>();
      
      // Debug logging - check what we got from staging store
      logger.info('Starting folder creation', {
        stagedFoldersCount: stagedFolders.length,
        stagedFilesCount: stagedFiles.length,
        folders: stagedFolders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })),
        files: stagedFiles.map(f => ({ id: f.id, name: f.name, parentId: f.parentId }))
      });
      
      // Additional debug: Check staging store directly
      const storeState = useLinkUploadStagingStore.getState();
      logger.info('Staging store state', {
        stagedFoldersMapSize: storeState.stagedFolders.size,
        stagedFilesMapSize: storeState.stagedFiles.size,
        folderIds: Array.from(storeState.stagedFolders.keys()),
        fileIds: Array.from(storeState.stagedFiles.keys())
      });
      
      // First, identify folders that actually contain files (directly or indirectly)
      const foldersWithContent = new Set<string>();
      
      // Mark folders that directly contain files
      stagedFiles.forEach(file => {
        if (file.parentId) {
          foldersWithContent.add(file.parentId);
          logger.info('File has parent folder', { fileName: file.name, parentId: file.parentId });
        }
      });
      
      // Mark parent folders of folders with content (bubble up)
      let changed = true;
      while (changed) {
        changed = false;
        stagedFolders.forEach(folder => {
          if (foldersWithContent.has(folder.id) && folder.parentId && !foldersWithContent.has(folder.parentId)) {
            foldersWithContent.add(folder.parentId);
            changed = true;
          }
        });
      }
      
      // Filter out empty folders and sort by depth to create parents before children
      const foldersToCreate = stagedFolders
        .filter(folder => foldersWithContent.has(folder.id))
        .sort((a, b) => {
          const depthA = a.path?.split('/').length || 0;
          const depthB = b.path?.split('/').length || 0;
          return depthA - depthB;
        });
      
      logger.info('Folders to create', {
        foldersWithContent: Array.from(foldersWithContent),
        foldersToCreate: foldersToCreate.map(f => ({ id: f.id, name: f.name }))
      });

      // Create folders on the server
      for (const folder of foldersToCreate) {
        // Map the parentId from staged to server ID
        const parentId = folder.parentId && folderIdMap.has(folder.parentId) 
          ? folderIdMap.get(folder.parentId) 
          : null;
        
        const folderResult = await createLinkFolderAction({
          linkId,
          name: folder.name,
          ...(parentId && { parentId }),
        });

        if (folderResult.success && folderResult.data) {
          folderIdMap.set(folder.id, folderResult.data.folderId);
          logger.info('Created folder on server', { 
            stagedId: folder.id, 
            serverId: folderResult.data.folderId,
            name: folder.name,
            parentId 
          });
        } else {
          logger.error('Failed to create folder', { 
            folder: folder.name, 
            error: folderResult.error 
          });
        }
      }

      // Initialize counters
      let uploadedCount = 0;
      let failedCount = 0;

      // Upload files using the centralized service
      // We need to modify the API endpoint to accept link-specific parameters
      for (let i = 0; i < stagedFiles.length; i++) {
        const stagedFile = stagedFiles[i];
        if (!stagedFile) continue; // Skip if undefined
        
        // Map the staged folder ID to the server folder ID
        const targetFolderId = stagedFile.parentId 
          ? folderIdMap.get(stagedFile.parentId) || null 
          : null;
        
        logger.info('Uploading file', {
          fileName: stagedFile.name,
          stagedParentId: stagedFile.parentId,
          serverFolderId: targetFolderId,
        });

        // Update progress state
        progressMap.set(stagedFile.id, {
          fileId: stagedFile.id,
          progress: 0,
          status: 'uploading',
        });
        setUploadProgress(new Map(progressMap));

        try {
          // Create FormData with link-specific parameters
          const formData = new FormData();
          formData.append('file', stagedFile.file);
          formData.append('linkId', linkId);
          formData.append('batchId', batchId);
          formData.append('fileId', stagedFile.id);
          if (targetFolderId) {
            formData.append('folderId', targetFolderId);
          }

          // Use XMLHttpRequest for progress tracking (similar to centralized service)
          const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable && stagedFile) {
                const progress = Math.round((e.loaded / e.total) * 100);
                progressMap.set(stagedFile.id, {
                  fileId: stagedFile.id,
                  progress,
                  status: 'uploading',
                });
                setUploadProgress(new Map(progressMap));
                
                // Update overall progress
                const overall = Math.round(((uploadedCount + (progress / 100)) / stagedFiles.length) * 100);
                setOverallProgress(overall);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve({ success: response.success, error: response.error });
                } catch {
                  resolve({ success: false, error: 'Invalid response' });
                }
              } else {
                resolve({ success: false, error: `Upload failed: ${xhr.status}` });
              }
            });

            xhr.addEventListener('error', () => {
              resolve({ success: false, error: 'Network error' });
            });

            xhr.open('POST', '/api/link-upload/upload');
            xhr.send(formData);
          });

          if (result.success && stagedFile) {
            uploadedCount++;
            progressMap.set(stagedFile.id, {
              fileId: stagedFile.id,
              progress: 100,
              status: 'success',
            });
            updateFileStatus(stagedFile.id, 'uploaded', 100);
          } else if (stagedFile) {
            failedCount++;
            progressMap.set(stagedFile.id, {
              fileId: stagedFile.id,
              progress: 0,
              status: 'error',
              ...(result.error && { error: result.error }),
            });
            updateFileStatus(stagedFile.id, 'error', 0, result.error);
          }
        } catch (error) {
          if (stagedFile) {
            failedCount++;
            const errorMsg = error instanceof Error ? error.message : 'Upload failed';
            progressMap.set(stagedFile.id, {
              fileId: stagedFile.id,
              progress: 0,
              status: 'error',
              error: errorMsg,
            });
            updateFileStatus(stagedFile.id, 'error', 0, errorMsg);
          }
        }

        setUploadProgress(new Map(progressMap));
      }

      // Update batch status
      // Use 'failed' for partial uploads since 'partial' doesn't exist in the enum
      await updateBatchProgressAction({
        batchId,
        processedFiles: uploadedCount,
        status: uploadedCount === stagedFiles.length ? 'completed' : 'failed',
      });

      // Clear staging after upload - external uploaders shouldn't see previously uploaded files
      // This is the intended behavior for link uploads
      clearAllStaged();

      onUploadComplete?.();

      return {
        success: failedCount === 0,
        uploadedCount,
        failedCount,
        batchId,
      };

    } catch (error) {
      logger.error('Batch upload failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    } finally {
      setIsUploading(false);
    }
  }, [linkId, getAllStagedItems, clearAllStaged, updateFileStatus, onUploadComplete]);

  return {
    uploadStagedFiles,
    isUploading,
    uploadProgress,
    overallProgress,
  };
}