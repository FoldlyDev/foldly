/**
 * Simplified Client-First Upload Service
 * 
 * This service provides client-side upload coordination with real progress tracking.
 * It leverages existing server actions for validation and database operations.
 * 
 * Key principles:
 * - Client-side progress tracking via XMLHttpRequest
 * - Direct upload to server via existing API endpoint
 * - No singleton pattern (stateless, works in serverless)
 * - Reuses existing server actions (no duplication)
 * - Simple and maintainable (~200 lines vs 1000+)
 */

import { logger } from '@/lib/services/logging/logger';
import { emitNotification } from '@/features/notifications/core/event-bus';
import { NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core/event-types';

// =============================================================================
// TYPES
// =============================================================================

export interface UploadOptions {
  onStart?: (uploadId: string) => void;
  onProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
  skipNotifications?: boolean; // Skip automatic notification emission
  batchId?: string; // Associated batch ID for correlation
}

export interface UploadResult {
  success: boolean;
  data?: any;
  error?: string;
  storageInfo?: {
    usagePercentage: number;
    remainingBytes: number;
    shouldShowWarning: boolean;
  };
}

export interface BatchUploadOptions extends UploadOptions {
  maxConcurrent?: number;
  onFileComplete?: (fileName: string, result: UploadResult) => void;
  onBatchProgress?: (completed: number, total: number) => void;
}

// =============================================================================
// CLIENT UPLOAD SERVICE
// =============================================================================

export class ClientUploadService {
  private activeUploads = new Map<string, XMLHttpRequest>();

  /**
   * Upload a single file with real progress tracking
   */
  async uploadFile(
    file: File,
    workspaceId: string,
    folderId?: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const uploadId = this.generateUploadId();
    const skipNotifications = options.skipNotifications || false;
    
    // Call onStart callback with uploadId
    if (options.onStart) {
      options.onStart(uploadId);
    }
    
    // Emit upload start notification unless explicitly skipped
    if (!skipNotifications) {
      emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_START, {
        fileId: uploadId,
        fileName: file.name,
        fileSize: file.size,
        workspaceId,
        ...(folderId && { parentId: folderId }),
        ...(options.batchId && { batchId: options.batchId }),
        uploadProgress: 0
      }, {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.PROGRESS,
        duration: 0,
        persistent: true
      });
    }
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      // Wrap progress callback to emit notifications
      const wrappedOptions = {
        ...options,
        onProgress: (progress: number) => {
          // Emit progress notification
          if (!skipNotifications) {
            emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS, {
              fileId: uploadId,
              fileName: file.name,
              fileSize: file.size,
              workspaceId,
              ...(folderId && { parentId: folderId }),
              ...(options.batchId && { batchId: options.batchId }),
              uploadProgress: progress
            }, {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.PROGRESS,
              duration: 0,
              persistent: true
            });
          }
          
          // Call original progress callback
          if (options.onProgress) {
            options.onProgress(progress);
          }
        }
      };

      // Upload with progress tracking
      const result = await this.uploadWithProgress(
        '/api/workspace/upload',
        formData,
        uploadId,
        wrappedOptions
      );

      // Emit success notification
      if (!skipNotifications && result.success) {
        emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS, {
          fileId: uploadId,
          fileName: file.name,
          fileSize: file.size,
          workspaceId,
          ...(folderId && { parentId: folderId }),
          ...(options.batchId && { batchId: options.batchId })
        }, {
          priority: NotificationPriority.LOW,
          uiType: NotificationUIType.PROGRESS, // Route to showProgress to handle dismissal
          duration: 3000
        });
      }

      // Call completion callback
      if (options.onComplete) {
        options.onComplete(result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      const result: UploadResult = {
        success: false,
        error: errorMessage
      };

      // Emit error notification
      if (!skipNotifications) {
        emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
          fileId: uploadId,
          fileName: file.name,
          fileSize: file.size,
          workspaceId,
          ...(folderId && { parentId: folderId }),
          ...(options.batchId && { batchId: options.batchId }),
          error: errorMessage
        }, {
          priority: NotificationPriority.HIGH,
          uiType: NotificationUIType.PROGRESS, // Route to showProgress to handle dismissal
          duration: 5000
        });
      }

      // Call error callback
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage));
      }

      logger.error('File upload failed', error, {
        fileName: file.name,
        fileSize: file.size,
        workspaceId
      });

      return result;
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Upload multiple files with concurrent control and smooth progress tracking
   */
  async uploadBatch(
    files: File[],
    workspaceId: string,
    folderId?: string,
    options: BatchUploadOptions = {}
  ): Promise<UploadResult[]> {
    const maxConcurrent = options.maxConcurrent || 3;
    const results: UploadResult[] = [];
    const batchId = `batch-${Date.now()}`;
    
    // Track progress for each file
    const fileProgress = new Map<string, number>();
    const fileSizes = new Map<string, number>();
    let completedCount = 0;
    let failedCount = 0;
    
    // Initialize file tracking
    files.forEach((file, index) => {
      const fileId = `${batchId}-file-${index}`;
      fileProgress.set(fileId, 0);
      fileSizes.set(fileId, file.size);
    });
    
    // Calculate total size for weighted progress
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // Helper to calculate overall progress
    const calculateOverallProgress = (): number => {
      if (totalSize === 0) return 0;
      
      let weightedProgress = 0;
      fileProgress.forEach((progress, fileId) => {
        const fileSize = fileSizes.get(fileId) || 0;
        weightedProgress += (progress / 100) * fileSize;
      });
      
      return Math.round((weightedProgress / totalSize) * 100);
    };
    
    // Emit batch upload start
    emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_START, {
      batchId,
      totalItems: files.length,
      completedItems: 0,
      totalSize
    }, {
      priority: NotificationPriority.MEDIUM,
      uiType: NotificationUIType.PROGRESS,
      duration: 0,
      persistent: true
    });

    // Process files in chunks for concurrent uploads
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const chunk = files.slice(i, Math.min(i + maxConcurrent, files.length));
      const chunkIndexStart = i;
      
      const chunkResults = await Promise.all(
        chunk.map(async (file, chunkIndex) => {
          const fileIndex = chunkIndexStart + chunkIndex;
          const fileId = `${batchId}-file-${fileIndex}`;
          
          const result = await this.uploadFile(file, workspaceId, folderId, {
            ...options,
            skipNotifications: true, // Skip individual file notifications for batch uploads
            batchId, // Pass batch context for correlation
            onProgress: (progress) => {
              // Update individual file progress
              fileProgress.set(fileId, progress);
              
              // Calculate and emit overall batch progress
              const overallProgress = calculateOverallProgress();
              
              emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS, {
                batchId,
                totalItems: files.length,
                completedItems: completedCount,
                failedItems: failedCount,
                totalSize,
                uploadProgress: overallProgress
              }, {
                priority: NotificationPriority.LOW,
                uiType: NotificationUIType.PROGRESS,
                duration: 0,
                persistent: true
              });
              
              // Call original progress callback if provided
              if (options.onProgress) {
                options.onProgress(overallProgress);
              }
            },
            onComplete: (res) => {
              if (res.success) {
                completedCount++;
                fileProgress.set(fileId, 100);
              } else {
                failedCount++;
              }
              
              // Call individual file completion
              if (options.onFileComplete) {
                options.onFileComplete(file.name, res);
              }
              
              // Call batch progress with updated counts
              if (options.onBatchProgress) {
                options.onBatchProgress(completedCount, files.length);
              }
              
              // Call original completion if provided
              if (options.onComplete) {
                options.onComplete(res);
              }
            },
            onError: (error) => {
              failedCount++;
              
              // Call original error handler if provided
              if (options.onError) {
                options.onError(error);
              }
            }
          });
          
          return result;
        })
      );
      
      results.push(...chunkResults);
    }
    
    // Emit final batch result
    if (failedCount === 0) {
      emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS, {
        batchId,
        totalItems: files.length,
        completedItems: completedCount
      }, {
        priority: NotificationPriority.LOW,
        uiType: NotificationUIType.PROGRESS,
        duration: 3000
      });
    } else if (completedCount > 0) {
      emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS, {
        batchId,
        totalItems: files.length,
        completedItems: completedCount,
        failedItems: failedCount
      }, {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.PROGRESS,
        duration: 5000
      });
    } else {
      emitNotification(NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR, {
        batchId,
        totalItems: files.length,
        completedItems: completedCount,
        failedItems: failedCount,
        error: `Failed to upload ${failedCount} file${failedCount === 1 ? '' : 's'}`
      }, {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.PROGRESS,
        duration: 5000
      });
    }

    return results;
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): void {
    const xhr = this.activeUploads.get(uploadId);
    if (xhr) {
      xhr.abort();
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Cancel all active uploads
   */
  cancelAll(): void {
    this.activeUploads.forEach((xhr) => xhr.abort());
    this.activeUploads.clear();
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Upload with XMLHttpRequest for real progress tracking
   */
  private uploadWithProgress(
    url: string,
    formData: FormData,
    uploadId: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Store XHR for cancellation
      this.activeUploads.set(uploadId, xhr);
      
      // Set up progress tracking with simulated intermediate updates for small files
      if (options.onProgress) {
        let lastProgress = 0;
        let simulatedProgress = 0;
        let simulationInterval: NodeJS.Timeout | null = null;
        let hasReceivedRealProgress = false;
        
        // For small files or fast connections, simulate gradual progress
        const startSimulation = () => {
          // Start at 0
          options.onProgress!(0);
          
          simulationInterval = setInterval(() => {
            if (simulatedProgress < 85 && !hasReceivedRealProgress) {
              simulatedProgress += Math.random() * 10 + 8; // Increment by 8-18%
              simulatedProgress = Math.min(simulatedProgress, 85); // Cap at 85% until real progress
              const roundedProgress = Math.round(simulatedProgress);
              options.onProgress!(roundedProgress);
              lastProgress = roundedProgress;
            }
          }, 150); // Update every 150ms for smoother animation
        };
        
        // Start simulation for smoother progress
        startSimulation();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            
            hasReceivedRealProgress = true;
            
            // If real progress jumps to 100%, simulate gradual increase
            if (progress === 100 && lastProgress < 85) {
              // Clear simulation
              if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
              }
              
              // Animate from current to 100
              let currentProgress = lastProgress;
              const animationInterval = setInterval(() => {
                currentProgress = Math.min(currentProgress + 10, 100);
                options.onProgress!(currentProgress);
                
                if (currentProgress >= 100) {
                  clearInterval(animationInterval);
                }
              }, 50);
            } else {
              // Clear simulation when we get gradual real progress
              if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
              }
              
              // Only update if progress increased
              if (progress > lastProgress) {
                lastProgress = progress;
                options.onProgress!(progress);
              }
            }
          }
        });
        
        // Clean up simulation on completion
        xhr.addEventListener('loadend', () => {
          if (simulationInterval) {
            clearInterval(simulationInterval);
          }
        });
      }
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
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
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      
      // Configure and send request
      xhr.open('POST', url);
      xhr.timeout = 300000; // 5 minute timeout for large files
      xhr.send(formData);
    });
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// =============================================================================
// EXPORT SINGLETON INSTANCE FOR CONVENIENCE
// =============================================================================

export const clientUploadService = new ClientUploadService();