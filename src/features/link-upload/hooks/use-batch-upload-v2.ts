'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { linkQueryKeys } from '../lib/query-keys';
import { createBatchAction, completeBatchAction } from '../lib/actions';
import { createLinkFolderAction } from '../lib/actions/link-folder-actions';
import type { StagedFile, StagedFolder } from '../stores/staging-store';

interface BatchUploadParams {
  files: Array<{
    id: string;
    file: File;
    parentFolderId?: string | null;
    uploaderName?: string;
  }>;
  folders: Array<{
    id: string;
    name: string;
    parentFolderId?: string | null;
  }>;
  linkId: string;
  linkSlug?: string;
  linkPassword?: string;
  uploaderName?: string;
  uploaderEmail?: string | null;
  uploaderMessage?: string | null;
}

interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
  currentItem?: string;
  errors: Array<{ itemId: string; itemName: string; error: string }>;
}

interface BatchUploadResult {
  success: boolean;
  data?: {
    batchId: string;
    uploadedFiles: number;
    createdFolders: number;
    totalProcessed: number;
  };
  error?: string;
  progress?: BatchUploadProgress;
}

export function useBatchUploadV2() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null);
  const queryClient = useQueryClient();

  const uploadBatch = useCallback(async (params: BatchUploadParams): Promise<BatchUploadResult> => {
    setIsUploading(true);
    const totalItems = params.files.length + params.folders.length;
    
    setProgress({
      total: totalItems,
      completed: 0,
      failed: 0,
      errors: [],
    });

    const results = {
      batchId: '',
      uploadedFiles: 0,
      createdFolders: 0,
      totalProcessed: 0,
      errors: [] as Array<{ itemId: string; itemName: string; error: string }>
    };

    // Map staging IDs to database IDs for folders
    const folderIdMap = new Map<string, string>();

    try {
      // Step 1: Create batch if we have files
      let batchId: string | undefined;
      let batchResult: any;
      
      if (params.files.length > 0) {
        // Create batch with file metadata
        batchResult = await createBatchAction({
          linkId: params.linkId,
          files: params.files.map(fileData => ({
            fileName: fileData.file.name,
            fileSize: fileData.file.size,
            mimeType: fileData.file.type,
            uploaderName: fileData.uploaderName || params.uploaderName || 'Anonymous',
          })),
          uploaderName: params.uploaderName || 'Anonymous',
          uploaderEmail: params.uploaderEmail || undefined,
          uploaderMessage: params.uploaderMessage || undefined,
        });
        
        if (!batchResult.success) {
          throw new Error(batchResult.error || 'Failed to create upload batch');
        }
        
        batchId = batchResult.data.batchId;
        results.batchId = batchId;
      }

      // Step 2: Create all folders first (they don't require file uploads)
      for (const folder of params.folders) {
        try {
          setProgress(prev => prev ? { ...prev, currentItem: `Creating folder: ${folder.name}` } : null);
          
          // Resolve parent folder ID if it exists
          let parentFolderId = folder.parentFolderId;
          if (parentFolderId && folderIdMap.has(parentFolderId)) {
            parentFolderId = folderIdMap.get(parentFolderId) || undefined;
          }
          
          const result = await createLinkFolderAction(
            params.linkId,
            folder.name,
            parentFolderId || undefined,
            batchId
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to create folder');
          }
          
          // Map staging ID to database ID
          if (result.success && result.data?.folderId) {
            folderIdMap.set(folder.id, result.data.folderId);
          }
          
          results.createdFolders++;
          results.totalProcessed++;
          
          setProgress(prev => prev ? { 
            ...prev, 
            completed: prev.completed + 1,
            currentItem: undefined
          } : null);
        } catch (error) {
          results.errors.push({
            itemId: folder.id,
            itemName: folder.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.totalProcessed++;
          
          setProgress(prev => prev ? { 
            ...prev, 
            completed: prev.completed + 1,
            failed: prev.failed + 1,
            errors: [...prev.errors, {
              itemId: folder.id,
              itemName: folder.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            }],
            currentItem: undefined
          } : null);
        }
      }

      // Step 3: Upload all files individually via API route
      if (params.files.length > 0 && batchId) {
        for (let i = 0; i < params.files.length; i++) {
          const fileData = params.files[i];
          const batchFile = batchResult.data.files[i];
          
          if (!batchFile || !fileData.file) {
            results.errors.push({
              itemId: fileData.id,
              itemName: fileData.file?.name || 'Unknown file',
              error: 'Batch file not found',
            });
            results.totalProcessed++;
            
            setProgress(prev => prev ? { 
              ...prev, 
              completed: prev.completed + 1,
              failed: prev.failed + 1,
              errors: [...prev.errors, {
                itemId: fileData.id,
                itemName: fileData.file?.name || 'Unknown file',
                error: 'Batch file not found',
              }]
            } : null);
            continue;
          }
          
          try {
            setProgress(prev => prev ? { 
              ...prev, 
              currentItem: `Uploading: ${fileData.file.name}` 
            } : null);
            
            // Resolve parent folder ID if it exists
            let parentFolderId = fileData.parentFolderId;
            if (parentFolderId && folderIdMap.has(parentFolderId)) {
              parentFolderId = folderIdMap.get(parentFolderId);
            }
            
            // Create FormData for individual file upload
            const uploadFormData = new FormData();
            uploadFormData.append('file', fileData.file);
            uploadFormData.append('batchId', batchId);
            uploadFormData.append('fileId', batchFile.id);
            uploadFormData.append('linkId', params.linkId);
            if (parentFolderId) {
              uploadFormData.append('folderId', parentFolderId);
            }
            if (params.linkSlug) {
              uploadFormData.append('linkSlug', params.linkSlug);
            }
            if (params.linkPassword) {
              uploadFormData.append('linkPassword', params.linkPassword);
            }
            
            // Upload file via API route
            const response = await fetch('/api/link-upload/upload', {
              method: 'POST',
              body: uploadFormData,
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }
            
            const uploadResult = await response.json();
            
            if (!uploadResult.success) {
              throw new Error(uploadResult.error || 'Upload failed');
            }
            
            results.uploadedFiles++;
            results.totalProcessed++;
            
            setProgress(prev => prev ? { 
              ...prev, 
              completed: prev.completed + 1,
              currentItem: undefined
            } : null);
          } catch (error) {
            results.errors.push({
              itemId: fileData.id,
              itemName: fileData.file.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            results.totalProcessed++;
            
            setProgress(prev => prev ? { 
              ...prev, 
              completed: prev.completed + 1,
              failed: prev.failed + 1,
              errors: [...prev.errors, {
                itemId: fileData.id,
                itemName: fileData.file.name,
                error: error instanceof Error ? error.message : 'Unknown error',
              }],
              currentItem: undefined
            } : null);
          }
        }

        // Step 4: Complete the batch
        if (batchId) {
          await completeBatchAction(batchId);
        }
      }

      // Invalidate queries to refresh the tree
      await queryClient.invalidateQueries({ 
        queryKey: linkQueryKeys.tree(params.linkId) 
      });

      return {
        success: true,
        data: results,
        progress: progress,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      return {
        success: false,
        error: errorMessage,
        progress: progress,
      };
    } finally {
      setIsUploading(false);
      setProgress(prev => prev ? { ...prev, currentItem: undefined } : null);
    }
  }, [queryClient]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
  }, []);

  return {
    uploadBatch,
    isUploading,
    progress,
    reset,
  };
}