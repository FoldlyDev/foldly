/**
 * Notification Sound Utility
 * Handles playing notification sounds based on type and user settings
 */

import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';

/**
 * Play notification sound based on type
 * @param type - The type of notification sound to play
 */
export function playNotificationSound(type: 'general' | 'warning' | 'error' = 'general') {
  const { silentNotifications } = useUserSettingsStore.getState();
  
  if (!silentNotifications && typeof window !== 'undefined') {
    try {
      let audioFile: string;
      
      switch (type) {
        case 'warning':
          audioFile = '/assets/audio/warning_notification_sound.wav';
          break;
        case 'error':
          audioFile = '/assets/audio/general_notification_sound.wav'; // Use general for errors
          break;
        default:
          audioFile = '/assets/audio/general_notification_sound.wav';
      }
      
      const audio = new Audio(audioFile);
      audio.volume = 0.3; // 30% volume for subtlety
      audio.play().catch(error => {
        // Silently fail if audio playback is blocked
        console.debug(`${type} notification sound blocked:`, error);
      });
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug(`${type} notification sound failed:`, error);
    }
  }
}

/**
 * Play general notification sound for non-upload notifications
 * Skips sound for drag/drop and move operations
 */
export function playGeneralNotificationSound() {
  playNotificationSound('general');
}

/**
 * Play warning notification sound
 */
export function playWarningNotificationSound() {
  playNotificationSound('warning');
}

/**
 * Check if a toast message is related to drag/drop or move operations
 * These operations should not play sounds
 */
export function shouldPlaySound(message: string | undefined): boolean {
  if (!message || typeof message !== 'string') return true;
  
  const silentPatterns = [
    /drag/i,
    /drop/i,
    /move/i,
    /moving/i,
    /dragging/i,
    /dropped/i,
    /transfer/i,
    /item moved/i,
    /items moved/i,
    /files moved/i,
    /folder moved/i,
  ];
  
  return !silentPatterns.some(pattern => pattern.test(message));
}