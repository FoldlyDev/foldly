'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { emitNotification } from '@/features/notifications/core/event-bus';
import { NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core/event-types';

/**
 * Upload function using XMLHttpRequest for real progress tracking
 * XMLHttpRequest is still the best way to track upload progress natively
 */
async function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress?: (loaded: number, total: number) => void,
  abortSignal?: AbortSignal
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Set up progress tracking
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      });
    }
    
    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (!data.success) {
            reject(new Error(data.error || 'Upload failed'));
          } else {
            resolve(data);
          }
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });
    
    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });
    
    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout'));
    });
    
    // Set up abort signal if provided
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort();
      });
    }
    
    // Configure and send request
    xhr.open('POST', url);
    xhr.timeout = 300000; // 5 minute timeout for large files
    xhr.send(formData);
  });
}

interface UseFileUploadProps {
  workspaceId?: string | undefined;
  folderId?: string | undefined;
  onClose?: (() => void) | undefined;
  onFileUploaded?: ((file: any) => void) | undefined;
}

export function useFileUpload({ workspaceId, folderId, onClose, onFileUploaded }: UseFileUploadProps) {
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
  
  // Store abort controllers for each upload
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // File selection handler
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles) return;

    const fileArray = selectedFiles instanceof FileList 
      ? Array.from(selectedFiles) 
      : selectedFiles;

    // Check if adding these files would exceed the maximum limit
    const maxFiles = UPLOAD_CONFIG.batch.maxFilesPerUpload || 50;
    const totalFiles = files.length + fileArray.length;
    
    if (totalFiles > maxFiles) {
      emitNotification(NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED, {
        attemptedCount: totalFiles,
        maxAllowed: maxFiles,
        currentCount: files.length,
        message: `You can upload a maximum of ${maxFiles} files at once. You currently have ${files.length} file${files.length !== 1 ? 's' : ''} and are trying to add ${fileArray.length} more.`,
      }, {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 6000,
      });
      return;
    }

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
        emitNotification(NotificationEventType.STORAGE_UPLOAD_BLOCKED, {
          currentUsage: storageInfo.storageUsedBytes,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: storageInfo.remainingBytes,
          usagePercentage: storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          message: `${validation.invalidFiles.length} file(s) exceed your plan's size limit`,
        }, {
          priority: NotificationPriority.HIGH,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 5000,
        });
      } else if (validation.exceedsLimit) {
        // Storage quota exceeded
        emitNotification(NotificationEventType.STORAGE_LIMIT_EXCEEDED, {
          currentUsage: storageInfo.storageUsedBytes,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: storageInfo.remainingBytes,
          usagePercentage: storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          ...(validation.reason && { message: validation.reason }),
        }, {
          priority: NotificationPriority.HIGH,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 5000,
        });
      } else {
        // Other validation errors
        emitNotification(NotificationEventType.STORAGE_UPLOAD_BLOCKED, {
          currentUsage: storageInfo.storageUsedBytes,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: storageInfo.remainingBytes,
          usagePercentage: storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          message: validation.reason || 'Please check your files and try again',
        }, {
          priority: NotificationPriority.HIGH,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 5000,
        });
      }
    } else if (validation.valid && quotaStatus.status !== 'safe') {
      // Show warning if approaching limit
      emitNotification(NotificationEventType.STORAGE_THRESHOLD_WARNING, {
        currentUsage: storageInfo.storageUsedBytes + validation.totalSize,
        totalLimit: storageInfo.storageLimitBytes,
        remainingSpace: storageInfo.remainingBytes - validation.totalSize,
        usagePercentage: ((storageInfo.storageUsedBytes + validation.totalSize) / storageInfo.storageLimitBytes) * 100,
        planKey: storageInfo.planKey,
        message: `${formatSize(validation.totalSize)} will be added. ${formatSize(storageInfo.remainingBytes - validation.totalSize)} remaining.`,
      }, {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 4000,
      });
    }
  }, [files.length, preUploadValidation, quotaStatus.status, formatSize, storageInfo]);

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
  
  // Cancel a specific upload
  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllersRef.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(fileId);
      
      // Update file status
      setFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error' as const, error: 'Upload cancelled' }
            : f
        )
      );
      
      // Mark as failed in live storage
      liveStorage.failFileUpload(fileId);
    }
  }, [liveStorage]);
  
  // Cancel all uploads
  const cancelAllUploads = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
    
    // Update all uploading files to cancelled
    setFiles(prev =>
      prev.map(f =>
        f.status === 'uploading'
          ? { ...f, status: 'error' as const, error: 'Upload cancelled' }
          : f
      )
    );
    
    setIsUploading(false);
    liveStorage.resetLiveTracking();
  }, [liveStorage]);

  // Single file upload with retry logic
  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile, skipNotifications = false, retryCount = 0): Promise<any> => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      const maxRetries = uploadFile.maxRetries || UPLOAD_CONFIG.batch.maxRetries;
      
      // Create abort controller for this upload
      const abortController = new AbortController();
      abortControllersRef.current.set(uploadFile.id, abortController);
      
      // Start tracking this file in live storage
      liveStorage.startFileUpload(uploadFile.id, uploadFile.file.size);

      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );
      
      // Emit upload start event (only for single uploads)
      if (!skipNotifications) {
        emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_START, {
          fileId: uploadFile.id,
          fileName: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          workspaceId: workspaceId,
          ...(folderId && { parentId: folderId }),
          uploadProgress: 0
        }, {
          priority: NotificationPriority.MEDIUM,
          uiType: NotificationUIType.PROGRESS,
          duration: 0, // Don't auto-dismiss progress notifications
          persistent: true,
          deduplicationKey: `upload-${uploadFile.id}`
        });
      }

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

        // Upload with real progress tracking using XMLHttpRequest
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
            
            // Emit progress event (only for single uploads)
            if (!skipNotifications) {
              emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS, {
                fileId: uploadFile.id,
                fileName: uploadFile.file.name,
                fileSize: uploadFile.file.size,
                workspaceId: workspaceId,
                ...(folderId && { parentId: folderId }),
                uploadProgress: progress
              }, {
                priority: NotificationPriority.LOW,
                uiType: NotificationUIType.PROGRESS,
                duration: 0,
                persistent: true,
                deduplicationKey: `upload-${uploadFile.id}`
              });
            }
          },
          abortController.signal
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
        
        // Emit success event (only for single uploads)
        if (!skipNotifications) {
          emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS, {
            fileId: uploadFile.id, // Use consistent ID, not the server's ID
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            workspaceId: workspaceId,
            ...(folderId && { parentId: folderId })
          }, {
            priority: NotificationPriority.LOW,
            uiType: NotificationUIType.PROGRESS,
            duration: 3000,
            deduplicationKey: `upload-${uploadFile.id}`
          });
        }
        
        // Clean up abort controller
        abortControllersRef.current.delete(uploadFile.id);

        // Call the onFileUploaded callback to add file to tree
        if (onFileUploaded && result.data) {
          onFileUploaded(result.data);
        }

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
          return uploadSingleFile({ ...uploadFile, retryCount: retryCount + 1 }, skipNotifications, retryCount + 1);
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
        
        // Emit error event (only for single uploads)
        if (!skipNotifications) {
          emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
            fileId: uploadFile.id,
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            workspaceId: workspaceId,
            ...(folderId && { parentId: folderId }),
            error: errorMessage
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.PROGRESS,
            duration: 5000,
            deduplicationKey: `upload-${uploadFile.id}`
          });
        }
        
        // Clean up abort controller
        abortControllersRef.current.delete(uploadFile.id);
        
        throw error;
      }
    },
    [workspaceId, folderId, liveStorage, storageInfo, onFileUploaded]
  );

  // Batch upload handler with parallel uploads
  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !workspaceId) return;

    // Prevent upload if validation failed
    if (uploadValidation && !uploadValidation.valid) {
      emitNotification(NotificationEventType.STORAGE_UPLOAD_BLOCKED, {
        currentUsage: storageInfo.storageUsedBytes,
        totalLimit: storageInfo.storageLimitBytes,
        remainingSpace: storageInfo.remainingBytes,
        usagePercentage: storageInfo.usagePercentage,
        planKey: storageInfo.planKey,
        message: uploadValidation.reason || 'Some files exceed the size limit',
      }, {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 5000,
      });
      return;
    }

    setIsUploading(true);
    
    // Update base usage in live storage before starting
    liveStorage.updateBaseUsage(storageInfo.storageUsedBytes);
    
    // Check if this is a batch upload (multiple files)
    const isBatchUpload = files.length > 1;
    const batchId = isBatchUpload ? `batch-${Date.now()}` : null;

    try {
      // Filter out files that are too large based on validation
      const validFiles = uploadValidation?.invalidFiles 
        ? files.filter(file => !uploadValidation.invalidFiles?.some((invalid: { file: File; reason: string }) => invalid.file.name === file.file.name))
        : files;

      if (validFiles.length === 0) {
        emitNotification(NotificationEventType.STORAGE_UPLOAD_BLOCKED, {
          currentUsage: storageInfo.storageUsedBytes,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: storageInfo.remainingBytes,
          usagePercentage: storageInfo.usagePercentage,
          planKey: storageInfo.planKey,
          message: 'All files exceed the size limit',
        }, {
          priority: NotificationPriority.HIGH,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 5000,
        });
        setIsUploading(false);
        return;
      }
      
      // For batch uploads, show a single aggregated notification
      if (isBatchUpload && batchId) {
        // Show a loading notification for batch upload
        emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_START, {
          batchId: batchId,
          totalItems: validFiles.length,
          completedItems: 0,
        }, {
          priority: NotificationPriority.MEDIUM,
          uiType: NotificationUIType.PROGRESS,
          duration: 0,
          persistent: true,
          deduplicationKey: batchId,
        });
      }

      // Upload files in parallel batches to improve performance
      const BATCH_SIZE = UPLOAD_CONFIG.batch.size;
      const results: any[] = [];
      let completedCount = 0;
      let uploadFailedCount = 0;
      
      for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
        const batch = validFiles.slice(i, i + BATCH_SIZE)
          .filter(file => file.status === 'pending' || file.status === 'error');
        
        if (batch.length > 0) {
          const batchResults = await Promise.allSettled(
            batch.map(file => uploadSingleFile(file, isBatchUpload))
          );
          
          batchResults.forEach((result) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
              completedCount++;
            } else {
              uploadFailedCount++;
            }
            
            // Update batch progress notification
            if (isBatchUpload && batchId) {
              // Update the progress notification
              emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS, {
                batchId: batchId,
                totalItems: validFiles.length,
                completedItems: completedCount,
                failedItems: uploadFailedCount,
              }, {
                priority: NotificationPriority.LOW,
                uiType: NotificationUIType.PROGRESS,
                duration: 0,
                persistent: true,
                deduplicationKey: batchId,
              });
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
      const finalFailedCount = files.filter(f => f.status === 'error').length;
      
      // Show final batch notification
      if (isBatchUpload && batchId) {
        if (successCount > 0 && finalFailedCount === 0) {
          emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS, {
            batchId: batchId,
            totalItems: validFiles.length,
            completedItems: successCount,
          }, {
            priority: NotificationPriority.LOW,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 3000,
            deduplicationKey: batchId,
          });
        } else if (successCount > 0 && finalFailedCount > 0) {
          emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS, {
            batchId: batchId,
            totalItems: validFiles.length,
            completedItems: successCount,
            failedItems: finalFailedCount,
          }, {
            priority: NotificationPriority.MEDIUM,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
            deduplicationKey: batchId,
          });
        } else if (finalFailedCount > 0) {
          emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR, {
            batchId: batchId,
            totalItems: validFiles.length,
            completedItems: 0,
            failedItems: finalFailedCount,
            error: `Failed to upload ${finalFailedCount} file${finalFailedCount === 1 ? '' : 's'}`,
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
            deduplicationKey: batchId,
          });
        }
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

      // Only close modal and clear files if all uploads succeeded
      if (finalFailedCount === 0 && successCount > 0) {
        setTimeout(() => {
          setFiles([]);
          onClose?.();
          // Reset live storage tracking
          liveStorage.resetLiveTracking();
        }, 1000);
      } else {
        // Keep files visible on error but reset live storage
        liveStorage.resetLiveTracking();
      }
    } catch (error) {
      emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
        fileId: 'batch',
        fileName: 'Multiple files',
        workspaceId: workspaceId || '',
        error: error instanceof Error ? error.message : 'Upload failed',
      }, {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 5000,
      });
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
    cancelUpload,
    cancelAllUploads,
    
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