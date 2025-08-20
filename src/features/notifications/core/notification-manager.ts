/**
 * Notification Manager
 * Handles routing, deduplication, and presentation of notifications
 */

import { toast } from 'sonner';
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
      [NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS]: 'Items reordered',
      
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
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS:
        return payload.fileName;
      
      case NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR:
        return `${payload.fileName}: ${payload.error || 'Unknown error'}`;
      
      case NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS:
        return payload.folderName;
      
      case NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS:
        return `${payload.completedItems} items deleted`;
      
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

    // Track active toast
    this.activeToasts.add(toastId);
    setTimeout(() => {
      this.activeToasts.delete(toastId);
    }, display.duration || this.config.defaultDuration);

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

    // Check if this is an update to existing progress
    const existingToastId = this.progressToasts.get(progressId);
    if (existingToastId) {
      toast.dismiss(existingToastId);
    }

    // Create new progress toast
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