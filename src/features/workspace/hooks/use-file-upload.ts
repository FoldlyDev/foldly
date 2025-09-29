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
import { clientUploadService } from '@/lib/services/upload/client-upload-service';

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
  // Store upload service IDs for cancellation
  const uploadServiceIdsRef = useRef<Map<string, string>>(new Map());

  // File selection handler
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles) return;

    const fileArray = selectedFiles instanceof FileList 
      ? Array.from(selectedFiles) 
      : selectedFiles;
    
    console.log('📤 [USE-FILE-UPLOAD] handleFileSelect called:', {
      source: selectedFiles instanceof FileList ? 'FileList' : 'File[]',
      fileCount: fileArray.length,
      currentFiles: files.length,
      fileNames: fileArray.map(f => f.name),
      fileTypes: fileArray.map(f => f.type)
    });

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
    // Generate preview URLs for image files here, at the source
    const newFiles: UploadFile[] = fileArray.map(file => {
      // If it's an image, create a preview URL and attach it to the file
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        // Attach preview to the file object
        Object.assign(file, { preview });
        console.log('🎨 [USE-FILE-UPLOAD] Created preview for image:', file.name, preview);
      }
      
      return {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'pending',
        retryCount: 0,
        maxRetries: UPLOAD_CONFIG.batch.maxRetries,
      };
    });

    console.log('➕ [USE-FILE-UPLOAD] Adding files to state:', {
      newFilesCount: newFiles.length,
      previousCount: files.length,
      totalAfter: files.length + newFiles.length
    });
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
      
      // Note: Upload notifications are now handled by the upload service

      try {
        logger.debug('Uploading file', {
          metadata: {
            fileName: uploadFile.file.name,
            fileSize: uploadFile.file.size,
            workspaceId,
            folderId
          }
        });

        // Upload with real progress tracking using the simplified client service
        const result = await clientUploadService.uploadFile(
          uploadFile.file,
          workspaceId,
          folderId || undefined,
          {
            onStart: (uploadServiceId) => {
              // Track the upload service ID for cancellation
              uploadServiceIdsRef.current.set(uploadFile.id, uploadServiceId);
            },
            onProgress: (progress) => {
              // Update file progress
              setFiles(prev =>
                prev.map(f => (f.id === uploadFile.id ? { ...f, progress } : f))
              );
              
              // Update live storage tracking with estimated bytes
              const estimatedLoaded = (progress / 100) * uploadFile.file.size;
              liveStorage.updateFileProgress(uploadFile.id, estimatedLoaded);
            },
            skipNotifications, // Pass through the skip flag
            signal: abortController.signal
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
        
        // Note: Success notification is now handled by the upload service
        
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
        
        // Note: Error notifications are now handled by the upload service
        
        // Clean up refs
        uploadServiceIdsRef.current.delete(uploadFile.id);
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
      // Initialize results array
      const results: any[] = [];
      
      // Filter out files that are too large based on validation
      const validFiles = uploadValidation?.invalidFiles 
        ? files.filter(file => !uploadValidation.invalidFiles?.some((invalid: { file: File; reason: string }) => invalid.file.name === file.file.name))
        : files;

      if (validFiles.length === 0) {
        // Only show notification if there were actually invalid files
        if (uploadValidation?.invalidFiles && uploadValidation.invalidFiles.length > 0) {
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
        }
        setIsUploading(false);
        return;
      }
      
      // Use the centralized batch upload if this is a batch
      if (isBatchUpload) {
        const filesToUpload = validFiles.map(f => f.file);
        
        // Use the centralized batch upload service
        const batchResults = await clientUploadService.uploadBatch(
          filesToUpload,
          workspaceId,
          folderId || undefined,
          {
            maxConcurrent: UPLOAD_CONFIG.batch.parallelUploads || 3,
            onFileComplete: (fileName, result) => {
              // Update the file status in state
              setFiles(prev =>
                prev.map(f =>
                  f.file.name === fileName
                    ? {
                        ...f,
                        status: result.success ? 'success' as const : 'error' as const,
                        progress: 100,
                        ...(result.data && { uploadedFile: result.data }),
                        ...(!result.success && { error: result.error })
                      }
                    : f
                )
              );
              
              // Call onFileUploaded callback if successful
              if (result.success && result.data && onFileUploaded) {
                onFileUploaded(result.data);
              }
            },
            onBatchProgress: (completed, total) => {
              // Optional: Update UI with batch progress
            }
          }
        );
        
        // Add successful results to the results array
        batchResults.forEach(r => {
          if (r.success && r.data) {
            results.push(r.data);
          }
        });
      } else {
        // Single file upload - use existing logic
        const PARALLEL_UPLOADS = UPLOAD_CONFIG.batch.parallelUploads || 3;
        let completedCount = 0;
        let uploadFailedCount = 0;
        
        for (let i = 0; i < validFiles.length; i += PARALLEL_UPLOADS) {
          const batch = validFiles.slice(i, i + PARALLEL_UPLOADS)
            .filter(file => file.status === 'pending' || file.status === 'error');
          
          if (batch.length > 0) {
            const batchResults = await Promise.allSettled(
              batch.map(file => uploadSingleFile(file, false))
            );
            
            batchResults.forEach((result) => {
              if (result.status === 'fulfilled') {
                results.push(result.value);
                completedCount++;
              } else {
                uploadFailedCount++;
              }
            });
          }
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
      
      // Note: Batch notifications are now handled by the centralized upload service
      
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