/**
 * Notification Manager
 * Handles routing, deduplication, and presentation of notifications
 */

import { toast } from 'sonner';
import { showFileUploadProgress } from '../utils/upload-notifications';
import {
  NotificationEventType,
  NotificationPriority,
  NotificationUIType,
  NotificationChannel,
  isErrorEvent,
  isSuccessEvent,
  isProgressEvent,
} from './event-types';
import type { NotificationEvent } from './event-types';
import { eventBus } from './event-bus';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';
import { playGeneralNotificationSound, playWarningNotificationSound } from '@/lib/utils/notification-sound';

// =============================================================================
// NOTIFICATION MANAGER TYPES
// =============================================================================

/**
 * Notification display configuration
 */
interface NotificationDisplay {
  title: string;
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

/**
 * Deduplication entry
 */
interface DeduplicationEntry {
  eventType: NotificationEventType;
  key: string;
  timestamp: number;
  count: number;
}


/**
 * Manager configuration
 */
export interface NotificationManagerConfig {
  maxQueueSize: number;
  deduplicationWindow: number; // ms
  defaultDuration: number; // ms
  enableSound: boolean;
  enableAnalytics: boolean;
  batchingDelay: number; // ms
}

// =============================================================================
// NOTIFICATION MANAGER IMPLEMENTATION
// =============================================================================

class NotificationManager {
  private static instance: NotificationManager | null = null;
  private config: NotificationManagerConfig;
  private deduplicationMap: Map<string, DeduplicationEntry> = new Map();
  private activeToasts: Set<string> = new Set();
  private progressToasts: Map<string, string> = new Map(); // Maps event ID to toast ID
  private completedUploads: Set<string> = new Set(); // Track completed uploads to prevent recreation

  private constructor(config?: Partial<NotificationManagerConfig>) {
    this.config = {
      maxQueueSize: 10,
      deduplicationWindow: 2000, // 2 seconds
      defaultDuration: 4000, // 4 seconds
      enableSound: true,
      enableAnalytics: true,
      batchingDelay: 100, // 100ms
      ...config,
    };

    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<NotificationManagerConfig>): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(config);
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize the manager and subscribe to events
   */
  private initialize(): void {
    // Subscribe to all notification events
    eventBus.subscribeAll(this.handleEvent.bind(this));
  }

  /**
   * Handle incoming notification events
   */
  private handleEvent(event: NotificationEvent): void {
    // Check if notifications are enabled
    if (!this.shouldShowNotification(event)) {
      return;
    }

    // Check for deduplication
    if (this.isDuplicate(event)) {
      this.handleDuplicate(event);
      return;
    }

    // Generate display configuration
    const display = this.generateDisplay(event);
    
    // Determine UI type
    const uiType = this.determineUIType(event);

    // Route to appropriate handler
    this.routeNotification(event, display, uiType);
  }

  /**
   * Check if notification should be shown
   */
  private shouldShowNotification(event: NotificationEvent): boolean {
    // Check DND mode
    const { doNotDisturb } = useUserSettingsStore.getState();
    if (doNotDisturb) {
      return false;
    }

    // Check event configuration
    if (event.config?.channels) {
      const internalConfig = event.config.channels[NotificationChannel.INTERNAL];
      if (internalConfig && !internalConfig.enabled) {
        return false;
      }
    }

    // Check priority threshold (could be user preference)
    // For now, show all priorities
    return true;
  }

  /**
   * Check if event is a duplicate
   */
  private isDuplicate(event: NotificationEvent): boolean {
    const key = this.getDeduplicationKey(event);
    const existing = this.deduplicationMap.get(key);

    if (!existing) {
      return false;
    }

    const now = Date.now();
    const timeDiff = now - existing.timestamp;

    // If outside deduplication window, not a duplicate
    if (timeDiff > this.config.deduplicationWindow) {
      this.deduplicationMap.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Handle duplicate notification
   */
  private handleDuplicate(event: NotificationEvent): void {
    const key = this.getDeduplicationKey(event);
    const existing = this.deduplicationMap.get(key)!;
    
    existing.count++;
    existing.timestamp = Date.now();

    // Update existing toast if it's still active
    const toastId = `${event.type}-${key}`;
    if (this.activeToasts.has(toastId)) {
      const display = this.generateDisplay(event);
      toast.dismiss(toastId);
      this.showToast(event, {
        ...display,
        title: `${display.title} (${existing.count}x)`,
      }, toastId);
    }
  }

  /**
   * Get deduplication key for event
   */
  private getDeduplicationKey(event: NotificationEvent): string {
    if (event.config?.deduplicationKey) {
      return event.config.deduplicationKey;
    }

    // Generate key based on event type and key payload fields
    const payload = event.payload as any;
    const keyParts = [event.type];

    // Add relevant payload fields based on event type
    if (payload.fileId) keyParts.push(payload.fileId);
    if (payload.folderId) keyParts.push(payload.folderId);
    if (payload.linkId) keyParts.push(payload.linkId);
    if (payload.batchId) keyParts.push(payload.batchId);

    return keyParts.join('-');
  }

  /**
   * Generate display configuration for event
   */
  private generateDisplay(event: NotificationEvent): NotificationDisplay {
    const isError = isErrorEvent(event.type);
    const isProgress = isProgressEvent(event.type);

    // Base configuration
    const display: NotificationDisplay = {
      title: this.generateTitle(event),
    };

    // Add optional description if available
    const description = this.generateDescription(event);
    if (description) {
      display.description = description;
    }

    // Set duration based on type
    if (isError) {
      display.duration = 6000; // Errors stay longer
    } else if (isProgress) {
      // Progress notifications don't auto-dismiss
    } else {
      display.duration = event.config?.duration || this.config.defaultDuration;
    }

    return display;
  }

  /**
   * Generate title for notification
   */
  private generateTitle(event: NotificationEvent): string {
    const payload = event.payload as any;
    
    // Map of event types to title generators
    const titleMap: Record<string, string> = {
      // File events
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_START]: `Uploading ${payload.fileName || 'file'}`,
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS]: `Uploading ${payload.fileName || 'file'}`,
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS]: 'File uploaded successfully',
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR]: 'File upload failed',
      [NotificationEventType.WORKSPACE_FILE_DELETE_SUCCESS]: 'File deleted',
      [NotificationEventType.WORKSPACE_FILE_MOVE_SUCCESS]: 'File moved',
      [NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS]: 'File renamed',
      
      // Folder events
      [NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS]: 'Folder created',
      [NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR]: 'Failed to create folder',
      [NotificationEventType.WORKSPACE_FOLDER_DELETE_SUCCESS]: 'Folder deleted',
      [NotificationEventType.WORKSPACE_FOLDER_MOVE_SUCCESS]: 'Folder moved',
      [NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS]: 'Folder renamed',
      
      // Batch events
      [NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS]: 'Items deleted',
      [NotificationEventType.WORKSPACE_BATCH_DELETE_ERROR]: 'Failed to delete items',
      [NotificationEventType.WORKSPACE_ITEMS_REORDER_START]: 'Reordering items...',
      [NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS]: 'Items reordered',
      [NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR]: 'Failed to reorder items',
      [NotificationEventType.WORKSPACE_ITEMS_MOVE_START]: 'Moving items...',
      [NotificationEventType.WORKSPACE_ITEMS_MOVE_SUCCESS]: 'Items moved',
      [NotificationEventType.WORKSPACE_ITEMS_MOVE_ERROR]: 'Failed to move items',
      
      // Link events
      [NotificationEventType.LINK_CREATE_SUCCESS]: 'Link created',
      [NotificationEventType.LINK_UPDATE_SUCCESS]: 'Link updated',
      [NotificationEventType.LINK_DELETE_SUCCESS]: 'Link deleted',
      [NotificationEventType.LINK_GENERATE_SUCCESS]: 'Link generated',
      [NotificationEventType.LINK_COPY_SUCCESS]: 'Link copied to clipboard',
      [NotificationEventType.LINK_NEW_UPLOAD]: `New upload to: ${payload.linkTitle}`,
      
      // Storage events
      [NotificationEventType.STORAGE_THRESHOLD_WARNING]: 'Storage warning',
      [NotificationEventType.STORAGE_THRESHOLD_CRITICAL]: 'Storage critical',
      [NotificationEventType.STORAGE_LIMIT_EXCEEDED]: 'Storage limit exceeded',
      [NotificationEventType.STORAGE_UPLOAD_BLOCKED]: 'Upload blocked',
      
      // File limit events
      [NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED]: 'Too many files selected',
      [NotificationEventType.WORKSPACE_FOLDER_DROPPED]: `Processing ${payload.fileCount || 0} files`,
      
      // Batch upload events
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_START]: `Uploading ${payload.totalItems || 0} files`,
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS]: `Uploading ${payload.totalItems || 0} files`,
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS]: 'Files uploaded successfully',
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR]: 'Failed to upload files',
    };

    return titleMap[event.type] || 'Notification';
  }

  /**
   * Generate description for notification
   */
  private generateDescription(event: NotificationEvent): string | undefined {
    const payload = event.payload as any;
    
    // Generate descriptions based on event type
    switch (event.type) {
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_START:
        return `Starting upload (${this.formatFileSize(payload.fileSize)})`;
      
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS:
        const progress = Math.round(payload.uploadProgress || 0);
        return `${progress}% complete (${this.formatFileSize(payload.fileSize)})`;
        
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS:
        return payload.fileName;
      
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR:
        return `${payload.fileName}: ${payload.error || 'Unknown error'}`;
      
      case NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS:
        return payload.folderName;
      
      case NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS:
        return `${payload.completedItems} items deleted`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_START:
        return `Reordering ${payload.totalItems} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS:
        return `Successfully reordered ${payload.totalItems} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR:
        return payload.error || `Failed to reorder ${payload.totalItems} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_START:
        return `Moving ${payload.totalItems} item${payload.totalItems === 1 ? '' : 's'}`;
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_SUCCESS:
        return `Successfully moved ${payload.totalItems} item${payload.totalItems === 1 ? '' : 's'}`;
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_ERROR:
        return payload.error || `Failed to move ${payload.totalItems} item${payload.totalItems === 1 ? '' : 's'}`;
      
      case NotificationEventType.LINK_NEW_UPLOAD:
        const items = [];
        if (payload.fileCount > 0) {
          items.push(`${payload.fileCount} file${payload.fileCount === 1 ? '' : 's'}`);
        }
        if (payload.folderCount > 0) {
          items.push(`${payload.folderCount} folder${payload.folderCount === 1 ? '' : 's'}`);
        }
        return `${payload.uploaderName} uploaded ${items.join(' and ')}`;
      
      case NotificationEventType.STORAGE_THRESHOLD_WARNING:
        return `${payload.usagePercentage}% of storage used`;
      
      case NotificationEventType.STORAGE_LIMIT_EXCEEDED:
        return 'Free up space to continue uploading files';
      
      case NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED:
        return payload.message || `You tried to upload ${payload.attemptedCount} files, but the maximum is ${payload.maxAllowed} files at once. Please select fewer files or upload in smaller batches.`;
      
      case NotificationEventType.WORKSPACE_FOLDER_DROPPED:
        return payload.message || 'Files will be uploaded to the selected location.';
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_START:
        const totalSizeStart = payload.totalSize ? ` (${this.formatFileSize(payload.totalSize)})` : '';
        return `Starting upload of ${payload.totalItems} files${totalSizeStart}`;
        
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS:
        const uploadProgress = Math.round(((payload.completedItems || 0) / (payload.totalItems || 1)) * 100);
        const totalSizeProgress = payload.totalSize ? ` (${this.formatFileSize(payload.totalSize)})` : '';
        return `${payload.completedItems} of ${payload.totalItems} completed${payload.failedItems ? ` (${payload.failedItems} failed)` : ''} - ${uploadProgress}%${totalSizeProgress}`;
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS:
        if (payload.failedItems && payload.failedItems > 0) {
          return `Uploaded ${payload.completedItems} file${payload.completedItems === 1 ? '' : 's'}, ${payload.failedItems} failed`;
        }
        return `Successfully uploaded ${payload.completedItems} file${payload.completedItems === 1 ? '' : 's'}`;
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR:
        return payload.error || `Failed to upload ${payload.failedItems} file${payload.failedItems === 1 ? '' : 's'}`;
      
      default:
        return payload.error || payload.message || undefined;
    }
  }

  /**
   * Determine UI type for notification
   */
  private determineUIType(event: NotificationEvent): NotificationUIType {
    // Check if UI type is explicitly configured
    if (event.config?.uiType) {
      return event.config.uiType;
    }

    // Determine based on event characteristics
    const isError = isErrorEvent(event.type);
    const isProgress = isProgressEvent(event.type);
    const priority = event.config?.priority || NotificationPriority.MEDIUM;

    // Critical events should be modals
    if (priority === NotificationPriority.CRITICAL) {
      return NotificationUIType.MODAL;
    }

    // Progress events should show progress UI
    if (isProgress) {
      return NotificationUIType.PROGRESS;
    }

    // Storage warnings should be banners
    if (event.type.startsWith('storage.')) {
      return NotificationUIType.BANNER;
    }

    // Link uploads should be interactive
    if (event.type === NotificationEventType.LINK_NEW_UPLOAD) {
      return NotificationUIType.TOAST_INTERACTIVE;
    }

    // Default to simple toast
    return NotificationUIType.TOAST_SIMPLE;
  }

  /**
   * Route notification to appropriate handler
   */
  private routeNotification(
    event: NotificationEvent,
    display: NotificationDisplay,
    uiType: NotificationUIType
  ): void {

    // Add to deduplication map
    const key = this.getDeduplicationKey(event);
    this.deduplicationMap.set(key, {
      eventType: event.type,
      key,
      timestamp: Date.now(),
      count: 1,
    });

    // Route based on UI type
    switch (uiType) {
      case NotificationUIType.TOAST_SIMPLE:
        this.showToast(event, display);
        break;
      
      case NotificationUIType.TOAST_INTERACTIVE:
        this.showInteractiveToast(event, display);
        break;
      
      case NotificationUIType.BANNER:
        this.showBanner(event, display);
        break;
      
      case NotificationUIType.MODAL:
        this.showModal(event, display);
        break;
      
      case NotificationUIType.PROGRESS:
        this.showProgress(event, display);
        break;
      
      case NotificationUIType.STACKED:
        this.addToStack(event, display);
        break;
      
      default:
        this.showToast(event, display);
    }

    // Play sound if enabled
    if (this.config.enableSound) {
      this.playNotificationSound(event);
    }
  }

  /**
   * Show simple toast notification
   */
  private showToast(event: NotificationEvent, display: NotificationDisplay, customId?: string): void {
    const isError = isErrorEvent(event.type);
    const isSuccess = isSuccessEvent(event.type);
    const toastId = customId || `${event.type}-${this.getDeduplicationKey(event)}`;

    const options: any = {
      id: toastId,
    };
    
    // Only add properties if they have values
    if (display.description) {
      options.description = display.description;
    }
    if (display.duration !== undefined) {
      options.duration = display.duration;
    }

    // Add action buttons from event config
    if (event.config?.actions && event.config.actions.length > 0) {
      // Primary action button
      const primaryAction = event.config.actions[0];
      if (primaryAction) {
        options.action = {
          label: primaryAction.label,
          onClick: () => {
            primaryAction.handler?.();
            // Remove from active toasts when action is clicked
            this.activeToasts.delete(toastId);
          }
        };
      }

      // Secondary cancel/dismiss button
      if (event.config.actions.length > 1) {
        const secondaryAction = event.config.actions[1];
        if (secondaryAction) {
          options.cancel = {
            label: secondaryAction.label,
            onClick: () => {
              secondaryAction.handler?.();
              // Remove from active toasts when cancel is clicked
              this.activeToasts.delete(toastId);
            }
          };
        }
      }
    }

    // Track active toast
    this.activeToasts.add(toastId);
    setTimeout(() => {
      this.activeToasts.delete(toastId);
    }, display.duration || this.config.defaultDuration);

    // Show toast based on type (removed progress check as it's handled separately)
    if (isError) {
      toast.error(display.title, options);
    } else if (isSuccess) {
      toast.success(display.title, options);
    } else if (event.type.includes('warning')) {
      toast.warning(display.title, options);
    } else {
      toast.info(display.title, options);
    }
  }

  /**
   * Show interactive toast notification
   */
  private showInteractiveToast(event: NotificationEvent, display: NotificationDisplay): void {
    // This will be implemented with custom toast components
    // For now, fall back to simple toast
    this.showToast(event, display);
  }

  /**
   * Show banner notification
   */
  private showBanner(event: NotificationEvent, display: NotificationDisplay): void {
    // This will be implemented with banner component
    // For now, fall back to toast with longer duration
    this.showToast(event, { ...display, duration: 8000 });
  }

  /**
   * Show modal notification
   */
  private showModal(event: NotificationEvent, display: NotificationDisplay): void {
    // This will be implemented with modal component
    // For now, fall back to toast
    this.showToast(event, display);
  }

  /**
   * Show progress notification
   */
  private showProgress(event: NotificationEvent, display: NotificationDisplay): void {
    const payload = event.payload as any;
    const progressId = payload.batchId || payload.fileId || event.metadata.correlationId;
    
    if (!progressId) {
      this.showToast(event, display);
      return;
    }

    // Check if this upload was already completed - if so, ignore all further events
    if (this.completedUploads.has(progressId)) {
      return;
    }

    // For file upload start, create initial progress toast
    if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_START) {
      // Check if already exists
      const existingToastId = this.progressToasts.get(progressId);
      if (!existingToastId && !this.completedUploads.has(progressId)) {
        const payload = event.payload as any;
        
        // Get cancel handler if provided (though usually not for START event)
        const cancelHandler = event.config?.actions?.[0]?.handler;
        
        // Use the helper function to show custom progress notification starting at 0%
        const toastId = showFileUploadProgress(
          progressId,
          payload.fileName || 'file',
          payload.fileSize || 0,
          0,
          'uploading',
          cancelHandler
        );
        
        this.progressToasts.set(progressId, toastId);
      }
      return;
    }
    
    // For file upload progress, update the existing toast
    if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS) {
      const payload = event.payload as any;
      
      // Get cancel handler if provided
      const cancelHandler = event.config?.actions?.[0]?.handler;
      
      // Use the helper function to show custom progress notification with cancel button
      const toastId = showFileUploadProgress(
        progressId,
        payload.fileName || 'file',
        payload.fileSize || 0,
        payload.uploadProgress || 0,
        'uploading',
        cancelHandler
      );
      
      this.progressToasts.set(progressId, toastId);
      return;
    }
    
    // For file upload success, dismiss loading and show success
    if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS) {
      // Mark as completed to prevent any further updates
      this.completedUploads.add(progressId);
      
      const existingToastId = this.progressToasts.get(progressId);
      if (existingToastId) {
        // Force dismiss the loading toast completely
        toast.dismiss(existingToastId);
        // Remove all traces of it
        this.progressToasts.delete(progressId);
      }
      // Create a new success toast with a different ID to avoid conflicts
      toast.success(display.title, {
        description: display.description,
        duration: 3000,
        id: `success-${progressId}`, // Different ID to avoid conflicts
      });
      
      // Clean up completed uploads after a delay
      setTimeout(() => {
        this.completedUploads.delete(progressId);
      }, 10000);
      return;
    }
    
    // For file upload error, dismiss loading and show error
    if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR) {
      // Mark as completed to prevent any further updates
      this.completedUploads.add(progressId);
      
      const existingToastId = this.progressToasts.get(progressId);
      if (existingToastId) {
        // Force dismiss the loading toast completely
        toast.dismiss(existingToastId);
        // Remove all traces of it
        this.progressToasts.delete(progressId);
      }
      // Create a new error toast with a different ID to avoid conflicts
      toast.error(display.title, {
        description: display.description,
        duration: 5000,
        id: `error-${progressId}`, // Different ID to avoid conflicts
      });
      
      // Clean up completed uploads after a delay
      setTimeout(() => {
        this.completedUploads.delete(progressId);
      }, 10000);
      return;
    }

    // For batch upload events with only 1 item, suppress the notification
    if ((event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_START || 
         event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS) && 
        payload.totalItems === 1) {
      // Suppress batch notifications for single file uploads
      return;
    }

    // For other progress events, use standard loading toast
    const existingToastId = this.progressToasts.get(progressId);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }

    const toastId = toast.loading(display.title, {
      description: display.description,
      id: `progress-${progressId}`,
    });

    this.progressToasts.set(progressId, toastId as string);

    // If this is a completion event, convert to success
    if (event.type.includes('.success')) {
      setTimeout(() => {
        toast.success(display.title, {
          id: toastId,
          description: display.description,
        });
        this.progressToasts.delete(progressId);
      }, 100);
    }
  }

  /**
   * Add notification to stack
   */
  private addToStack(event: NotificationEvent, display: NotificationDisplay): void {
    // This will be implemented with stacked notifications component
    // For now, fall back to simple toast
    this.showToast(event, display);
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(event: NotificationEvent): void {
    const { silentNotifications } = useUserSettingsStore.getState();
    if (silentNotifications) {
      return;
    }

    const isError = isErrorEvent(event.type);
    const isWarning = event.type.includes('warning') || event.type.includes('critical');

    if (isError || isWarning) {
      playWarningNotificationSound();
    } else {
      // Check if this is a drag/drop/move operation that shouldn't play sound
      const silentOperations = ['move', 'reorder', 'drag'];
      const shouldBeSilent = silentOperations.some(op => event.type.includes(op));
      
      if (!shouldBeSilent) {
        playGeneralNotificationSound();
      }
    }
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    toast.dismiss();
    this.activeToasts.clear();
    this.progressToasts.clear();
    this.deduplicationMap.clear();
  }

  /**
   * Destroy the manager instance
   */
  public static destroy(): void {
    if (NotificationManager.instance) {
      NotificationManager.instance.clearAll();
      NotificationManager.instance = null;
    }
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Get the singleton notification manager instance
 */
export const notificationManager = NotificationManager.getInstance();

/**
 * Initialize the notification system
 */
export function initializeNotifications(config?: Partial<NotificationManagerConfig>): void {
  NotificationManager.getInstance(config);
}