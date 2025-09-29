// User Settings Type Definitions

export interface CloudProviderSettings {
  connected: boolean;
  lastSyncedAt: string | null;
  email?: string;
}

export interface CloudStorageSettings {
  google?: CloudProviderSettings;
  microsoft?: CloudProviderSettings;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  doNotDisturb: boolean;
  silentNotifications: boolean;
  cloudStorage?: CloudStorageSettings;
  [key: string]: any; // Allow future settings while maintaining type safety for known properties
}

// Type guard to check if settings has cloudStorage
export function hasCloudStorage(settings: UserSettings): settings is UserSettings & { cloudStorage: CloudStorageSettings } {
  return settings.cloudStorage !== undefined;
}

// Helper to get cloud storage settings with defaults
export function getCloudStorageSettings(settings: UserSettings | null | undefined): CloudStorageSettings {
  if (!settings?.cloudStorage) {
    return {
      google: { connected: false, lastSyncedAt: null },
      microsoft: { connected: false, lastSyncedAt: null },
    };
  }
  return settings.cloudStorage;
}

// Helper to get provider settings with defaults
export function getProviderSettings(
  settings: UserSettings | null | undefined, 
  provider: 'google' | 'microsoft'
): CloudProviderSettings {
  const cloudStorage = getCloudStorageSettings(settings);
  return cloudStorage[provider] || { connected: false, lastSyncedAt: null };
}