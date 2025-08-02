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

export function useBatchUpload() {
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
      }

      // Invalidate queries to refresh the tree
      await queryClient.invalidateQueries({ 
        queryKey: linkQueryKeys.tree(params.linkId) 
      });

      return {
        success: true,
        data: result.data || result,
        progress: result.data?.progress,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
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