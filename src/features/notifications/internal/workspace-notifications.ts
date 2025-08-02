import { toast } from 'sonner';
import type {
  NotificationEvent,
  NotificationConfig,
  WorkspaceNotificationData,
  StorageNotificationData,
} from './types';
import { formatBytes } from '@/features/workspace/lib/utils/storage-utils';

/**
 * Generate a unique toast ID for deduplication
 */
function generateToastId(
  event: NotificationEvent,
  data: WorkspaceNotificationData | StorageNotificationData
): string {
  // For storage notifications, use planKey as identifier
  if ('planKey' in data) {
    return `${event}-${data.planKey}-${Date.now()}`;
  }
  // For workspace notifications, use itemName and itemType
  const workspaceData = data as WorkspaceNotificationData;
  return `${event}-${workspaceData.itemName}-${workspaceData.itemType}-${Date.now()}`;
}

/**
 * Generate notification configuration based on event type and data
 */
function generateNotificationConfig(
  event: NotificationEvent,
  data: WorkspaceNotificationData | StorageNotificationData
): NotificationConfig {
  // Type guard to check if data is WorkspaceNotificationData
  const isWorkspaceData = (d: typeof data): d is WorkspaceNotificationData => {
    return 'itemName' in d && 'itemType' in d;
  };
  
  // Extract workspace data properties if applicable
  const itemName = isWorkspaceData(data) ? data.itemName : '';
  const itemType = isWorkspaceData(data) ? data.itemType : '';
  const targetLocation = isWorkspaceData(data) ? data.targetLocation : undefined;

  switch (event) {
    case 'file_moved':
      return {
        event,
        title: 'File moved successfully',
        description: targetLocation
          ? `Moved ${itemName} to ${targetLocation}`
          : `Moved ${itemName}`,
        variant: 'success',
      };

    case 'folder_moved':
      return {
        event,
        title: 'Folder moved successfully',
        description: targetLocation
          ? `Moved ${itemName} to ${targetLocation}`
          : `Moved ${itemName}`,
        variant: 'success',
      };

    case 'items_reordered':
      return {
        event,
        title: 'Items reordered successfully',
        description: targetLocation
          ? `Updated item order in ${targetLocation}`
          : `Updated item order in workspace`,
        variant: 'success',
      };

    case 'file_renamed':
      return {
        event,
        title: 'File renamed successfully',
        description: `Renamed to ${itemName}`,
        variant: 'success',
      };

    case 'folder_renamed':
      return {
        event,
        title: 'Folder renamed successfully',
        description: `Renamed to ${itemName}`,
        variant: 'success',
      };

    case 'file_deleted':
      return {
        event,
        title: 'File deleted successfully',
        description: `Deleted ${itemName}`,
        variant: 'success',
      };

    case 'folder_deleted':
      return {
        event,
        title: 'Folder deleted successfully',
        description: `Deleted ${itemName}`,
        variant: 'success',
      };

    case 'folder_created':
      return {
        event,
        title: 'Folder created successfully',
        description: `Created ${itemName}`,
        variant: 'success',
      };

    case 'file_uploaded':
      return {
        event,
        title: 'File uploaded successfully',
        description: `Uploaded ${itemName}`,
        variant: 'success',
      };

    case 'storage_warning':
      const warningData = data as StorageNotificationData;
      return {
        event,
        title: 'Storage getting full',
        description: `Using ${warningData.usagePercentage.toFixed(1)}% of your storage limit. ${formatBytes(warningData.remainingSpace)} remaining.`,
        variant: 'warning',
      };

    case 'storage_critical':
      const criticalData = data as StorageNotificationData;
      return {
        event,
        title: 'Storage almost full',
        description: `Using ${criticalData.usagePercentage.toFixed(1)}% of your storage limit. Only ${formatBytes(criticalData.remainingSpace)} remaining.`,
        variant: 'warning',
      };

    case 'storage_exceeded':
      const exceededData = data as StorageNotificationData;
      return {
        event,
        title: 'Storage limit exceeded',
        description: `You've reached your ${formatBytes(exceededData.totalLimit)} storage limit. Please free up space or upgrade your plan.`,
        variant: 'error',
      };

    case 'upload_blocked':
      const blockedData = data as StorageNotificationData;
      return {
        event,
        title: 'Upload blocked',
        description: `Cannot upload files. Storage limit of ${formatBytes(blockedData.totalLimit)} has been reached.`,
        variant: 'error',
      };

    default:
      // For workspace events, access itemType and itemName
      const workspaceData = data as WorkspaceNotificationData;
      return {
        event,
        title: 'Action completed',
        description: `${workspaceData.itemType} ${workspaceData.itemName} updated`,
        variant: 'success',
      };
  }
}

/**
 * Show workspace notification toast with deduplication
 */
export function showWorkspaceNotification(
  event: NotificationEvent,
  data: WorkspaceNotificationData | StorageNotificationData
): void {
  const config = generateNotificationConfig(event, data);
  const toastId = generateToastId(event, data);

  const toastOptions = {
    description: config.description,
    id: toastId,
    duration: 4000, // 4 seconds
  };

  switch (config.variant) {
    case 'success':
      toast.success(config.title, toastOptions);
      break;

    case 'error':
      toast.error(config.title, toastOptions);
      break;

    case 'warning':
      toast.warning(config.title, toastOptions);
      break;

    case 'info':
    default:
      toast.info(config.title, toastOptions);
      break;
  }
}

/**
 * Show error notification for workspace operations with deduplication
 */
export function showWorkspaceError(
  event: NotificationEvent,
  data: WorkspaceNotificationData,
  error: string
): void {
  const { itemName, itemType } = data;
  const toastId = `error-${generateToastId(event, data)}`;

  toast.error(`Failed to ${event.replace('_', ' ')} ${itemType}`, {
    description: `${itemName}: ${error}`,
    id: toastId,
    duration: 6000, // 6 seconds for errors
  });
}

// =============================================================================
// STORAGE NOTIFICATIONS
// =============================================================================

/**
 * Show storage warning notification
 */
export function showStorageWarning(
  data: StorageNotificationData
): void {
  showWorkspaceNotification('storage_warning', data);
}

/**
 * Show storage critical notification
 */
export function showStorageCritical(
  data: StorageNotificationData
): void {
  showWorkspaceNotification('storage_critical', data);
}

/**
 * Show storage exceeded notification
 */
export function showStorageExceeded(
  data: StorageNotificationData
): void {
  showWorkspaceNotification('storage_exceeded', data);
}

/**
 * Show upload blocked notification
 */
export function showUploadBlocked(
  data: StorageNotificationData
): void {
  showWorkspaceNotification('upload_blocked', data);
}

/**
 * Show storage threshold notifications based on usage percentage
 */
export function checkAndShowStorageThresholds(
  data: StorageNotificationData,
  previousPercentage?: number
): void {
  const currentPercentage = data.usagePercentage;
  
  // Only show notifications when crossing thresholds, not on every check
  if (previousPercentage !== undefined) {
    // Crossing 100% threshold
    if (previousPercentage < 100 && currentPercentage >= 100) {
      showStorageExceeded(data);
      return;
    }
    
    // Crossing 95% threshold
    if (previousPercentage < 95 && currentPercentage >= 95) {
      showStorageCritical(data);
      return;
    }
    
    // Crossing 80% threshold
    if (previousPercentage < 80 && currentPercentage >= 80) {
      showStorageWarning(data);
      return;
    }
  } else {
    // First time check - show appropriate notification
    if (currentPercentage >= 100) {
      showStorageExceeded(data);
    } else if (currentPercentage >= 95) {
      showStorageCritical(data);
    } else if (currentPercentage >= 80) {
      showStorageWarning(data);
    }
  }
}
