'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workspaceQueryKeys } from '../lib/query-keys';
import type { UploadFile } from '../components/upload/file-upload-area';
import { UPLOAD_CONFIG } from '../lib/config/upload-config';
import { 
  useStorageTracking, 
  usePreUploadValidation,
  useInvalidateStorage,
  useStorageQuotaStatus,
  useLiveStorage,
} from './index';
import { 
  showStorageWarning,
  showStorageCritical,
  checkAndShowStorageThresholds
} from '@/features/notifications/internal/workspace-notifications';
import type { StorageNotificationData } from '@/features/notifications/internal/types';
import { logger } from '@/lib/services/logging/logger';

/**
 * Modern upload function using Fetch API with progress tracking
 * Replaces XMLHttpRequest for better error handling and streaming support
 */
async function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (loaded: number, total: number) => void
): Promise<any> {
  // Set up progress simulation
  let progressInterval: NodeJS.Timeout | null = null;
  
  if (onProgress) {
    const fileEntry = Array.from(formData.entries())
      .find(([key]) => key === 'file');
    const file = fileEntry?.[1] as File | undefined;
    
    if (file) {
      // Simulate progress
      let loaded = 0;
      const total = file.size;
      
      progressInterval = setInterval(() => {
        loaded = Math.min(loaded + total * 0.1, total * 0.95);
        onProgress(loaded, total);
        
        if (loaded >= total * 0.95 && progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
      }, 200);
    }
  }

  try {
    // For browsers that support ReadableStream progress tracking
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Enable duplex for streaming if needed in future
      // @ts-ignore - duplex is not in TypeScript types yet
      duplex: 'half',
    });

    // Check response status
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    // Clear interval and set progress to 100%
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    if (onProgress) {
      const fileEntry = Array.from(formData.entries())
        .find(([key]) => key === 'file');
      const file = fileEntry?.[1] as File | undefined;
      if (file) {
        onProgress(file.size, file.size); // Set to 100%
      }
    }

    return data;
  } catch (error) {
    // Clear interval on error
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    logger.error('Upload failed', error);
    throw error;
  }

  // Note: Native fetch doesn't support upload progress tracking yet.
  // For production, consider using:
  // 1. Server-Sent Events for progress updates
  // 2. WebSockets for bidirectional communication
  // 3. A library like axios that still uses XMLHttpRequest under the hood
  // 4. The upcoming Fetch Upload Streams API when available
}

interface UseFileUploadProps {
  workspaceId?: string | undefined;
  folderId?: string | undefined;
  onClose?: (() => void) | undefined;
}

export function useFileUpload({ workspaceId, folderId, onClose }: UseFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadValidation, setUploadValidation] = useState<{
    valid: boolean;
    reason?: string;
    totalSize: number;
    exceedsLimit: boolean;
    invalidFiles?: Array<{
      file: File;
      reason: string;
    }>;
    maxFileSize?: number;
  } | null>(null);
  
  const queryClient = useQueryClient();
  const { storageInfo, formatSize } = useStorageTracking();
  const preUploadValidation = usePreUploadValidation();
  const invalidateStorage = useInvalidateStorage();
  const quotaStatus = useStorageQuotaStatus();
  const liveStorage = useLiveStorage();

  // File selection handler
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles) return;

    const fileArray = selectedFiles instanceof FileList 
      ? Array.from(selectedFiles) 
      : selectedFiles;

    // Always add files to the list for visibility
    const newFiles: UploadFile[] = fileArray.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      status: 'pending',
      retryCount: 0,
      maxRetries: UPLOAD_CONFIG.batch.maxRetries,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Validate storage after adding files
    const validation = await preUploadValidation(fileArray);
    setUploadValidation(validation);

    // Show appropriate notifications based on validation
    if (!validation.valid) {
      if (validation.invalidFiles && validation.invalidFiles.length > 0) {
        // File size limit exceeded
        toast.error('File size limit exceeded', {
          description: `${validation.invalidFiles.length} file(s) exceed your plan's size limit`,
          duration: 5000,
        });
      } else if (validation.exceedsLimit) {
        // Storage quota exceeded
        toast.error('Storage limit exceeded', {
          description: validation.reason,
          duration: 5000,
        });
      } else {
        // Other validation errors
        toast.error('Upload validation failed', {
          description: validation.reason || 'Please check your files and try again',
          duration: 5000,
        });
      }
    } else if (validation.valid && quotaStatus.status !== 'safe') {
      // Show warning if approaching limit
      toast.warning('Storage getting full', {
        description: `${formatSize(validation.totalSize)} will be added. ${formatSize(storageInfo.remainingBytes - validation.totalSize)} remaining.`,
      });
    }
  }, [preUploadValidation, quotaStatus.status, formatSize, storageInfo.remainingBytes]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  // Remove file handler
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadValidation(null);
  }, []);

  // Single file upload with retry logic
  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile, retryCount = 0): Promise<any> => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const maxRetries = uploadFile.maxRetries || UPLOAD_CONFIG.batch.maxRetries;
      
      // Start tracking this file in live storage
      liveStorage.startFileUpload(uploadFile.id, uploadFile.file.size);

      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );

      try {
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('workspaceId', workspaceId);
        if (folderId) {
          formData.append('folderId', folderId);
        }
        
        logger.debug('Uploading file', {
          metadata: {
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            workspaceId,
            folderId
          }
        });

        // Upload with progress tracking using fetch API with streaming
        const result = await uploadWithProgress(
          '/api/workspace/upload',
          formData,
          (loaded, total) => {
            const progress = (loaded / total) * 100;
            
            // Update file progress
            setFiles(prev =>
              prev.map(f => (f.id === uploadFile.id ? { ...f, progress } : f))
            );
            
            // Update live storage tracking
            liveStorage.updateFileProgress(uploadFile.id, loaded);
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Handle storage notifications based on upload result
        if (result.storageInfo && result.storageInfo.shouldShowWarning) {
          const storageData: StorageNotificationData = {
            currentUsage: (storageInfo.storageLimitBytes * result.storageInfo.usagePercentage) / 100,
            totalLimit: storageInfo.storageLimitBytes,
            remainingSpace: result.storageInfo.remainingBytes,
            usagePercentage: result.storageInfo.usagePercentage,
            planKey: storageInfo.planKey,
            filesCount: storageInfo.filesCount + 1,
          };
          
          checkAndShowStorageThresholds(storageData, storageInfo.usagePercentage);
        }

        // Complete the progress
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, progress: 100, status: 'success' as const }
              : f
          )
        );

        // Mark file as completed in live storage
        liveStorage.completeFileUpload(uploadFile.id);

        return result.data;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        // Check if we should retry
        const isRetryableError = 
          errorMessage.includes('Network error') ||
          errorMessage.includes('status 502') ||
          errorMessage.includes('status 503') ||
          errorMessage.includes('status 504') ||
          errorMessage.includes('timeout');
        
        if (isRetryableError && retryCount < maxRetries) {
          // Update retry count in UI
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    retryCount: retryCount + 1,
                    status: 'uploading' as const,
                    error: `Retrying... (${retryCount + 1}/${maxRetries})`,
                  }
                : f
            )
          );
          
          // Exponential backoff: wait longer between retries
          const delay = UPLOAD_CONFIG.batch.retryDelays[retryCount] || 10000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry the upload
          return uploadSingleFile({ ...uploadFile, retryCount: retryCount + 1 }, retryCount + 1);
        }
        
        // Mark file as failed in live storage
        liveStorage.failFileUpload(uploadFile.id);
        
        setFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: errorMessage,
                  retryCount,
                }
              : f
          )
        );
        throw error;
      }
    },
    [workspaceId, folderId, liveStorage, storageInfo]
  );

  // Batch upload handler with parallel uploads
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !workspaceId) return;

    // Prevent upload if validation failed
    if (uploadValidation && !uploadValidation.valid) {
      toast.error('Cannot upload files', {
        description: uploadValidation.reason || 'Some files exceed the size limit',
        duration: 5000,
      });
      return;
    }

    setIsUploading(true);
    
    // Update base usage in live storage before starting
    liveStorage.updateBaseUsage(storageInfo.storageUsedBytes);

    try {
      // Filter out files that are too large based on validation
      const validFiles = uploadValidation?.invalidFiles 
        ? files.filter(file => !uploadValidation.invalidFiles?.some((invalid: { file: File; reason: string }) => invalid.file.name === file.file.name))
        : files;

      if (validFiles.length === 0) {
        toast.error('No valid files to upload', {
          description: 'All files exceed the size limit',
          duration: 5000,
        });
        setIsUploading(false);
        return;
      }

      // Upload files in parallel batches to improve performance
      const BATCH_SIZE = UPLOAD_CONFIG.batch.size;
      const results: any[] = [];
      
      for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE)
          .filter(file => file.status === 'pending' || file.status === 'error');
        
        if (batch.length > 0) {
          const batchResults = await Promise.allSettled(
            batch.map(file => uploadSingleFile(file))
          );
          
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            }
          });
        }
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
      
      // Invalidate storage data to reflect changes
      invalidateStorage();

      const successCount = results.length;
      const failedCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`);
      }
      if (failedCount > 0) {
        toast.error(`Failed to upload ${failedCount} file(s)`);
      }
      
      // Show final storage status if approaching limits
      const finalResult = results[results.length - 1];
      if (finalResult && finalResult.storageInfo && finalResult.storageInfo.usagePercentage >= 90) {
        const storageData: StorageNotificationData = {
          currentUsage: (storageInfo.storageLimitBytes * finalResult.storageInfo.usagePercentage) / 100,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: finalResult.storageInfo.remainingBytes,
          usagePercentage: finalResult.storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          filesCount: storageInfo.filesCount + successCount,
        };
        
        if (finalResult.storageInfo.usagePercentage >= 95) {
          showStorageCritical(storageData);
        } else {
          showStorageWarning(storageData);
        }
      }

      // Clear files after upload attempt
      setTimeout(() => {
        setFiles([]);
        onClose?.();
        // Reset live storage tracking
        liveStorage.resetLiveTracking();
      }, 1000);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      // Reset live storage if all uploads are done
      if (!files.some(f => f.status === 'uploading')) {
        liveStorage.resetLiveTracking();
      }
    }
  }, [files, workspaceId, uploadSingleFile, queryClient, onClose, liveStorage, storageInfo, invalidateStorage]);

  // Re-validate when files change
  useEffect(() => {
    if (files.length > 0) {
      const fileList = files.map(f => f.file);
      preUploadValidation(fileList).then(setUploadValidation);
    } else {
      setUploadValidation(null);
    }
  }, [files, preUploadValidation]);

  // Format file size utility
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Computed values
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'success').length;
  const failedFiles = files.filter(f => f.status === 'error').length;

  return {
    // State
    files,
    isDragging,
    isUploading,
    uploadValidation,
    
    // Handlers
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveFile,
    handleUpload,
    clearFiles,
    
    // Utils
    formatFileSize,
    formatSize,
    
    // Computed
    totalFiles,
    completedFiles,
    failedFiles,
    
    // Storage
    quotaStatus,
    storageInfo,
  };
}