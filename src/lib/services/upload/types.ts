/**
 * Upload Service Type Definitions
 * Core types for the unified upload service
 */

// =============================================================================
// UPLOAD CONTEXT TYPES
// =============================================================================

/**
 * Workspace upload context
 */
export interface WorkspaceUploadContext {
  type: 'workspace';
  workspaceId: string;
  folderId?: string;
  userId: string;
}

/**
 * Link upload context
 */
export interface LinkUploadContext {
  type: 'link';
  linkId: string;
  folderId?: string;
  uploaderName: string;
  uploaderEmail?: string;
  message?: string;
  password?: string;
}

/**
 * Union type for all upload contexts
 */
export type UploadContext = WorkspaceUploadContext | LinkUploadContext;

// =============================================================================
// UPLOAD STATUS TYPES
// =============================================================================

export type UploadStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled';

export type BatchStatus =
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed';

// =============================================================================
// UPLOAD HANDLE TYPES
// =============================================================================

/**
 * Internal upload handle for tracking active uploads
 */
export interface UploadHandle {
  id: string;
  file: File;
  context: UploadContext;
  controller: AbortController;
  xhr?: XMLHttpRequest;
  progress: number;
  status: UploadStatus;
  startTime: number;
  endTime?: number;
  retryCount: number;
  maxRetries: number;
  error?: string;
  result?: UploadResult;
}

// =============================================================================
// UPLOAD RESULT TYPES
// =============================================================================

/**
 * Result of a successful upload
 */
export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  storagePath?: string;
  publicUrl?: string;
  error?: string;
  errorCode?: string;
  storageInfo?: {
    usagePercentage: number;
    remainingBytes: number;
    shouldShowWarning: boolean;
  };
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  batchId: string;
  totalFiles: number;
  successCount: number;
  failedCount: number;
  results: UploadResult[];
  duration: number;
}

// =============================================================================
// UPLOAD PROGRESS TYPES
// =============================================================================

/**
 * Upload progress event data
 */
export interface UploadProgressEvent {
  uploadId: string;
  fileId?: string;
  fileName: string;
  progress: number; // 0-100
  loaded: number;   // bytes uploaded
  total: number;    // total bytes
  speed?: number;   // bytes per second
  remainingTime?: number; // seconds
}

/**
 * Upload state change event
 */
export interface UploadStateEvent {
  uploadId: string;
  previousStatus: UploadStatus;
  newStatus: UploadStatus;
  error?: string;
}

// =============================================================================
// UPLOAD OPTIONS TYPES
// =============================================================================

/**
 * Options for configuring upload behavior
 */
export interface UploadOptions {
  // Progress callbacks
  onProgress?: (event: UploadProgressEvent) => void;
  onStateChange?: (event: UploadStateEvent) => void;
  onComplete?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  
  // Retry configuration
  maxRetries?: number;
  retryDelays?: number[]; // milliseconds between retries
  
  // Upload configuration
  generateThumbnail?: boolean;
  preserveMetadata?: boolean;
  validateBeforeUpload?: boolean;
  
  // Security and tracking
  clientIp?: string; // Client IP for quota checking and security
  
  // Validation
  maxFileSize?: number;
  allowedTypes?: string[];
  blockedTypes?: string[];
  
  // Performance
  chunkSize?: number; // For future chunked uploads
  timeout?: number;   // Upload timeout in milliseconds
}

/**
 * Batch upload options
 */
export interface BatchUploadOptions extends UploadOptions {
  parallelUploads?: number;
  continueOnError?: boolean;
  onBatchProgress?: (completed: number, total: number) => void;
}

// =============================================================================
// UPLOAD CONFIGURATION TYPES
// =============================================================================

/**
 * Upload service configuration
 */
export interface UploadConfig {
  maxConcurrentUploads: number;
  defaultTimeout: number;
  maxRetries: number;
  retryDelays: number[];
  maxFileSize: number;
  allowedFileTypes?: string[];
  blockedFileTypes?: string[];
  enableLogging: boolean;
  enableAnalytics: boolean;
}

// =============================================================================
// UPLOAD VALIDATION TYPES
// =============================================================================

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// =============================================================================
// UPLOAD METRICS TYPES
// =============================================================================

/**
 * Upload performance metrics
 */
export interface UploadMetrics {
  uploadId: string;
  fileName: string;
  fileSize: number;
  duration: number;
  averageSpeed: number;
  peakSpeed: number;
  retryCount: number;
  status: UploadStatus;
  timestamp: number;
}

/**
 * Aggregate upload statistics
 */
export interface UploadStatistics {
  totalUploads: number;
  successCount: number;
  failureCount: number;
  cancelledCount: number;
  totalBytes: number;
  averageDuration: number;
  averageSpeed: number;
  activeUploads: number;
}

// =============================================================================
// STORAGE TYPES
// =============================================================================

/**
 * Storage validation result
 */
export interface StorageValidationResult {
  canUpload: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  remainingSpace: number;
  percentageUsed: number;
  suggestedAction?: string;
}

/**
 * Storage quota information
 */
export interface StorageQuota {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  planKey: string;
  nearLimit: boolean;
  exceeded: boolean;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Custom upload error class
 */
export class UploadError extends Error {
  constructor(
    message: string,
    public code: string,
    public uploadId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

/**
 * Error codes for upload operations
 */
export enum UploadErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  
  // Validation errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Processing errors
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // User errors
  CANCELLED = 'CANCELLED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Type guard for workspace context
 */
export function isWorkspaceContext(context: UploadContext): context is WorkspaceUploadContext {
  return context.type === 'workspace';
}

/**
 * Type guard for link context
 */
export function isLinkContext(context: UploadContext): context is LinkUploadContext {
  return context.type === 'link';
}

/**
 * Type guard for upload error
 */
export function isUploadError(error: any): error is UploadError {
  return error instanceof UploadError;
}