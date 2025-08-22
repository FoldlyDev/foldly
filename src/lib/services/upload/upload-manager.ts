/**
 * Unified Upload Manager
 * Lightweight coordinator for file uploads across the application
 */

import { emitNotification } from '@/features/notifications/core';
import { NotificationEventType } from '@/features/notifications/core/event-types';
import type {
  UploadContext,
  UploadHandle,
  UploadOptions,
  UploadResult,
  UploadStatus,
  UploadStatistics,
} from './types';
import { isWorkspaceContext, isLinkContext, UploadError } from './types';
import { logger } from '@/lib/services/logging/logger';

// Import modular components
import { WorkspaceUploadHandler } from './handlers/workspace-handler';
import { LinkUploadHandler } from './handlers/link-handler';
import { validateFile } from './utils/validation';
import { ProgressTracker } from './utils/progress-tracker';
import { RetryManager, ErrorClassifier } from './utils/retry-logic';

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
  private config = DEFAULT_CONFIG;

  // Modular components
  private progressTracker: ProgressTracker;
  private retryManager: RetryManager;
  private workspaceHandler: WorkspaceUploadHandler;
  private linkHandler: LinkUploadHandler;

  private constructor() {
    this.progressTracker = new ProgressTracker();
    this.retryManager = new RetryManager({
      maxRetries: this.config.maxRetries,
      retryDelays: this.config.retryDelays,
    });
    this.workspaceHandler = new WorkspaceUploadHandler();
    this.linkHandler = new LinkUploadHandler();
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
    const validationOptions: any = {
      maxFileSize: options.maxFileSize || this.config.maxFileSize,
    };
    if (options.allowedTypes) {
      validationOptions.allowedTypes = options.allowedTypes;
    }
    if (options.blockedTypes) {
      validationOptions.blockedTypes = options.blockedTypes;
    }
    const validation = await validateFile(file, context, validationOptions);

    if (!validation.valid) {
      const primaryError = validation.errors[0];
      if (primaryError) {
        throw new UploadError(
          primaryError.message,
          primaryError.code,
          uploadId,
          primaryError.details
        );
      } else {
        throw new UploadError(
          'Validation failed',
          'VALIDATION_ERROR',
          uploadId
        );
      }
    }

    // Log warnings if any
    validation.warnings.forEach(warning => {
      logger.warn('Upload validation warning', {
        uploadId,
        code: warning.code,
        message: warning.message,
      });
    });

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
    this.emitCancellationEvent(handle);

    logger.info('Upload cancelled', { uploadId });
  }

  /**
   * Get current progress for an upload
   */
  public getProgress(uploadId: string): number {
    return this.progressTracker.getProgress(uploadId);
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
    return this.progressTracker.getStatistics(this.uploads);
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
      
      // Route to appropriate handler
      let result: UploadResult;
      
      if (isWorkspaceContext(handle.context)) {
        result = await this.workspaceHandler.process(handle, options);
      } else if (isLinkContext(handle.context)) {
        result = await this.linkHandler.process(handle, options);
      } else {
        throw new Error('Invalid upload context');
      }
      
      // Handle result
      if (result.success) {
        this.handleUploadSuccess(handle, result, options);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      // Check if we should retry
      if (this.retryManager.shouldRetry(handle, error)) {
        await this.retryManager.executeRetry(handle, () => 
          this.processUpload(handle, options)
        );
      } else {
        this.handleUploadError(handle, error);
      }
    } finally {
      // Clean up active upload
      this.activeUploads.delete(handle.id);
    }
  }

  /**
   * Update upload status
   */
  private updateUploadStatus(handle: UploadHandle, status: UploadStatus): void {
    const previousStatus = handle.status;
    handle.status = status;
    
    if (this.config.enableLogging) {
      logger.debug('Upload status changed', {
        uploadId: handle.id,
        previousStatus,
        newStatus: status,
      });
    }
  }

  /**
   * Handle successful upload
   */
  private handleUploadSuccess(
    handle: UploadHandle, 
    result: UploadResult,
    options: UploadOptions
  ): void {
    handle.status = 'success';
    handle.endTime = Date.now();
    handle.result = result;
    
    // Record metrics
    this.progressTracker.recordMetrics(handle);
    
    // Emit success event based on context
    if (isWorkspaceContext(handle.context)) {
      emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS,
        {
          fileId: result.fileId || handle.id,
          fileName: handle.file.name,
          fileSize: handle.file.size,
        }
      );
    } else if (isLinkContext(handle.context)) {
      emitNotification(
        NotificationEventType.LINK_NEW_UPLOAD,
        {
          fileName: handle.file.name,
          fileSize: handle.file.size,
        } as any
      );
    }

    // Call user callback if provided
    if (options.onComplete) {
      options.onComplete(result);
    }
    
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
    
    // Categorize error
    const errorCategory = ErrorClassifier.categorizeError(error);
    
    // Emit error event based on context
    if (isWorkspaceContext(handle.context)) {
      emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
        {
          fileId: handle.id,
          fileName: handle.file.name,
          error: handle.error || 'Unknown error',
        }
      );
    } else if (isLinkContext(handle.context)) {
      // Link uploads might have different error handling
      emitNotification(
        NotificationEventType.LINK_BATCH_UPLOAD,
        {
          status: 'failed',
          error: handle.error,
        } as any
      );
    }
    
    logger.error('Upload failed', error, {
      uploadId: handle.id,
      retryCount: handle.retryCount,
      errorCategory,
    });
  }

  /**
   * Emit upload start event
   */
  private emitUploadStart(handle: UploadHandle): void {
    if (isWorkspaceContext(handle.context)) {
      emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_START,
        {
          fileId: handle.id,
          fileName: handle.file.name,
          fileSize: handle.file.size,
        }
      );
    } else if (isLinkContext(handle.context)) {
      emitNotification(
        NotificationEventType.LINK_BATCH_UPLOAD,
        {
          status: 'started',
          totalFiles: 1,
        } as any
      );
    }
  }

  /**
   * Emit cancellation event
   */
  private emitCancellationEvent(handle: UploadHandle): void {
    const errorMessage = 'Upload cancelled by user';
    
    if (isWorkspaceContext(handle.context)) {
      emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
        {
          fileId: handle.id,
          fileName: handle.file.name,
          error: errorMessage,
        }
      );
    } else if (isLinkContext(handle.context)) {
      emitNotification(
        NotificationEventType.LINK_BATCH_UPLOAD,
        {
          status: 'cancelled',
          error: errorMessage,
        } as any
      );
    }
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
    
    const completedIds = completed.map(([id]) => id);
    
    // Clear from maps
    completedIds.forEach(id => {
      this.uploads.delete(id);
    });
    
    // Clear from progress tracker
    this.progressTracker.clearCompleted(completedIds);
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
      UploadManager.instance.progressTracker.clearAll();
      
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