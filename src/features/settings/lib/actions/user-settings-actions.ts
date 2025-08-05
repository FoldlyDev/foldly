/**
 * User Settings Server Actions
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { userSettingsService, type ThemeMode } from '@/lib/services/settings/user-settings-service';
import { revalidatePath } from 'next/cache';

/**
 * Get current user's settings
 */
export async function getUserSettingsAction() {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  return userSettingsService.getUserSettings(userId);
}

/**
 * Update user theme preference
 */
export async function updateThemeAction(theme: ThemeMode) {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const result = await userSettingsService.updateTheme(userId, theme);
  
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
  }
  
  return result;
}

/**
 * Update do not disturb setting
 */
export async function updateDoNotDisturbAction(enabled: boolean) {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const result = await userSettingsService.updateDoNotDisturb(userId, enabled);
  
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
  }
  
  return result;
}

/**
 * Update silent notifications setting
 */
export async function updateSilentNotificationsAction(enabled: boolean) {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const result = await userSettingsService.updateSilentNotifications(userId, enabled);
  
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
  }
  
  return result;
}

/**
 * Update multiple settings at once
 */
export async function updateUserSettingsAction(settings: {
  theme?: ThemeMode;
  doNotDisturb?: boolean;
  silentNotifications?: boolean;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    return {
      success: false,
      error: 'Unauthorized',
    };
  }

  const result = await userSettingsService.updateUserSettings(userId, settings);
  
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/workspace');
  }
  
  return result;
}