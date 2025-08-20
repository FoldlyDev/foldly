/**
 * Toast Compatibility Layer
 * Provides backward compatibility while migrating to the event-driven system
 * 
 * ⚠️ DEPRECATED: This is a temporary compatibility layer.
 * New code should use the event bus directly.
 */

import { toast as sonnerToast } from 'sonner';
import {
  eventBus,
  NotificationEventType,
  NotificationPriority,
  NotificationUIType,
} from '../core';

/**
 * Enhanced toast object that emits events instead of direct toast calls
 * Drop-in replacement for existing toast usage
 */
export const toast = {
  /**
   * Success toast - emits a generic success event
   */
  success: (message: string, options?: any) => {
    // Emit event for tracking
    eventBus.emitNotification(
      NotificationEventType.SYSTEM_UPDATE_AVAILABLE, // Generic success event
      { message, severity: 'info' },
      {
        priority: NotificationPriority.LOW,
        uiType: NotificationUIType.TOAST_SIMPLE,
        channels: {
          internal: { enabled: true },
        },
      }
    );

    // For backward compatibility, still show the toast
    // This will be removed once migration is complete
    return sonnerToast.success(message, options);
  },

  /**
   * Error toast - emits a generic error event
   */
  error: (message: string, options?: any) => {
    // Emit event for tracking
    eventBus.emitNotification(
      NotificationEventType.SYSTEM_ERROR_NETWORK, // Generic error event
      { message, severity: 'error' },
      {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.TOAST_SIMPLE,
        channels: {
          internal: { enabled: true },
        },
      }
    );

    // For backward compatibility
    return sonnerToast.error(message, options);
  },

  /**
   * Info toast - emits a generic info event
   */
  info: (message: string, options?: any) => {
    // Emit event for tracking
    eventBus.emitNotification(
      NotificationEventType.SYSTEM_UPDATE_AVAILABLE,
      { message, severity: 'info' },
      {
        priority: NotificationPriority.LOW,
        uiType: NotificationUIType.TOAST_SIMPLE,
        channels: {
          internal: { enabled: true },
        },
      }
    );

    // For backward compatibility
    return sonnerToast.info(message, options);
  },

  /**
   * Warning toast - emits a generic warning event
   */
  warning: (message: string, options?: any) => {
    // Emit event for tracking
    eventBus.emitNotification(
      NotificationEventType.SYSTEM_UPDATE_AVAILABLE,
      { message, severity: 'warning' },
      {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.TOAST_SIMPLE,
        channels: {
          internal: { enabled: true },
        },
      }
    );

    // For backward compatibility
    return sonnerToast.warning(message, options);
  },

  /**
   * Loading toast - for progress events
   */
  loading: (message: string, options?: any) => {
    // For loading, we don't emit events yet
    // This will be handled by progress events
    return sonnerToast.loading(message, options);
  },

  /**
   * Custom toast - for interactive notifications
   */
  custom: (component: any, options?: any) => {
    // Custom toasts will be migrated to specific event types
    return sonnerToast.custom(component, options);
  },

  /**
   * Promise toast - for async operations
   */
  promise: (promise: any, options?: any) => {
    return sonnerToast.promise(promise, options);
  },

  /**
   * Dismiss toast
   */
  dismiss: sonnerToast.dismiss,
};

/**
 * Migration helper to convert old notification calls to new event system
 */
export class NotificationMigrationHelper {
  /**
   * Map old event types to new event types
   */
  private static eventTypeMap: Record<string, NotificationEventType> = {
    'file_moved': NotificationEventType.WORKSPACE_FILE_MOVE_SUCCESS,
    'file_renamed': NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS,
    'file_deleted': NotificationEventType.WORKSPACE_FILE_DELETE_SUCCESS,
    'file_uploaded': NotificationEventType.WORKSPACE_FILE_UPLOAD_SUCCESS,
    'folder_moved': NotificationEventType.WORKSPACE_FOLDER_MOVE_SUCCESS,
    'folder_renamed': NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS,
    'folder_deleted': NotificationEventType.WORKSPACE_FOLDER_DELETE_SUCCESS,
    'folder_created': NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS,
    'items_reordered': NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS,
    'storage_warning': NotificationEventType.STORAGE_THRESHOLD_WARNING,
    'storage_critical': NotificationEventType.STORAGE_THRESHOLD_CRITICAL,
    'storage_exceeded': NotificationEventType.STORAGE_LIMIT_EXCEEDED,
    'upload_blocked': NotificationEventType.STORAGE_UPLOAD_BLOCKED,
    'link_upload': NotificationEventType.LINK_NEW_UPLOAD,
  };

  /**
   * Convert old event type to new event type
   */
  public static convertEventType(oldType: string): NotificationEventType | null {
    return this.eventTypeMap[oldType] || null;
  }

  /**
   * Log migration warning in development
   */
  public static logMigrationWarning(location: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[NotificationMigration] Direct toast call at ${location} should be migrated to event system`,
        '\nSee: src/features/notifications/REFACTOR-TODO.md'
      );
    }
  }
}

/**
 * Temporary wrapper for old showWorkspaceNotification function
 */
export function showWorkspaceNotificationCompat(
  event: string,
  data: any
): void {
  const newEventType = NotificationMigrationHelper.convertEventType(event);
  
  if (newEventType) {
    // Convert to new system
    eventBus.emitNotification(
      newEventType as any,
      data,
      {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.TOAST_SIMPLE,
        channels: {
          internal: { enabled: true },
        },
      }
    );
  } else {
    // Fallback to old system
    console.warn(`Unknown event type for migration: ${event}`);
  }
}

// Export a migration status checker
export function checkMigrationStatus(): {
  totalToastCalls: number;
  migratedCalls: number;
  percentComplete: number;
} {
  // This would track migration progress
  // For now, return placeholder data
  return {
    totalToastCalls: 35, // From our analysis
    migratedCalls: 0,
    percentComplete: 0,
  };
}