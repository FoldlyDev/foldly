/**
 * Base Upload Handler
 * Shared functionality for all upload contexts
 */

import type { UploadHandle, UploadResult, UploadOptions } from '../types';
import { logger } from '@/lib/services/logging/logger';

export abstract class BaseUploadHandler {
  /**
   * Process the upload for a specific context
   */
  abstract process(
    handle: UploadHandle,
    options: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Get the context type this handler supports
   */
  abstract get contextType(): string;

  /**
   * Log upload start
   */
  protected logStart(handle: UploadHandle): void {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Upload started for ${this.contextType}`, {
        uploadId: handle.id,
        fileName: handle.file.name,
        fileSize: handle.file.size,
        context: handle.context,
      });
    }
  }

  /**
   * Log upload completion
   */
  protected logComplete(handle: UploadHandle, result: UploadResult): void {
    if (process.env.NODE_ENV === 'development') {
      const duration = (handle.endTime || Date.now()) - handle.startTime;
      logger.info(`Upload completed for ${this.contextType}`, {
        uploadId: handle.id,
        duration,
        success: result.success,
      });
    }
  }

  /**
   * Log upload error
   */
  protected logError(handle: UploadHandle, error: any): void {
    logger.error(`Upload failed for ${this.contextType}`, error, {
      uploadId: handle.id,
      fileName: handle.file.name,
      retryCount: handle.retryCount,
    });
  }

  /**
   * Format file size for display
   */
  protected formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}