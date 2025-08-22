/**
 * Upload Progress Tracking Utilities
 * Manages upload progress and metrics collection
 */

import type { UploadHandle, UploadMetrics, UploadStatistics } from '../types';
import { eventBus, emitNotification } from '@/features/notifications/core';
import { NotificationEventType } from '@/features/notifications/core/event-types';
import { isWorkspaceContext, isLinkContext } from '../types';

/**
 * Progress Tracker Class
 * Manages progress tracking for active uploads
 */
export class ProgressTracker {
  private metrics: Map<string, UploadMetrics> = new Map();
  private progressCache: Map<string, number> = new Map();

  /**
   * Update upload progress
   */
  updateProgress(
    handle: UploadHandle,
    progress: number,
    loaded: number,
    total: number
  ): void {
    handle.progress = progress;
    this.progressCache.set(handle.id, progress);
    
    // Emit appropriate event based on context
    if (isWorkspaceContext(handle.context)) {
      emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS,
        {
          fileId: handle.id,
          fileName: handle.file.name,
          uploadProgress: progress,
          fileSize: total,
        }
      );
    } else if (isLinkContext(handle.context)) {
      // Link uploads typically use batch events
      eventBus.emit(`upload.progress.${handle.id}`, {
        uploadId: handle.id,
        fileName: handle.file.name,
        progress,
        loaded,
        total,
      });
    }
  }

  /**
   * Get current progress for an upload
   */
  getProgress(uploadId: string): number {
    return this.progressCache.get(uploadId) || 0;
  }

  /**
   * Record upload metrics
   */
  recordMetrics(handle: UploadHandle): void {
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
   * Get upload statistics
   */
  getStatistics(uploads: Map<string, UploadHandle>): UploadStatistics {
    const allUploads = Array.from(uploads.values());
    const completedMetrics = Array.from(this.metrics.values())
      .filter(m => m.status === 'success');
    
    const totalDuration = completedMetrics.reduce((sum, m) => sum + m.duration, 0);
    const totalSpeed = completedMetrics.reduce((sum, m) => sum + m.averageSpeed, 0);
    
    return {
      totalUploads: allUploads.length,
      successCount: allUploads.filter(u => u.status === 'success').length,
      failureCount: allUploads.filter(u => u.status === 'error').length,
      cancelledCount: allUploads.filter(u => u.status === 'cancelled').length,
      totalBytes: allUploads.reduce((sum, u) => sum + u.file.size, 0),
      averageDuration: completedMetrics.length > 0 
        ? totalDuration / completedMetrics.length 
        : 0,
      averageSpeed: completedMetrics.length > 0 
        ? totalSpeed / completedMetrics.length 
        : 0,
      activeUploads: allUploads.filter(u => 
        u.status === 'pending' || u.status === 'uploading' || u.status === 'processing'
      ).length,
    };
  }

  /**
   * Calculate upload speed
   */
  calculateSpeed(handle: UploadHandle, loaded: number): number {
    const duration = (Date.now() - handle.startTime) / 1000; // seconds
    return duration > 0 ? loaded / duration : 0;
  }

  /**
   * Calculate remaining time
   */
  calculateRemainingTime(
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
   * Clear metrics for completed uploads
   */
  clearCompleted(uploadIds: string[]): void {
    uploadIds.forEach(id => {
      this.metrics.delete(id);
      this.progressCache.delete(id);
    });
  }

  /**
   * Clear all metrics
   */
  clearAll(): void {
    this.metrics.clear();
    this.progressCache.clear();
  }

  /**
   * Export metrics for analytics
   */
  exportMetrics(): UploadMetrics[] {
    return Array.from(this.metrics.values());
  }
}