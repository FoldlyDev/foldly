/**
 * User Settings Service - Database operations for user preferences
 */

import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq, sql } from 'drizzle-orm';
import type { DatabaseResult } from '@/lib/database/types/common';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  doNotDisturb: boolean;
  silentNotifications: boolean;
  [key: string]: any; // Allow for future settings
}

export class UserSettingsService {
  /**
   * Get user settings from database
   */
  async getUserSettings(userId: string): Promise<DatabaseResult<UserSettings>> {
    try {
      const [user] = await db
        .select({
          settings: users.settings,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Ensure we have all required settings with defaults
      const defaultSettings: UserSettings = {
        theme: 'system',
        doNotDisturb: false,
        silentNotifications: false,
      };

      return {
        success: true,
        data: {
          ...defaultSettings,
          ...user.settings,
        } as UserSettings,
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return {
        success: false,
        error: 'Failed to fetch user settings',
      };
    }
  }

  /**
   * Update user settings in database
   */
  async updateUserSettings(
    userId: string,
    updates: Partial<UserSettings>
  ): Promise<DatabaseResult<UserSettings>> {
    try {
      // First get current settings
      const currentResult = await this.getUserSettings(userId);
      if (!currentResult.success || !currentResult.data) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Merge with existing settings
      const newSettings = {
        ...currentResult.data,
        ...updates,
      };

      // Update in database
      const [updated] = await db
        .update(users)
        .set({
          settings: newSettings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          settings: users.settings,
        });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update settings',
        };
      }

      return {
        success: true,
        data: updated.settings as UserSettings,
      };
    } catch (error) {
      console.error('Error updating user settings:', error);
      return {
        success: false,
        error: 'Failed to update user settings',
      };
    }
  }

  /**
   * Update theme preference
   */
  async updateTheme(
    userId: string,
    theme: ThemeMode
  ): Promise<DatabaseResult<void>> {
    const result = await this.updateUserSettings(userId, { theme });
    return { success: result.success, data: undefined, error: result.error };
  }

  /**
   * Update do not disturb setting
   */
  async updateDoNotDisturb(
    userId: string,
    enabled: boolean
  ): Promise<DatabaseResult<void>> {
    const result = await this.updateUserSettings(userId, { doNotDisturb: enabled });
    return { success: result.success, data: undefined, error: result.error };
  }

  /**
   * Update silent notifications setting
   */
  async updateSilentNotifications(
    userId: string,
    enabled: boolean
  ): Promise<DatabaseResult<void>> {
    const result = await this.updateUserSettings(userId, { silentNotifications: enabled });
    return { success: result.success, data: undefined, error: result.error };
  }

  /**
   * Update a specific setting by key
   */
  async updateSetting(
    userId: string,
    key: string,
    value: any
  ): Promise<DatabaseResult<void>> {
    const result = await this.updateUserSettings(userId, { [key]: value });
    return { success: result.success, data: undefined, error: result.error };
  }
}

// Export singleton instance
export const userSettingsService = new UserSettingsService();