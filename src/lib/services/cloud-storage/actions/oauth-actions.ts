'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/database/connection';
import { users } from '@/lib/database/schemas';
import { eq } from 'drizzle-orm';
import type { 
  UserSettings, 
  CloudStorageSettings,
  CloudProviderSettings 
} from '@/lib/database/types/user-settings';
import { 
  getCloudStorageSettings
} from '@/lib/database/types/user-settings';

export type CloudProvider = 'google' | 'microsoft';

interface CloudStorageTokenResult {
  success: boolean;
  token?: string;
  expiresAt?: number | undefined;
  email?: string | undefined;
  needsConnection?: boolean;
  error?: string;
}

export interface CloudStorageConnectionStatus {
  google: CloudProviderSettings;
  microsoft: CloudProviderSettings;
}

/**
 * Get OAuth access token for cloud storage provider
 * Clerk automatically refreshes tokens when needed
 */
export async function getCloudStorageToken(
  provider: CloudProvider
): Promise<CloudStorageTokenResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = await clerkClient();
    
    // Get OAuth token from Clerk
    const oauthTokenResponse = await client.users.getUserOauthAccessToken(
      userId,
      provider
    );

    // Check if we have valid tokens in the response
    const tokens = oauthTokenResponse?.data;
    if (!tokens || tokens.length === 0 || !tokens[0]?.token) {
      return { 
        success: false, 
        needsConnection: true,
        error: 'Provider not connected. Please connect your account first.' 
      };
    }

    const tokenData = tokens[0];
    
    // Update user settings with connection status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length > 0 && user[0]) {
      const currentSettings = user[0].settings as UserSettings;
      const cloudStorage = getCloudStorageSettings(currentSettings);
      
      // Get user email from OAuth provider
      const userData = await client.users.getUser(userId);
      const providerAccount = userData.externalAccounts.find(
        account => account.provider === provider
      );

      const email = providerAccount?.emailAddress;
      
      // Create updated provider settings
      const updatedProviderSettings: CloudProviderSettings = {
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        ...(email && { email }),
      };

      // Update cloud storage settings
      const updatedCloudStorage: CloudStorageSettings = {
        ...cloudStorage,
        [provider]: updatedProviderSettings,
      };

      // Create complete updated settings
      const updatedSettings: UserSettings = {
        theme: currentSettings.theme || 'system',
        doNotDisturb: currentSettings.doNotDisturb || false,
        silentNotifications: currentSettings.silentNotifications || false,
        cloudStorage: updatedCloudStorage,
      };

      await db.update(users)
        .set({
          settings: updatedSettings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    return {
      success: true,
      token: tokenData.token || '',
      expiresAt: tokenData.expiresAt,
      email: undefined, // Email is stored in user settings, not from token
    };
  } catch (error) {
    console.error(`Failed to get ${provider} token:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to retrieve token' 
    };
  }
}

/**
 * Disconnect cloud storage provider
 */
export async function disconnectCloudStorage(
  provider: CloudProvider
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current user settings
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const currentSettings = user[0]?.settings as UserSettings;
    const cloudStorage = getCloudStorageSettings(currentSettings);
    
    // Update connection status
    const updatedProviderSettings: CloudProviderSettings = {
      connected: false,
      lastSyncedAt: null,
    };

    // Update cloud storage settings
    const updatedCloudStorage: CloudStorageSettings = {
      ...cloudStorage,
      [provider]: updatedProviderSettings,
    };

    // Create complete updated settings
    const updatedSettings: UserSettings = {
      theme: currentSettings?.theme || 'system',
      doNotDisturb: currentSettings?.doNotDisturb || false,
      silentNotifications: currentSettings?.silentNotifications || false,
      cloudStorage: updatedCloudStorage,
    };

    await db.update(users)
      .set({
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error(`Failed to disconnect ${provider}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to disconnect provider' 
    };
  }
}

/**
 * Get cloud storage connection status for current user
 */
export async function getCloudStorageStatus(): Promise<CloudStorageConnectionStatus | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) return null;

    const settings = user[0]?.settings as UserSettings | null;
    const cloudStorage = getCloudStorageSettings(settings);
    
    // Ensure both providers have default values
    const connectionStatus: CloudStorageConnectionStatus = {
      google: cloudStorage.google || { connected: false, lastSyncedAt: null },
      microsoft: cloudStorage.microsoft || { connected: false, lastSyncedAt: null },
    };

    return connectionStatus;
  } catch (error) {
    console.error('Failed to get cloud storage status:', error);
    return null;
  }
}

/**
 * Trigger OAuth connection flow for a provider
 * This will redirect the user to Clerk's OAuth flow
 */
export async function initiateCloudStorageConnection(
  provider: CloudProvider
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // The actual OAuth flow is handled by Clerk's components
    // This action just returns success to indicate the flow can proceed
    return { 
      success: true,
      // The redirect URL will be handled by Clerk's UserProfile component
    };
  } catch (error) {
    console.error(`Failed to initiate ${provider} connection:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate connection' 
    };
  }
}