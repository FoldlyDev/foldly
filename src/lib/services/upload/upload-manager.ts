/**
 * Unified Upload Manager
 * Lightweight coordinator for file uploads across the application
 */

import { eventBus, emitNotification } from '@/features/notifications/core';
import { NotificationEventType } from '@/features/notifications/core/event-types';
import type {
  UploadContext,
  UploadHandle,
  UploadOptions,
  UploadResult,
  UploadStatus,
  UploadProgressEvent,
  UploadStateEvent,
  UploadMetrics,
  UploadStatistics,
  WorkspaceUploadContext,
  LinkUploadContext,
} from './types';
import { isWorkspaceContext, isLinkContext, UploadError, UploadErrorCode } from './types';
import { logger } from '@/lib/services/logging/logger';

// =============================================================================
// UPLOAD MANAGER CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  maxConcurrentUploads: 3,
  defaultTimeout: 300000, // 5 minutes
  maxRetries: 3,
  retryDelays: [1000, 2000, 5000], // Exponential backoff
  maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
  enableLogging: process.env.NODE_ENV === 'development',
  enableAnalytics: true,
};

// =============================================================================
// UPLOAD MANAGER IMPLEMENTATION
// =============================================================================

export class UploadManager {
  private static instance: UploadManager | null = null;
  private uploads: Map<string, UploadHandle> = new Map();
  private activeUploads: Set<string> = new Set();
  private metrics: Map<string, UploadMetrics> = new Map();
  private config = DEFAULT_CONFIG;

  private constructor() {
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): UploadManager {
    if (!UploadManager.instance) {
      UploadManager.instance = new UploadManager();
    }
    return UploadManager.instance;
  }

  /**
   * Initialize the upload manager
   */
  private initialize(): void {
    if (this.config.enableLogging) {
      logger.info('Upload Manager initialized', { config: this.config });
    }

    // Listen for page unload to handle cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  /**
   * Upload a file with the given context
   */
  public async upload(
    file: File,
    context: UploadContext,
    options: UploadOptions = {}
  ): Promise<string> {
    const uploadId = this.generateUploadId();
    
    // Validate before starting
    const validation = await this.validateUpload(file, context);
    if (!validation.valid) {
      throw new UploadError(
        validation.error || 'Upload validation failed',
        UploadErrorCode.INVALID_FILE_TYPE,
        uploadId
      );
    }

    // Create upload handle
    const handle: UploadHandle = {
      id: uploadId,
      file,
      context,
      controller: new AbortController(),
      progress: 0,
      status: 'pending',
      startTime: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || this.config.maxRetries,
    };

    // Store handle
    this.uploads.set(uploadId, handle);
    this.activeUploads.add(uploadId);

    // Emit start event
    this.emitUploadStart(handle);

    // Start upload process
    this.processUpload(handle, options).catch(error => {
      logger.error('Upload process failed', error, { uploadId });
      this.handleUploadError(handle, error);
    });

    return uploadId;
  }

  /**
   * Cancel an active upload
   */
  public cancel(uploadId: string): void {
    const handle = this.uploads.get(uploadId);
    if (!handle) {
      logger.warn('Attempted to cancel non-existent upload', { uploadId });
      return;
    }

    // Abort the upload
    handle.controller.abort();
    
    // Update status
    this.updateUploadStatus(handle, 'cancelled');
    
    // Clean up
    this.activeUploads.delete(uploadId);
    
    // Emit cancellation event
    emitNotification(
      NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
      {
        fileId: uploadId,
        fileName: handle.file.name,
        error: 'Upload cancelled by user',
      }
    );

    logger.info('Upload cancelled', { uploadId });
  }

  /**
   * Get current progress for an upload
   */
  public getProgress(uploadId: string): number {
    const handle = this.uploads.get(uploadId);
    return handle?.progress || 0;
  }

  /**
   * Get upload status
   */
  public getStatus(uploadId: string): UploadStatus | null {
    const handle = this.uploads.get(uploadId);
    return handle?.status || null;
  }

  /**
   * Retry a failed upload
   */
  public async retry(uploadId: string): Promise<void> {
    const handle = this.uploads.get(uploadId);
    if (!handle || handle.status !== 'error') {
      throw new Error('Cannot retry upload: invalid state');
    }

    // Reset for retry
    handle.status = 'pending';
    handle.progress = 0;
    handle.controller = new AbortController();
    delete handle.error;
    
    // Add back to active uploads
    this.activeUploads.add(uploadId);
    
    // Process again
    await this.processUpload(handle, {});
  }

  /**
   * Get all active uploads
   */
  public getActiveUploads(): UploadHandle[] {
    return Array.from(this.activeUploads)
      .map(id => this.uploads.get(id))
      .filter((handle): handle is UploadHandle => handle !== undefined);
  }

  /**
   * Get upload statistics
   */
  public getStatistics(): UploadStatistics {
    const allUploads = Array.from(this.uploads.values());
    
    return {
      totalUploads: allUploads.length,
      successCount: allUploads.filter(u => u.status === 'success').length,
      failureCount: allUploads.filter(u => u.status === 'error').length,
      cancelledCount: allUploads.filter(u => u.status === 'cancelled').length,
      totalBytes: allUploads.reduce((sum, u) => sum + u.file.size, 0),
      averageDuration: this.calculateAverageDuration(),
      averageSpeed: this.calculateAverageSpeed(),
      activeUploads: this.activeUploads.size,
    };
  }

  // =============================================================================
  // PRIVATE METHODS - UPLOAD PROCESSING
  // =============================================================================

  /**
   * Process the upload based on context
   */
  private async processUpload(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<void> {
    try {
      // Update status
      this.updateUploadStatus(handle, 'uploading');
      
      // Route based on context
      let result: UploadResult;
      
      if (isWorkspaceContext(handle.context)) {
        result = await this.uploadToWorkspace(handle, handle.context, options);
      } else if (isLinkContext(handle.context)) {
        result = await this.uploadToLink(handle, handle.context, options);
      } else {
        throw new Error('Invalid upload context');
      }
      
      // Handle result
      if (result.success) {
        this.handleUploadSuccess(handle, result);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      // Handle retry logic
      if (this.shouldRetry(handle, error)) {
        await this.retryUpload(handle, options);
      } else {
        this.handleUploadError(handle, error);
      }
    } finally {
      // Clean up active upload
      this.activeUploads.delete(handle.id);
    }
  }

  /**
   * Upload to workspace context
   */
  private async uploadToWorkspace(
    handle: UploadHandle,
    context: WorkspaceUploadContext,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Create form data
    const formData = new FormData();
    formData.append('file', handle.file);
    formData.append('workspaceId', context.workspaceId);
    if (context.folderId) {
      formData.append('folderId', context.folderId);
    }

    // Upload with progress tracking
    return this.performUpload(
      '/api/workspace/upload',
      formData,
      handle,
      options
    );
  }

  /**
   * Upload to link context
   */
  private async uploadToLink(
    handle: UploadHandle,
    context: LinkUploadContext,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Create form data - using context for all fields
    const formData = new FormData();
    formData.append('file', handle.file);
    formData.append('linkId', context.linkId);
    formData.append('uploaderName', context.uploaderName);
    
    if (context.uploaderEmail) {
      formData.append('uploaderEmail', context.uploaderEmail);
    }
    if (context.message) {
      formData.append('message', context.message);
    }
    if (context.password) {
      formData.append('password', context.password);
    }
    if (context.folderId) {
      formData.append('folderId', context.folderId);
    }

    // Upload with progress tracking
    return this.performUpload(
      '/api/link/upload',
      formData,
      handle,
      options
    );
  }

  /**
   * Perform the actual upload with XMLHttpRequest for progress tracking
   */
  private performUpload(
    url: string,
    formData: FormData,
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      handle.xhr = xhr;

      // Progress event
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          this.updateUploadProgress(handle, progress, event.loaded, event.total);
          
          // Call user callback if provided
          if (options.onProgress) {
            const progressEvent: UploadProgressEvent = {
              uploadId: handle.id,
              fileName: handle.file.name,
              progress,
              loaded: event.loaded,
              total: event.total,
              speed: this.calculateSpeed(handle, event.loaded),
              remainingTime: this.calculateRemainingTime(handle, event.loaded, event.total),
            };
            options.onProgress(progressEvent);
          }
        }
      });

      // Load event (success)
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Error event
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      // Abort event
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Timeout event
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      // Configure request
      xhr.open('POST', url);
      xhr.timeout = options.timeout || this.config.defaultTimeout;
      
      // Add abort signal
      handle.controller.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      // Send request
      xhr.send(formData);
    });
  }

  // =============================================================================
  // PRIVATE METHODS - HELPERS
  // =============================================================================

  /**
   * Validate upload before starting
   */
  private async validateUpload(
    file: File,
    _context: UploadContext
  ): Promise<{ valid: boolean; error?: string }> {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed (${this.formatSize(this.config.maxFileSize)})`,
      };
    }

    // Additional validation can be added here based on context
    // - File type validation
    // - Quota checking (using _context when needed)
    // - Permission validation

    return { valid: true };
  }

  /**
   * Check if upload should be retried
   */
  private shouldRetry(handle: UploadHandle, error: any): boolean {
    if (handle.retryCount >= handle.maxRetries) {
      return false;
    }

    // Check if error is retryable
    const retryableErrors = [
      'Network error',
      'Upload timeout',
      'status 502',
      'status 503',
      'status 504',
    ];

    const errorMessage = error?.message || '';
    return retryableErrors.some(e => errorMessage.includes(e));
  }

  /**
   * Retry upload with exponential backoff
   */
  private async retryUpload(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<void> {
    handle.retryCount++;
    
    const delay = this.config.retryDelays[handle.retryCount - 1] || 5000;
    
    logger.info('Retrying upload', {
      uploadId: handle.id,
      retryCount: handle.retryCount,
      delay,
    });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reset controller
    handle.controller = new AbortController();
    
    // Try again
    await this.processUpload(handle, options);
  }

  /**
   * Update upload status
   */
  private updateUploadStatus(handle: UploadHandle, status: UploadStatus): void {
    const previousStatus = handle.status;
    handle.status = status;
    
    // Emit state change event
    const event: UploadStateEvent = {
      uploadId: handle.id,
      previousStatus,
      newStatus: status,
    };
    
    eventBus.emit(`upload.status.${handle.id}`, event);
  }

  /**
   * Update upload progress
   */
  private updateUploadProgress(
    handle: UploadHandle,
    progress: number,
    _loaded: number,
    total: number
  ): void {
    handle.progress = progress;
    
    // Emit progress event via notification system
    emitNotification(
      NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS,
      {
        fileId: handle.id,
        fileName: handle.file.name,
        uploadProgress: progress,
        fileSize: total,
      }
    );
  }

  /**
   * Handle successful upload
   */
  private handleUploadSuccess(handle: UploadHandle, result: UploadResult): void {
    handle.status = 'success';
    handle.endTime = Date.now();
    handle.result = result;
    
    // Record metrics
    this.recordMetrics(handle);
    
    // Emit success event
    emitNotification(
      NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS,
      {
        fileId: result.fileId || handle.id,
        fileName: handle.file.name,
        fileSize: handle.file.size,
      }
    );
    
    logger.info('Upload completed successfully', {
      uploadId: handle.id,
      duration: handle.endTime - handle.startTime,
    });
  }

  /**
   * Handle upload error
   */
  private handleUploadError(handle: UploadHandle, error: any): void {
    handle.status = 'error';
    handle.endTime = Date.now();
    handle.error = error?.message || 'Unknown error';
    
    // Emit error event
    emitNotification(
      NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
      {
        fileId: handle.id,
        fileName: handle.file.name,
        error: handle.error || 'Unknown error',
      }
    );
    
    logger.error('Upload failed', error, {
      uploadId: handle.id,
      retryCount: handle.retryCount,
    });
  }

  /**
   * Emit upload start event
   */
  private emitUploadStart(handle: UploadHandle): void {
    emitNotification(
      NotificationEventType.WORKSPACE_FILE_UPLOAD_START,
      {
        fileId: handle.id,
        fileName: handle.file.name,
        fileSize: handle.file.size,
      }
    );
  }

  // =============================================================================
  // PRIVATE METHODS - UTILITIES
  // =============================================================================

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Calculate upload speed
   */
  private calculateSpeed(handle: UploadHandle, loaded: number): number {
    const duration = (Date.now() - handle.startTime) / 1000; // seconds
    return duration > 0 ? loaded / duration : 0;
  }

  /**
   * Calculate remaining time
   */
  private calculateRemainingTime(
    handle: UploadHandle,
    loaded: number,
    total: number
  ): number {
    const speed = this.calculateSpeed(handle, loaded);
    if (speed === 0) return 0;
    
    const remaining = total - loaded;
    return remaining / speed;
  }

  /**
   * Record upload metrics
   */
  private recordMetrics(handle: UploadHandle): void {
    if (!this.config.enableAnalytics) return;
    
    const duration = (handle.endTime || Date.now()) - handle.startTime;
    const averageSpeed = handle.file.size / (duration / 1000);
    
    const metrics: UploadMetrics = {
      uploadId: handle.id,
      fileName: handle.file.name,
      fileSize: handle.file.size,
      duration,
      averageSpeed,
      peakSpeed: averageSpeed, // TODO: Track actual peak
      retryCount: handle.retryCount,
      status: handle.status,
      timestamp: Date.now(),
    };
    
    this.metrics.set(handle.id, metrics);
  }

  /**
   * Calculate average upload duration
   */
  private calculateAverageDuration(): number {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.status === 'success');
    
    if (completedMetrics.length === 0) return 0;
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / completedMetrics.length;
  }

  /**
   * Calculate average upload speed
   */
  private calculateAverageSpeed(): number {
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.status === 'success');
    
    if (completedMetrics.length === 0) return 0;
    
    const totalSpeed = completedMetrics.reduce((sum, m) => sum + m.averageSpeed, 0);
    return totalSpeed / completedMetrics.length;
  }

  /**
   * Format file size for display
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Handle page unload - cancel active uploads
   */
  private handlePageUnload(): void {
    // Cancel all active uploads
    this.activeUploads.forEach(uploadId => {
      this.cancel(uploadId);
    });
  }

  /**
   * Clear completed uploads (cleanup)
   */
  public clearCompleted(): void {
    const completed = Array.from(this.uploads.entries())
      .filter(([_, handle]) => 
        handle.status === 'success' || 
        handle.status === 'error' || 
        handle.status === 'cancelled'
      );
    
    completed.forEach(([id]) => {
      this.uploads.delete(id);
      this.metrics.delete(id);
    });
  }

  /**
   * Destroy the upload manager (for testing)
   */
  public static destroy(): void {
    if (UploadManager.instance) {
      // Cancel all active uploads
      UploadManager.instance.activeUploads.forEach(id => {
        UploadManager.instance?.cancel(id);
      });
      
      // Clear all data
      UploadManager.instance.uploads.clear();
      UploadManager.instance.activeUploads.clear();
      UploadManager.instance.metrics.clear();
      
      // Remove instance
      UploadManager.instance = null;
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Get the singleton upload manager instance
 */
export const uploadManager = UploadManager.getInstance();

/**
 * Convenience function to upload a file
 */
export async function uploadFile(
  file: File,
  context: UploadContext,
  options?: UploadOptions
): Promise<string> {
  return uploadManager.upload(file, context, options);
}

/**
 * Convenience function to cancel an upload
 */
export function cancelUpload(uploadId: string): void {
  uploadManager.cancel(uploadId);
}