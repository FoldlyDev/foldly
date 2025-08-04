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
  | 'storage_warning'
  | 'storage_critical'
  | 'storage_exceeded'
  | 'upload_blocked'
  | 'link_upload';

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

export interface StorageNotificationData {
  currentUsage: number;
  totalLimit: number;
  remainingSpace: number;
  usagePercentage: number;
  planKey: string;
  filesCount?: number;
}

export interface LinkUploadNotificationData {
  linkId: string;
  linkTitle: string;
  uploaderName: string;
  uploaderEmail?: string;
  fileCount: number;
  folderCount: number;
}
