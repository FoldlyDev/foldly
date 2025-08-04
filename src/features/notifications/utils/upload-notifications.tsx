/**
 * Upload Notifications - Dynamic toast/sonner notifications for uploads
 */

'use client';

import { toast } from 'sonner';
import { 
  UploadNotificationContent, 
  BatchUploadNotificationContent 
} from '../components/UploadNotificationContent';

interface UploadNotificationData {
  linkId: string;
  linkTitle: string;
  uploaderName: string;
  fileCount: number;
  folderCount: number;
}

/**
 * Show custom upload notification with View button
 * Uses custom toast with Next.js navigation
 */
export function showUploadNotification(data: UploadNotificationData): void {
  // Use custom interactive toast with Next.js navigation
  toast.custom((t) => (
    <UploadNotificationContent
      toastId={t}
      linkId={data.linkId}
      linkTitle={data.linkTitle}
      uploaderName={data.uploaderName}
      fileCount={data.fileCount}
      folderCount={data.folderCount}
    />
  ), {
    duration: 8000,
    position: 'bottom-right',
  });
}

/**
 * Show quick notification using Sonner (no interactivity)
 * Used for simple success/error/info messages
 */
export function showQuickNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info',
  description?: string
): void {
  toast[type](message, {
    description,
    duration: 4000,
    position: 'bottom-right',
  });
}

/**
 * Show batch upload notification (multiple uploads grouped)
 */
export function showBatchUploadNotification(
  linkTitle: string,
  totalCount: number,
  linkId: string
): void {
  // Use custom toast with Next.js navigation
  toast.custom((t) => (
    <BatchUploadNotificationContent
      toastId={t}
      linkId={linkId}
      linkTitle={linkTitle}
      totalCount={totalCount}
    />
  ), {
    duration: 8000,
    position: 'bottom-right',
  });
}

// Export the original interface for backward compatibility
export type { UploadNotificationData as LinkUploadNotificationData };