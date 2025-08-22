// Notifications Feature Types
// Notification type definitions

export type NotificationEvent =
  | 'file_moved'
  | 'file_renamed'
  | 'file_deleted'
  | 'file_uploaded'
  | 'folder_moved'
  | 'folder_renamed'
  | 'folder_deleted'
  | 'folder_created'
  | 'items_reordered'
  | 'link_generated'
  | 'cloud_already_connected'
  | 'cloud_connection_failed'
  | 'cloud_verification_cancelled';

export interface NotificationConfig {
  event: NotificationEvent;
  title: string;
  description: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export interface WorkspaceNotificationData {
  itemName: string;
  itemType: 'file' | 'folder' | 'cloud_provider';
  targetLocation?: string;
  sourcePath?: string;
  targetPath?: string;
}
