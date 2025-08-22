'use client';

import { toast } from 'sonner';
import { GeneratedLinkNotificationContent } from '../components/GeneratedLinkNotificationContent';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';

/**
 * Play notification sound if not in silent mode
 */
function playNotificationSound() {
  const { silentNotifications } = useUserSettingsStore.getState();
  
  if (!silentNotifications && typeof window !== 'undefined') {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors - browser may block autoplay
      });
    } catch (error) {
      // Ignore audio errors
    }
  }
}

interface GeneratedLinkNotificationData {
  linkId: string;
  linkUrl: string;
  folderName: string;
}

/**
 * Show interactive notification for generated links
 */
export function showGeneratedLinkNotification(data: GeneratedLinkNotificationData): void {
  // Play notification sound
  playNotificationSound();
  
  // Use custom interactive toast
  toast.custom((t) => (
    <GeneratedLinkNotificationContent
      toastId={t}
      linkId={data.linkId}
      linkUrl={data.linkUrl}
      folderName={data.folderName}
    />
  ), {
    duration: 10000, // 10 seconds for generated link notifications
    position: 'bottom-right',
    className: 'generated-link-toast',
  });
}