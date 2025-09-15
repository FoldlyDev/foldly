/**
 * Notification Manager
 * Handles routing, deduplication, and presentation of notifications
 */

import { toast } from 'sonner';
import { showFileUploadProgress } from '../utils/upload-notifications';
import { showProgressToast } from '../components/ProgressToast';
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
import {
  getPayloadProperty,
} from './notification-manager-types';
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

    // Skip deduplication for progress events - they need to update continuously
    const isProgress = isProgressEvent(event.type);
    if (!isProgress && this.isDuplicate(event)) {
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
    const payload = event.payload;
    const keyParts: string[] = [event.type];

    // Add relevant payload fields based on event type
    const fileId = getPayloadProperty<string>(payload, 'fileId');
    const folderId = getPayloadProperty<string>(payload, 'folderId');
    const linkId = getPayloadProperty<string>(payload, 'linkId');
    const batchId = getPayloadProperty<string>(payload, 'batchId');
    
    if (fileId) keyParts.push(fileId);
    if (folderId) keyParts.push(folderId);
    if (linkId) keyParts.push(linkId);
    if (batchId) keyParts.push(batchId);

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
    const payload = event.payload;
    
    // Map of event types to title generators
    const titleMap: Record<string, string> = {
      // File events
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_START]: `Uploading ${'fileName' in payload ? payload.fileName : 'file'}`,
      [NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS]: `Uploading ${'fileName' in payload ? payload.fileName : 'file'}`,
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
      [NotificationEventType.LINK_DELETE_ERROR]: 'Failed to delete link',
      [NotificationEventType.LINK_GENERATE_SUCCESS]: 'Link generated',
      [NotificationEventType.LINK_COPY_SUCCESS]: 'Link copied to clipboard',
      [NotificationEventType.LINK_NEW_UPLOAD]: `New upload to: ${'linkTitle' in payload ? payload.linkTitle : 'link'}`,
      
      // Storage events
      [NotificationEventType.STORAGE_THRESHOLD_WARNING]: 'Storage warning',
      [NotificationEventType.STORAGE_THRESHOLD_CRITICAL]: 'Storage critical',
      [NotificationEventType.STORAGE_LIMIT_EXCEEDED]: 'Storage limit exceeded',
      [NotificationEventType.STORAGE_UPLOAD_BLOCKED]: 'Upload blocked',
      
      // File limit events
      [NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED]: 'Too many files selected',
      [NotificationEventType.WORKSPACE_FOLDER_DROPPED]: `Processing ${'fileCount' in payload ? payload.fileCount : 0} files`,
      
      // Batch upload events
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_START]: `Uploading ${'totalItems' in payload ? payload.totalItems : 0} files`,
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS]: `Uploading ${'totalItems' in payload ? payload.totalItems : 0} files`,
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS]: 'Files uploaded successfully',
      [NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR]: 'Failed to upload files',
      
      // Copy to workspace events
      [NotificationEventType.WORKSPACE_ITEMS_COPY_START]: `Copying ${'totalItems' in payload ? payload.totalItems : 0} items to workspace`,
      [NotificationEventType.WORKSPACE_ITEMS_COPY_SUCCESS]: 'Items copied to workspace',
      [NotificationEventType.WORKSPACE_ITEMS_COPY_ERROR]: 'Failed to copy items',
      [NotificationEventType.WORKSPACE_ITEMS_COPY_PARTIAL]: 'Some items failed to copy',
    };

    return titleMap[event.type] || 'Notification';
  }


  /**
   * Generate description for notification
   */
  private generateDescription(event: NotificationEvent): string | undefined {
    const payload = event.payload;
    
    // Generate descriptions based on event type
    switch (event.type) {
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_START:
        return `Starting upload (${this.formatFileSize(getPayloadProperty<number>(payload, 'fileSize', 0))})`;
      
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS:
        const progress = Math.round(getPayloadProperty<number>(payload, 'uploadProgress', 0) || 0);
        return `${progress}% complete (${this.formatFileSize(getPayloadProperty<number>(payload, 'fileSize', 0))})`;
        
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS:
        return getPayloadProperty<string>(payload, 'fileName');
      
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR:
        const fileName = getPayloadProperty<string>(payload, 'fileName', 'File');
        const error = getPayloadProperty<string>(payload, 'error', 'Unknown error');
        return `${fileName}: ${error}`;
      
      case NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS:
        return getPayloadProperty<string>(payload, 'folderName');
      
      case NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS:
        return `${getPayloadProperty<number>(payload, 'completedItems', 0)} items deleted`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_START:
        return `Reordering ${getPayloadProperty<number>(payload, 'totalItems', 0)} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS:
        return `Successfully reordered ${getPayloadProperty<number>(payload, 'totalItems', 0)} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR:
        return getPayloadProperty<string>(payload, 'error') || `Failed to reorder ${getPayloadProperty<number>(payload, 'totalItems', 0)} items`;
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_START: {
        const totalItems = getPayloadProperty<number>(payload, 'totalItems', 0);
        return `Moving ${totalItems} item${totalItems === 1 ? '' : 's'}`;
      }
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_SUCCESS: {
        const totalItems = getPayloadProperty<number>(payload, 'totalItems', 0);
        return `Successfully moved ${totalItems} item${totalItems === 1 ? '' : 's'}`;
      }
      
      case NotificationEventType.WORKSPACE_ITEMS_MOVE_ERROR: {
        const totalItems = getPayloadProperty<number>(payload, 'totalItems', 0);
        return getPayloadProperty<string>(payload, 'error') || `Failed to move ${totalItems} item${totalItems === 1 ? '' : 's'}`;
      }
      
      case NotificationEventType.LINK_NEW_UPLOAD: {
        const items = [];
        const fileCount = getPayloadProperty<number>(payload, 'fileCount', 0);
        const folderCount = getPayloadProperty<number>(payload, 'folderCount', 0);
        const uploaderName = getPayloadProperty<string>(payload, 'uploaderName', 'Someone');
        
        if (fileCount > 0) {
          items.push(`${fileCount} file${fileCount === 1 ? '' : 's'}`);
        }
        if (folderCount > 0) {
          items.push(`${folderCount} folder${folderCount === 1 ? '' : 's'}`);
        }
        return `${uploaderName} uploaded ${items.join(' and ')}`;
      }
      
      case NotificationEventType.STORAGE_THRESHOLD_WARNING:
        return `${getPayloadProperty<number>(payload, 'usagePercentage', 0)}% of storage used`;
      
      case NotificationEventType.STORAGE_LIMIT_EXCEEDED:
        return 'Free up space to continue uploading files';
      
      case NotificationEventType.WORKSPACE_FILES_LIMIT_EXCEEDED: {
        const message = getPayloadProperty<string>(payload, 'message');
        const attemptedCount = getPayloadProperty<number>(payload, 'attemptedCount', 0);
        const maxAllowed = getPayloadProperty<number>(payload, 'maxAllowed', 0);
        return message || `You tried to upload ${attemptedCount} files, but the maximum is ${maxAllowed} files at once. Please select fewer files or upload in smaller batches.`;
      }
      
      case NotificationEventType.WORKSPACE_FOLDER_DROPPED:
        return getPayloadProperty<string>(payload, 'message') || 'Files will be uploaded to the selected location.';
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_START: {
        const totalItems = getPayloadProperty<number>(payload, 'totalItems', 0);
        const totalSize = getPayloadProperty<number>(payload, 'totalSize');
        const totalSizeStart = totalSize ? ` (${this.formatFileSize(totalSize)})` : '';
        return `Starting upload of ${totalItems} files${totalSizeStart}`;
      }
        
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS: {
        const completedItems = getPayloadProperty<number>(payload, 'completedItems', 0);
        const totalItems = getPayloadProperty<number>(payload, 'totalItems', 1);
        const failedItems = getPayloadProperty<number>(payload, 'failedItems', 0);
        const totalSize = getPayloadProperty<number>(payload, 'totalSize');
        const uploadProgress = Math.round((completedItems / totalItems) * 100);
        const totalSizeProgress = totalSize ? ` (${this.formatFileSize(totalSize)})` : '';
        return `${completedItems} of ${totalItems} completed${failedItems ? ` (${failedItems} failed)` : ''} - ${uploadProgress}%${totalSizeProgress}`;
      }
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS: {
        const completedItems = getPayloadProperty<number>(payload, 'completedItems', 0);
        const failedItems = getPayloadProperty<number>(payload, 'failedItems', 0);
        if (failedItems > 0) {
          return `Uploaded ${completedItems} file${completedItems === 1 ? '' : 's'}, ${failedItems} failed`;
        }
        return `Successfully uploaded ${completedItems} file${completedItems === 1 ? '' : 's'}`;
      }
      
      case NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR: {
        const failedItems = getPayloadProperty<number>(payload, 'failedItems', 0);
        const error = getPayloadProperty<string>(payload, 'error');
        return error || `Failed to upload ${failedItems} file${failedItems === 1 ? '' : 's'}`;
      }
      
      default:
        return getPayloadProperty<string>(payload, 'error') || getPayloadProperty<string>(payload, 'message') || undefined;
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

    // Add to deduplication map (except for progress events which need continuous updates)
    const isProgress = isProgressEvent(event.type);
    if (!isProgress) {
      const key = this.getDeduplicationKey(event);
      this.deduplicationMap.set(key, {
        eventType: event.type,
        key,
        timestamp: Date.now(),
        count: 1,
      });
    }

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

    const options: Record<string, unknown> = {
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
    const payload = event.payload;
    const fileId = getPayloadProperty<string>(payload, 'fileId');
    const batchId = getPayloadProperty<string>(payload, 'batchId');
    
    console.log('[NotificationManager.showProgress] Event type:', event.type, 'FileId:', fileId, 'BatchId:', batchId);
    
    // Generate a progress ID if neither fileId nor batchId is available
    const progressId = fileId || batchId || `progress-${Date.now()}`;
    
    // Suppress individual file notifications when they're part of a batch
    if (fileId && batchId) {
      // Individual file events within a batch should be suppressed
      // The batch-level notifications will handle the UI updates
      if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_START || 
          event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS ||
          event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS ||
          event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR) {
        return; // Suppress individual file notifications within batches
      }
    }
    
    // Handle single file uploads (they have fileId but no batchId)
    if (fileId && !batchId) {
      // Check if this upload was already completed - if so, ignore all further events
      if (this.completedUploads.has(fileId)) {
        return;
      }

      // For file upload start or progress, just call showFileUploadProgress
      // It will create or update the toast as needed
      if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_START || 
          event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_PROGRESS) {
        
        const fileName = getPayloadProperty<string>(payload, 'fileName') || 'file';
        const fileSize = getPayloadProperty<number>(payload, 'fileSize') || 0;
        const uploadProgress = getPayloadProperty<number>(payload, 'uploadProgress') || 0;
        const cancelHandler = event.config?.actions?.[0]?.handler;
        
        // Simply call showFileUploadProgress - it handles both create and update
        showFileUploadProgress(
          fileId,
          fileName,
          fileSize,
          uploadProgress,
          'uploading',
          cancelHandler
        );
        
        return;
      }
      
      // For file upload success, dismiss progress and show success
      if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS) {
        // Mark as completed to prevent any further updates
        this.completedUploads.add(fileId);
        
        const fileName = getPayloadProperty<string>(payload, 'fileName') || 'file';
        const fileSize = getPayloadProperty<number>(payload, 'fileSize') || 0;
        
        // Call showFileUploadProgress with 'success' status - it will dismiss the toast
        showFileUploadProgress(
          fileId,
          fileName,
          fileSize,
          100,
          'success'
        );
        
        // Show a standard success toast
        toast.success(display.title, {
          description: display.description,
          duration: 3000,
        });
        
        // Clean up completed uploads after a delay
        setTimeout(() => {
          this.completedUploads.delete(fileId);
        }, 10000);
        return;
      }
      
      // For file upload error, dismiss progress and show error
      if (event.type === NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR) {
        // Mark as completed to prevent any further updates
        this.completedUploads.add(fileId);
        
        const fileName = getPayloadProperty<string>(payload, 'fileName') || 'file';
        const fileSize = getPayloadProperty<number>(payload, 'fileSize') || 0;
        
        // Call showFileUploadProgress with 'error' status - it will dismiss the toast
        showFileUploadProgress(
          fileId,
          fileName,
          fileSize,
          0,
          'error'
        );
        
        // Show an error toast with the error details
        toast.error(display.title, {
          description: display.description,
          duration: 5000,
        });
        
        // Clean up completed uploads after a delay
        setTimeout(() => {
          this.completedUploads.delete(fileId);
        }, 10000);
        return;
      }
    }

    // For batch upload events with only 1 item, suppress the notification
    if ((event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_START || 
         event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS) && 
        getPayloadProperty<number>(payload, 'totalItems') === 1) {
      // Suppress batch notifications for single file uploads
      return;
    }

    // Handle batch upload progress with proper progress bar
    if (event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_START || 
        event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_PROGRESS) {
      const useBatchId = batchId || progressId;
      const totalItems = getPayloadProperty<number>(payload, 'totalItems') || 0;
      const completedItems = getPayloadProperty<number>(payload, 'completedItems') || 0;
      const failedItems = getPayloadProperty<number>(payload, 'failedItems') || 0;
      
      // Use uploadProgress if provided (smooth progress), otherwise calculate from completed items
      const uploadProgress = getPayloadProperty<number>(payload, 'uploadProgress');
      const progress = uploadProgress !== undefined 
        ? uploadProgress 
        : (totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);
      
      // Calculate estimated completed count based on progress for display
      // This gives users visual feedback of files being processed
      const estimatedCompleted = completedItems > 0 
        ? completedItems 
        : Math.floor((progress / 100) * totalItems);
      
      // Use the progress toast for batch uploads
      showProgressToast(
        useBatchId,
        `Uploading ${totalItems} files`,
        `${estimatedCompleted} of ${totalItems} completed${failedItems ? ` (${failedItems} failed)` : ''}`,
        progress,
        'uploading'
      );
      return;
    }

    // Handle batch upload success
    if (event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_SUCCESS) {
      const useBatchId = batchId || progressId;
      const completedItems = getPayloadProperty<number>(payload, 'completedItems') || 0;
      const failedItems = getPayloadProperty<number>(payload, 'failedItems') || 0;
      
      // Dismiss the progress toast
      toast.dismiss(`progress-${useBatchId}`);
      
      // Show success notification
      if (failedItems > 0) {
        toast.warning(display.title, {
          description: `Uploaded ${completedItems} file${completedItems === 1 ? '' : 's'}, ${failedItems} failed`,
          duration: 4000,
        });
      } else {
        toast.success(display.title, {
          description: `Successfully uploaded ${completedItems} file${completedItems === 1 ? '' : 's'}`,
          duration: 3000,
        });
      }
      return;
    }

    // Handle batch upload error
    if (event.type === NotificationEventType.WORKSPACE_BATCH_UPLOAD_ERROR) {
      const useBatchId = batchId || progressId;
      
      // Dismiss the progress toast
      toast.dismiss(`progress-${useBatchId}`);
      
      // Show error notification
      toast.error(display.title, {
        description: display.description,
        duration: 5000,
      });
      return;
    }

    // For other progress events, use standard loading toast
    toast.loading(display.title, {
      description: display.description,
      id: `progress-${progressId}`,
    });
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
  private formatFileSize(bytes: number | undefined): string {
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

    // Don't play sound for progress updates (only for start, success, error)
    if (event.type.includes('.progress')) {
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