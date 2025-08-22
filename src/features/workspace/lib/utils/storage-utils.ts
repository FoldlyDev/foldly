// =============================================================================
// CLIENT-SAFE STORAGE UTILITIES
// =============================================================================
// 🎯 Client-side utilities for storage operations that don't access database
// ✅ Safe to import in client components

/**
 * Format bytes to human-readable format
 * Client-safe utility function that doesn't access database
 */
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Calculate usage percentage
 */
export const calculateUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min(100, (used / limit) * 100);
};

/**
 * Get storage quota status based on usage percentage
 */
export interface StorageQuotaStatus {
  status: 'safe' | 'warning' | 'critical' | 'exceeded';
  percentage: number;
  message: string;
}

export const getStorageQuotaStatus = (usagePercentage: number): StorageQuotaStatus => {
  if (usagePercentage >= 100) {
    return {
      status: 'exceeded',
      percentage: usagePercentage,
      message: 'Storage limit exceeded',
    };
  } else if (usagePercentage >= 95) {
    return {
      status: 'critical',
      percentage: usagePercentage,
      message: 'Storage almost full',
    };
  } else if (usagePercentage >= 80) {
    return {
      status: 'warning',
      percentage: usagePercentage,
      message: 'Storage getting full',
    };
  } else {
    return {
      status: 'safe',
      percentage: usagePercentage,
      message: 'Storage usage normal',
    };
  }
};

/**
 * Check if storage warning should be shown
 */
export const shouldShowStorageWarning = (usagePercentage: number): boolean => {
  return usagePercentage >= 80;
};

/**
 * Client-side storage validation (basic checks only)
 * For full validation, use server actions
 */
export const validateFileSizeClient = (fileSize: number, maxSize: number): {
  valid: boolean;
  reason?: string;
} => {
  if (fileSize === 0) {
    return {
      valid: false,
      reason: 'File is empty',
    };
  }

  if (fileSize > maxSize) {
    return {
      valid: false,
      reason: `File size (${formatBytes(fileSize)}) exceeds maximum allowed size (${formatBytes(maxSize)})`,
    };
  }

  return { valid: true };
};

/**
 * Validate file type (client-side check)
 */
export const validateFileTypeClient = (fileName: string, allowedTypes?: string[]): {
  valid: boolean;
  reason?: string;
} => {
  if (!allowedTypes || allowedTypes.length === 0) {
    return { valid: true }; // No restrictions
  }

  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) {
    return {
      valid: false,
      reason: 'File has no extension',
    };
  }

  if (!allowedTypes.includes(extension)) {
    return {
      valid: false,
      reason: `File type .${extension} is not allowed`,
    };
  }

  return { valid: true };
};