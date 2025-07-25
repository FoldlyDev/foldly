export type NotificationEvent =
  | 'file_moved'
  | 'file_renamed'
  | 'file_deleted'
  | 'file_uploaded'
  | 'folder_moved'
  | 'folder_renamed'
  | 'folder_deleted'
  | 'folder_created'
  | 'items_reordered';

export interface NotificationConfig {
  event: NotificationEvent;
  title: string;
  description: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export interface WorkspaceNotificationData {
  itemName: string;
  itemType: 'file' | 'folder';
  targetLocation?: string;
  sourcePath?: string;
  targetPath?: string;
}
