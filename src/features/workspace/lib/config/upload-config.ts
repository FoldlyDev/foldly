/**
 * Workspace Upload Configuration
 * Extends shared upload configuration with workspace-specific settings
 */

import {
  FILE_SIZE_LIMITS,
  UPLOAD_PROCESSING,
  UPLOAD_SECURITY,
  UPLOAD_MESSAGES,
  UPLOAD_ERROR_CODES,
  getFileSizeLimit,
  getStorageLimit,
  getQuotaMessage,
  formatStorageLimit,
} from '@/lib/upload/constants/limits';

// Re-export shared constants for backward compatibility
export { formatFileSize } from '@/lib/upload/utils/file-validation';

export const UPLOAD_CONFIG = {
  // Use shared upload processing config
  batch: {
    ...UPLOAD_PROCESSING.batch,
    maxFilesPerUpload: UPLOAD_PROCESSING.batch.maxFilesPerUpload,
  },
  rateLimit: UPLOAD_PROCESSING.rateLimit,
  
  // Use shared file size limits
  fileSizeLimits: FILE_SIZE_LIMITS,
  
  // Use shared security config
  security: UPLOAD_SECURITY,

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

  // Use shared messages with backward compatibility mapping
  messages: {
    quotaWarning: UPLOAD_MESSAGES.quotaWarning,
    errors: {
      rateLimitExceeded: UPLOAD_MESSAGES.errors.RATE_LIMIT_EXCEEDED,
      fileTooLarge: UPLOAD_MESSAGES.errors.FILE_TOO_LARGE,
      storageFull: UPLOAD_MESSAGES.errors.STORAGE_FULL,
      uploadFailed: UPLOAD_MESSAGES.errors.UPLOAD_FAILED,
      networkError: UPLOAD_MESSAGES.errors.NETWORK_ERROR,
    },
    success: UPLOAD_MESSAGES.success,
  },
} as const;

// Re-export shared helper functions
export { getFileSizeLimit, getStorageLimit, getQuotaMessage, formatStorageLimit };

// Export types
export type { UploadPlan } from '@/lib/upload/constants/limits';
export type UploadConfig = typeof UPLOAD_CONFIG;