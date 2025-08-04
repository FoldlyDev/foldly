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
  uploaderName?: string;
  uploaderEmail?: string | null;
  uploaderMessage?: string | null;
}

interface BatchUploadProgress {
  total: number;
  completed: number;
  failed: number;
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

interface UseBatchUploadOptions {
  linkId: string;
  onComplete?: (results: Array<{ success: boolean; error?: string }>) => Promise<void>;
  onProgress?: (progress: BatchUploadProgress) => void;
}

export function useBatchUpload(options: UseBatchUploadOptions) {
  const { linkId, onComplete, onProgress } = options;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<BatchUploadProgress | null>(null);
  const queryClient = useQueryClient();

  const uploadBatch = useCallback(async (
    items: { files: Array<any>; folders: Array<any> },
    uploaderInfo: {
      uploaderName?: string;
      uploaderEmail?: string;
      uploaderMessage?: string;
    }
  ): Promise<Array<{ success: boolean; error?: string }>> => {
    setIsUploading(true);
    
    // Prepare params with linkId from hook config
    const params: BatchUploadParams = {
      files: items.files,
      folders: items.folders,
      linkId,
      uploaderName: uploaderInfo.uploaderName,
      uploaderEmail: uploaderInfo.uploaderEmail || null,
      uploaderMessage: uploaderInfo.uploaderMessage || null,
    };
    
    const totalItems = params.files.length + params.folders.length;
    
    const progressData: BatchUploadProgress = {
      total: totalItems,
      completed: 0,
      failed: 0,
      errors: [],
    };
    
    setProgress(progressData);
    if (onProgress) {
      onProgress(progressData);
    }

    try {
      // Use the improved /api/link/upload endpoint that handles files directly
      // This avoids the 1MB Server Action limit
      const formData = new FormData();
      
      // Add link data
      formData.append('linkId', params.linkId);
      formData.append('uploaderName', params.uploaderName || 'Anonymous');
      if (params.uploaderEmail) {
        formData.append('uploaderEmail', params.uploaderEmail);
      }
      if (params.uploaderMessage) {
        formData.append('uploaderMessage', params.uploaderMessage);
      }
      
      // Add folders data as JSON
      formData.append('folders', JSON.stringify(params.folders));
      
      // Add files and their metadata
      params.files.forEach((fileData, index) => {
        formData.append(`file_${index}`, fileData.file);
        formData.append(`metadata_${index}`, JSON.stringify({
          id: fileData.id,
          fileName: fileData.file.name,
          parentFolderId: fileData.parentFolderId,
        }));
      });

      // Upload using the improved API route that handles files directly
      const response = await fetch('/api/link/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update progress
      if (result.data?.progress) {
        setProgress(result.data.progress);
        if (onProgress) {
          onProgress(result.data.progress);
        }
      }

      // Invalidate queries to refresh the tree
      await queryClient.invalidateQueries({ 
        queryKey: linkQueryKeys.tree(linkId) 
      });

      // Prepare results for onComplete callback
      const results: Array<{ success: boolean; error?: string }> = [];
      
      // Add success results for uploaded files
      for (let i = 0; i < (result.data?.uploadedFiles || 0); i++) {
        results.push({ success: true });
      }
      
      // Add success results for created folders
      for (let i = 0; i < (result.data?.createdFolders || 0); i++) {
        results.push({ success: true });
      }
      
      // Add error results if any
      if (result.data?.progress?.errors) {
        for (const error of result.data.progress.errors) {
          results.push({ success: false, error: error.error });
        }
      }
      
      // Call onComplete callback if provided
      if (onComplete) {
        await onComplete(results);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      const results = [{ 
        success: false, 
        error: errorMessage 
      }];
      
      if (onComplete) {
        await onComplete(results);
      }
      
      return results;
    } finally {
      setIsUploading(false);
    }
  }, [linkId, queryClient, onComplete, onProgress]);

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