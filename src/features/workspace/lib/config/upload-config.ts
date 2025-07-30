/**
 * Workspace Upload Configuration
 * Centralized configuration for all upload-related rules and limits
 */

export const UPLOAD_CONFIG = {
  // Upload Processing
  batch: {
    size: 3, // Number of files uploaded simultaneously
    maxRetries: 3, // Maximum retry attempts per file
    retryDelays: [1000, 2000, 4000, 8000, 10000], // Exponential backoff in ms
  },

  // Rate Limiting
  rateLimit: {
    maxUploadsPerMinute: 10, // Maximum uploads per user per minute
    windowDuration: 60000, // Rate limit window in ms (1 minute)
  },

  // File Size Limits (per plan)
  fileSizeLimits: {
    free: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFileSizeMB: 50,
      storageLimit: 50 * 1024 * 1024 * 1024, // 50GB
      storageLimitGB: 50,
    },
    pro: {
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxFileSizeMB: 500,
      storageLimit: 500 * 1024 * 1024 * 1024, // 500GB
      storageLimitGB: 500,
    },
    business: {
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      maxFileSizeMB: 1024,
      storageLimit: -1, // Unlimited
      storageLimitGB: -1,
    },
  },

  // Security
  security: {
    maxTotalFileSize: 5 * 1024 * 1024 * 1024, // 5GB hard limit for all plans
    allowedFileTypes: [], // Empty = all types allowed
    blockedFileTypes: ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.app'],
  },

  // Cleanup Service
  cleanup: {
    partialUploadTimeout: 24 * 60 * 60 * 1000, // 24 hours
    orphanedFileCheckInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Background Processing
  background: {
    updateInterval: 5000, // Process queue every 5 seconds
    maxQueueSize: 1000, // Maximum pending updates
  },

  // UI Messages
  messages: {
    quotaWarning: {
      80: "You're getting close to your storage limit",
      90: "You're almost at your storage limit", 
      95: "Storage critically low - consider upgrading",
    },
    errors: {
      rateLimitExceeded: "Too many uploads. Please wait a moment and try again.",
      fileTooLarge: "File exceeds your plan's size limit",
      storageFull: "Storage limit reached. Upgrade to continue uploading.",
      uploadFailed: "Upload failed. We'll retry automatically.",
      networkError: "Connection issue detected. Retrying...",
    },
    success: {
      uploadComplete: "Upload complete",
      allUploadsComplete: "All files uploaded successfully",
    },
  },
} as const;

// Helper functions for easy access
export const getFileSizeLimit = (plan: 'free' | 'pro' | 'business') => {
  return UPLOAD_CONFIG.fileSizeLimits[plan].maxFileSize;
};

export const getStorageLimit = (plan: 'free' | 'pro' | 'business') => {
  return UPLOAD_CONFIG.fileSizeLimits[plan].storageLimit;
};

export const getQuotaMessage = (usagePercentage: number): string | null => {
  if (usagePercentage >= 95) return UPLOAD_CONFIG.messages.quotaWarning[95];
  if (usagePercentage >= 90) return UPLOAD_CONFIG.messages.quotaWarning[90];
  if (usagePercentage >= 80) return UPLOAD_CONFIG.messages.quotaWarning[80];
  return null;
};

// Format helpers
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatStorageLimit = (plan: 'free' | 'pro' | 'business'): string => {
  const limitGB = UPLOAD_CONFIG.fileSizeLimits[plan].storageLimitGB;
  return limitGB === -1 ? 'Unlimited' : `${limitGB}GB`;
};

// Export types
export type UploadPlan = keyof typeof UPLOAD_CONFIG.fileSizeLimits;
export type UploadConfig = typeof UPLOAD_CONFIG;