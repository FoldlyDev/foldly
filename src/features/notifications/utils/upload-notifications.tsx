/**
 * Upload Notifications - Dynamic toast/sonner notifications for uploads
 */

'use client';

import { toast } from 'sonner';
import { 
  UploadNotificationContent, 
  BatchUploadNotificationContent 
} from '../components/UploadNotificationContent';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';

interface UploadNotificationData {
  linkId: string;
  linkTitle: string;
  uploaderName: string;
  fileCount: number;
  folderCount: number;
}

/**
 * Play notification sound if not in silent mode
 * @param type - 'upload' for upload notifications, 'general' for all others
 */
function playNotificationSound(type: 'upload' | 'general' = 'general') {
  const { silentNotifications } = useUserSettingsStore.getState();
  
  if (!silentNotifications && typeof window !== 'undefined') {
    try {
      const audioFile = type === 'upload' 
        ? '/assets/audio/upload_notification_sound.wav'
        : '/assets/audio/general_notification_sound.wav';
      
      const audio = new Audio(audioFile);
      audio.volume = 0.3; // 30% volume for subtlety
      audio.play().catch(error => {
        // Silently fail if audio playback is blocked
        console.debug('Notification sound blocked:', error);
      });
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Notification sound failed:', error);
    }
  }
}

/**
 * Show custom upload notification with View button
 * Uses custom toast with Next.js navigation
 */
export function showUploadNotification(data: UploadNotificationData): void {
  // Play upload-specific sound
  playNotificationSound('upload');
  
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
  // Play upload-specific sound for batch notifications
  playNotificationSound('upload');
  
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