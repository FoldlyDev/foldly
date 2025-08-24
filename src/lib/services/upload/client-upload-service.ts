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

// =============================================================================
// TYPES
// =============================================================================

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
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
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('workspaceId', workspaceId);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      // Upload with progress tracking
      const result = await this.uploadWithProgress(
        '/api/workspace/upload',
        formData,
        uploadId,
        options
      );

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
   * Upload multiple files with concurrent control
   */
  async uploadBatch(
    files: File[],
    workspaceId: string,
    folderId?: string,
    options: BatchUploadOptions = {}
  ): Promise<UploadResult[]> {
    const maxConcurrent = options.maxConcurrent || 3;
    const results: UploadResult[] = [];
    let completed = 0;

    // Process files in chunks for concurrent uploads
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const chunk = files.slice(i, Math.min(i + maxConcurrent, files.length));
      
      const chunkResults = await Promise.all(
        chunk.map(async (file) => {
          const result = await this.uploadFile(file, workspaceId, folderId, {
            ...options,
            onComplete: (res) => {
              completed++;
              
              // Call individual file completion
              if (options.onFileComplete) {
                options.onFileComplete(file.name, res);
              }
              
              // Call batch progress
              if (options.onBatchProgress) {
                options.onBatchProgress(completed, files.length);
              }
              
              // Call original completion if provided
              if (options.onComplete) {
                options.onComplete(res);
              }
            }
          });
          
          return result;
        })
      );
      
      results.push(...chunkResults);
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
      
      // Set up progress tracking
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            options.onProgress!(progress);
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