import { toast } from 'sonner';
import type {
  NotificationEvent,
  NotificationConfig,
  WorkspaceNotificationData,
} from '../types';

/**
 * Generate a unique toast ID for deduplication
 */
function generateToastId(
  event: NotificationEvent,
  data: WorkspaceNotificationData
): string {
  return `${event}-${data.itemName}-${data.itemType}-${Date.now()}`;
}

/**
 * Generate notification configuration based on event type and data
 */
function generateNotificationConfig(
  event: NotificationEvent,
  data: WorkspaceNotificationData
): NotificationConfig {
  const { itemName, itemType, targetLocation } = data;

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

    default:
      return {
        event,
        title: 'Action completed',
        description: `${itemType} ${itemName} updated`,
        variant: 'success',
      };
  }
}

/**
 * Show workspace notification toast with deduplication
 */
export function showWorkspaceNotification(
  event: NotificationEvent,
  data: WorkspaceNotificationData
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
