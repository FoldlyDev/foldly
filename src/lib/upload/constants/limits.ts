/**
 * Shared Upload Limits and Configuration
 * Common configuration used across all upload features
 */

// =============================================================================
// UPLOAD LIMITS
// =============================================================================

import { PLAN_CONFIGURATION, getPlanFileSizeLimit, getPlanStorageLimit } from '@/lib/config/plan-configuration';

/**
 * File size limits by subscription tier
 * These values are synchronized with the centralized plan configuration
 * 
 * @deprecated Import from @/lib/config/plan-configuration instead
 * This export is maintained for backward compatibility only
 */
export const FILE_SIZE_LIMITS = {
  free: {
    maxFileSize: getPlanFileSizeLimit('free'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.free.max_file_size_mb,
    storageLimit: getPlanStorageLimit('free'),
    storageLimitGB: PLAN_CONFIGURATION.plans.free.storage_limit_gb,
  },
  pro: {
    maxFileSize: getPlanFileSizeLimit('pro'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.pro.max_file_size_mb,
    storageLimit: getPlanStorageLimit('pro'),
    storageLimitGB: PLAN_CONFIGURATION.plans.pro.storage_limit_gb,
  },
  business: {
    maxFileSize: getPlanFileSizeLimit('business'),
    maxFileSizeMB: PLAN_CONFIGURATION.plans.business.max_file_size_mb,
    storageLimit: getPlanStorageLimit('business'),
    storageLimitGB: PLAN_CONFIGURATION.plans.business.storage_limit_gb,
  },
} as const;

/**
 * Upload processing configuration
 */
export const UPLOAD_PROCESSING = {
  batch: {
    size: 3, // Number of files uploaded simultaneously
    maxRetries: 3, // Maximum retry attempts per file
    retryDelays: [1000, 2000, 4000, 8000, 10000], // Exponential backoff in ms
    maxFilesPerUpload: 50, // Maximum number of files in a single upload batch
  },
  rateLimit: {
    maxUploadsPerMinute: 10, // Maximum uploads per user per minute
    windowDuration: 60000, // Rate limit window in ms (1 minute)
  },
  timeout: {
    upload: 300000, // 5 minutes per file
    processing: 60000, // 1 minute for post-processing
  },
} as const;

/**
 * Security configuration
 */
export const UPLOAD_SECURITY = {
  maxTotalFileSize: getPlanFileSizeLimit('business'), // System max = Business plan limit (25GB)
  blockedFileTypes: ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.app', '.com', '.pif'],
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  allowedVideoTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  allowedAudioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  maxFileNameLength: 255,
  virusScanSizeLimit: 100 * 1024 * 1024, // 100MB - files larger skip virus scan
} as const;

/**
 * Link upload specific limits
 */
export const LINK_UPLOAD_LIMITS = {
  defaultMaxFiles: 100,
  defaultMaxFileSize: 100 * 1024 * 1024, // 100MB
  defaultExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  maxExpiry: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
  nearExpiryWarning: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

/**
 * Storage organization
 */
export const STORAGE_ORGANIZATION = {
  thumbnailSizes: {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  },
  categories: [
    'images',
    'videos',
    'audio',
    'documents',
    'archives',
    'code',
    'other',
  ] as const,
} as const;

/**
 * Upload states and statuses
 */
export const UPLOAD_STATUS = {
  PENDING: 'pending',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const BATCH_STATUS = {
  CREATED: 'created',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
} as const;

/**
 * Error codes
 */
export const UPLOAD_ERROR_CODES = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  STORAGE_FULL: 'STORAGE_FULL',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  INVALID_FILE_NAME: 'INVALID_FILE_NAME',
  DUPLICATE_FILE: 'DUPLICATE_FILE',
  LINK_EXPIRED: 'LINK_EXPIRED',
  LINK_FULL: 'LINK_FULL',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
} as const;

// =============================================================================
// UI MESSAGES
// =============================================================================

export const UPLOAD_MESSAGES = {
  quotaWarning: {
    80: "You're getting close to your storage limit",
    90: "You're almost at your storage limit",
    95: "Storage critically low - consider upgrading",
  },
  errors: {
    [UPLOAD_ERROR_CODES.FILE_TOO_LARGE]: "File exceeds your plan's size limit",
    [UPLOAD_ERROR_CODES.INVALID_FILE_TYPE]: "This file type is not allowed",
    [UPLOAD_ERROR_CODES.STORAGE_FULL]: "Storage limit reached. Upgrade to continue uploading.",
    [UPLOAD_ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Too many uploads. Please wait a moment and try again.",
    [UPLOAD_ERROR_CODES.UPLOAD_FAILED]: "Upload failed. We'll retry automatically.",
    [UPLOAD_ERROR_CODES.NETWORK_ERROR]: "Connection issue detected. Retrying...",
    [UPLOAD_ERROR_CODES.VIRUS_DETECTED]: "This file has been flagged as potentially harmful.",
    [UPLOAD_ERROR_CODES.INVALID_FILE_NAME]: "File name contains invalid characters.",
    [UPLOAD_ERROR_CODES.DUPLICATE_FILE]: "This file has already been uploaded.",
    [UPLOAD_ERROR_CODES.LINK_EXPIRED]: "This upload link has expired.",
    [UPLOAD_ERROR_CODES.LINK_FULL]: "This upload link has reached its file limit.",
    [UPLOAD_ERROR_CODES.UNAUTHORIZED]: "You don't have permission to upload here.",
    [UPLOAD_ERROR_CODES.INVALID_PASSWORD]: "Invalid password provided.",
  },
  success: {
    uploadComplete: "Upload complete",
    allUploadsComplete: "All files uploaded successfully",
    batchCreated: "Upload batch created",
    fileProcessed: "File processed successfully",
  },
  info: {
    uploadingFile: "Uploading file...",
    processingFile: "Processing file...",
    generatingThumbnail: "Generating preview...",
    scanningFile: "Scanning file for security...",
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type UploadPlan = keyof typeof FILE_SIZE_LIMITS;
export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];
export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];
export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES];
export type FileCategory = (typeof STORAGE_ORGANIZATION.categories)[number];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get file size limit for a subscription plan
 */
export function getFileSizeLimit(plan: UploadPlan): number {
  return FILE_SIZE_LIMITS[plan].maxFileSize;
}

/**
 * Get storage limit for a subscription plan
 */
export function getStorageLimit(plan: UploadPlan): number {
  return FILE_SIZE_LIMITS[plan].storageLimit;
}

/**
 * Get quota warning message based on usage percentage
 */
export function getQuotaMessage(usagePercentage: number): string | null {
  if (usagePercentage >= 95) return UPLOAD_MESSAGES.quotaWarning[95];
  if (usagePercentage >= 90) return UPLOAD_MESSAGES.quotaWarning[90];
  if (usagePercentage >= 80) return UPLOAD_MESSAGES.quotaWarning[80];
  return null;
}

/**
 * Format storage limit for display
 */
export function formatStorageLimit(plan: UploadPlan): string {
  const limitGB = FILE_SIZE_LIMITS[plan].storageLimitGB;
  // Business plan has 2048GB, not unlimited
  return `${limitGB}GB`;
}

/**
 * Check if file type is blocked
 */
export function isBlockedFileType(fileName: string): boolean {
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  return UPLOAD_SECURITY.blockedFileTypes.includes(extension as any);
}

/**
 * Get retry delay for attempt number
 */
export function getRetryDelay(attempt: number): number {
  const delays = UPLOAD_PROCESSING.batch.retryDelays;
  return delays[Math.min(attempt, delays.length - 1)] || 0;
}