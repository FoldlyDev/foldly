/**
 * Upload notification utilities
 */

import { FileUp, FolderUp } from 'lucide-react';
import { showInfoToast } from '../components/InfoToast';
import { showInteractiveToast } from '../components/InteractiveToast';
import { showProgressToast } from '../components/ProgressToast';

// Simple set to track active upload toasts
const activeUploads = new Set<string>();

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Upload notification data
 */
export interface UploadNotificationData {
  linkTitle: string;
  linkId: string;
  fileCount: number;
  folderCount: number;
}

/**
 * Show link upload notification
 */
export function showLinkUploadNotification(data: UploadNotificationData): void {
  let description = '';
  if (data.fileCount > 0 && data.folderCount > 0) {
    description = `${data.fileCount} file${data.fileCount !== 1 ? 's' : ''} and ${data.folderCount} folder${data.folderCount !== 1 ? 's' : ''}`;
  } else if (data.fileCount > 0) {
    description = `${data.fileCount} file${data.fileCount !== 1 ? 's' : ''}`;
  } else if (data.folderCount > 0) {
    description = `${data.folderCount} folder${data.folderCount !== 1 ? 's' : ''}`;
  }

  showInteractiveToast({
    title: `New upload to: ${data.linkTitle}`,
    description,
    icon: data.fileCount > 0 ? FileUp : FolderUp,
    iconColor: 'text-blue-500',
    actions: [
      {
        label: 'View uploads',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard/files?linkId=${data.linkId}&highlight=true`;
          }
        },
        variant: 'primary',
      },
      {
        label: 'Dismiss',
        onClick: () => {},
        variant: 'secondary',
      }
    ],
    duration: 8000,
  });
}

/**
 * Show quick notification
 */
export function showQuickNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info',
  description?: string
): void {
  const variant = type === 'info' ? 'info' : type;
  showInfoToast(message, description, variant, 4000);
}

/**
 * Show batch upload notification
 */
export function showBatchUploadNotification(
  linkTitle: string,
  totalCount: number,
  linkId: string
): void {
  showInteractiveToast({
    title: `${totalCount} new uploads to ${linkTitle}`,
    description: 'Click to view all uploads',
    icon: FileUp,
    iconColor: 'text-blue-500',
    actions: [
      {
        label: 'View all',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = `/dashboard/files?linkId=${linkId}&highlight=true`;
          }
        },
        variant: 'primary',
      },
      {
        label: 'Dismiss',
        onClick: () => {},
        variant: 'secondary',
      }
    ],
    duration: 8000,
  });
}

/**
 * Show file upload progress notification
 * Call this with the same fileId to update progress
 */
export function showFileUploadProgress(
  fileId: string,
  fileName: string,
  fileSize: number,
  progress: number,
  status: 'uploading' | 'success' | 'error' = 'uploading',
  onCancel?: () => void
): string {
  // Track active uploads
  if (status === 'uploading') {
    activeUploads.add(fileId);
  } else {
    activeUploads.delete(fileId);
  }
  
  // Simply call showProgressToast with the current progress
  // Sonner will update the existing toast if the ID matches
  return showProgressToast(
    fileId,
    `Uploading ${fileName}`,
    formatFileSize(fileSize),
    progress,
    status,
    onCancel
  );
}

// Export types for backward compatibility
export type { UploadNotificationData as LinkUploadNotificationData };