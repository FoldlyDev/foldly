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
import { UPLOAD_CONFIG, shouldUseChunkedUpload, getRetryDelay } from '@/lib/config/upload-config';
import type { PlanKey } from '@/lib/config/plan-configuration';
import { getCurrentPlan } from '@/features/billing/lib/services/clerk-billing-integration';

// Import modular components
import { WorkspaceUploadHandler } from './handlers/workspace-handler';
import { LinkUploadHandler } from './handlers/link-handler';
import { validateFile } from './utils/validation';
import { ProgressTracker } from './utils/progress-tracker';
import { RetryManager, ErrorClassifier } from './utils/retry-logic';
import { chunkedUploadManager } from './utils/chunked-upload';

// =============================================================================
// UPLOAD MANAGER IMPLEMENTATION
// =============================================================================

export class UploadManager {
  private static instance: UploadManager | null = null;
  private uploads: Map<string, UploadHandle> = new Map();
  private activeUploads: Set<string> = new Set();

  // Modular components
  private progressTracker: ProgressTracker;
  private retryManager: RetryManager;
  private workspaceHandler: WorkspaceUploadHandler;
  private linkHandler: LinkUploadHandler;

  private constructor() {
    this.progressTracker = new ProgressTracker();
    this.retryManager = new RetryManager({
      maxRetries: UPLOAD_CONFIG.retry.maxRetries,
      retryDelays: [...UPLOAD_CONFIG.retry.retryDelays], // Convert readonly to mutable array
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
    if (UPLOAD_CONFIG.debug.enableLogging) {
      logger.info('Upload Manager initialized', { 
        config: {
          maxConcurrentUploads: UPLOAD_CONFIG.concurrency.maxConcurrentUploads,
          chunkedUploads: UPLOAD_CONFIG.features.chunkedUploads,
          resumableUploads: UPLOAD_CONFIG.features.resumableUploads,
        }
      });
    }

    // Listen for page unload to handle cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
      
      // Check for resumable sessions on initialization
      if (UPLOAD_CONFIG.features.resumableUploads) {
        this.checkResumableSessions();
      }
    }
  }
  
  /**
   * Check for resumable upload sessions
   */
  private checkResumableSessions(): void {
    const sessions = chunkedUploadManager.getResumableSessions();
    if (sessions.length > 0) {
      logger.info(`Found ${sessions.length} resumable upload sessions`);
      // Sessions can be resumed through UI or automatically
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
    
    // Check concurrent upload limit
    if (this.activeUploads.size >= UPLOAD_CONFIG.concurrency.maxConcurrentUploads) {
      throw new UploadError(
        'Maximum concurrent uploads reached. Please wait for current uploads to complete.',
        'CONCURRENT_LIMIT_EXCEEDED',
        uploadId
      );
    }
    
    // Determine user's plan for file size validation
    let planKey: PlanKey = 'free';
    
    // For workspace uploads, get the user's actual plan from Clerk
    if (isWorkspaceContext(context)) {
      try {
        planKey = await getCurrentPlan();
        logger.debug('User plan determined for upload', { uploadId, planKey });
      } catch (error) {
        logger.warn('Failed to get user plan, defaulting to free', { uploadId, error });
        planKey = 'free';
      }
    }
    // For link uploads, always use free plan limits
    // (external uploaders don't have subscriptions)
    
    // Validate before starting
    const validationOptions: any = {
      maxFileSize: options.maxFileSize || UPLOAD_CONFIG.limits.getMaxFileSize(planKey),
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
      maxRetries: options.maxRetries || UPLOAD_CONFIG.retry.maxRetries,
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
  
  /**
   * Resume a chunked upload session
   */
  public async resumeUpload(
    sessionId: string,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    if (!UPLOAD_CONFIG.features.resumableUploads) {
      return {
        success: false,
        error: 'Resumable uploads are not enabled in this environment',
      };
    }
    
    try {
      logger.info('Attempting to resume upload session', { sessionId });
      
      // Get upload URL (would be determined from session context in production)
      const uploadUrl = '/api/upload/resume';
      
      const result = await chunkedUploadManager.resumeUpload(
        sessionId,
        uploadUrl,
        (progress) => {
          if (options.onProgress) {
            options.onProgress({
              uploadId: sessionId,
              fileName: 'Resuming upload',
              progress,
              loaded: 0,
              total: 0,
            });
          }
        }
      );
      
      if (result.success) {
        logger.info('Successfully resumed upload', { sessionId });
      } else {
        logger.error('Failed to resume upload', { sessionId, error: result.error });
      }
      
      return result;
    } catch (error) {
      logger.error('Error resuming upload', error, { sessionId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resume upload',
      };
    }
  }
  
  /**
   * Get all resumable upload sessions
   */
  public getResumableSessions(): string[] {
    if (!UPLOAD_CONFIG.features.resumableUploads) {
      return [];
    }
    return chunkedUploadManager.getResumableSessions();
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
      
      // Check if we should use chunked upload for large files
      if (shouldUseChunkedUpload(handle.file.size)) {
        // Use chunked upload for large files (production only)
        await this.processChunkedUpload(handle, options);
        return;
      }
      
      // Route to appropriate handler for regular uploads
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
   * Process chunked upload for large files
   */
  private async processChunkedUpload(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<void> {
    logger.info('Processing chunked upload', {
      uploadId: handle.id,
      fileName: handle.file.name,
      fileSize: handle.file.size,
    });
    
    // Generate upload URL based on context
    const uploadUrl = this.getUploadUrl(handle.context);
    
    // Use chunked upload manager
    const result = await chunkedUploadManager.uploadInChunks(
      handle,
      uploadUrl,
      options,
      (progress) => {
        handle.progress = progress;
        this.progressTracker.updateProgress(handle, progress, 
          (handle.file.size * progress) / 100, handle.file.size);
        
        if (options.onProgress) {
          options.onProgress({
            uploadId: handle.id,
            fileName: handle.file.name,
            progress,
            loaded: (handle.file.size * progress) / 100,
            total: handle.file.size,
          });
        }
      }
    );
    
    if (result.success) {
      this.handleUploadSuccess(handle, {
        success: true,
        fileId: handle.id,
        fileName: handle.file.name,
        fileSize: handle.file.size,
      }, options);
    } else {
      throw new Error(result.error || 'Chunked upload failed');
    }
  }
  
  /**
   * Get upload URL based on context
   */
  private getUploadUrl(context: UploadContext): string {
    // In production, this would return the actual upload endpoint
    // For now, return a placeholder
    if (isWorkspaceContext(context)) {
      return '/api/upload/workspace';
    } else if (isLinkContext(context)) {
      return '/api/upload/link';
    }
    return '/api/upload';
  }

  /**
   * Update upload status
   */
  private updateUploadStatus(handle: UploadHandle, status: UploadStatus): void {
    const previousStatus = handle.status;
    handle.status = status;
    
    if (UPLOAD_CONFIG.debug.enableLogging) {
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