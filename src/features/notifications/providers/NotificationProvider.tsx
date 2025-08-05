/**
 * Global Notification Provider - Ensures notifications work across the entire platform
 * Intercepts all toast notifications to respect user settings (DND, Silent mode)
 */

'use client';

import { useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { useRealtimeNotifications } from '../hooks/use-realtime-notifications';
import { useUserSettingsStore } from '@/features/settings/store/user-settings-store';
import { getUserSettingsAction } from '@/features/settings/lib/actions/user-settings-actions';
import { useUser } from '@clerk/nextjs';
import { playGeneralNotificationSound, playWarningNotificationSound, shouldPlaySound } from '@/lib/utils/notification-sound';

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Store the original toast methods
const originalToast = { ...sonnerToast };

// Custom toast wrapper that respects user settings
const createToastWrapper = () => {
  const checkSettings = () => {
    const { doNotDisturb, silentNotifications } = useUserSettingsStore.getState();
    return { doNotDisturb, silentNotifications };
  };

  // Wrap the main toast function
  const wrappedToast = Object.assign(
    (message: any, options?: any) => {
      const { doNotDisturb } = checkSettings();
      if (doNotDisturb) return; // Block all notifications in DND mode
      return originalToast(message, options);
    },
    {
      // Wrap all toast methods
      success: (message: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        
        // Play sound for non-drag/drop/move notifications
        if (shouldPlaySound(message)) {
          playGeneralNotificationSound();
        }
        
        return originalToast.success(message, options);
      },
      error: (message: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        
        // Always play sound for errors (important)
        playGeneralNotificationSound();
        
        return originalToast.error(message, options);
      },
      info: (message: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        
        // Play sound for non-drag/drop/move notifications
        if (shouldPlaySound(message)) {
          playGeneralNotificationSound();
        }
        
        return originalToast.info(message, options);
      },
      warning: (message: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        
        // Always play warning-specific sound (important)
        playWarningNotificationSound();
        
        return originalToast.warning(message, options);
      },
      custom: (component: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        return originalToast.custom(component, options);
      },
      promise: (promise: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return Promise.resolve();
        return originalToast.promise(promise, options);
      },
      dismiss: originalToast.dismiss,
      loading: (message: any, options?: any) => {
        const { doNotDisturb } = checkSettings();
        if (doNotDisturb) return;
        return originalToast.loading(message, options);
      },
    }
  );

  return wrappedToast;
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useUser();
  const { initializeSettings, setLoading } = useUserSettingsStore();
  
  // Initialize real-time notifications globally
  useRealtimeNotifications();
  
  // Load user settings on mount
  useEffect(() => {
    if (user?.id) {
      getUserSettingsAction().then((result) => {
        if (result.success && result.data) {
          initializeSettings(result.data);
        } else {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
    }
  }, [user?.id, initializeSettings, setLoading]);
  
  // Override global toast with our wrapper
  useEffect(() => {
    const wrappedToast = createToastWrapper();
    
    // Override the global toast
    Object.assign(sonnerToast, wrappedToast);
    
    // Cleanup: restore original toast on unmount
    return () => {
      Object.assign(sonnerToast, originalToast);
    };
  }, []);
  
  return <>{children}</>;
}