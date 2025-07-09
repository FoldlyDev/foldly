// Files Feature Types for Foldly - File Management and Processing
// Business domain types specific to file functionality
// Following 2025 TypeScript best practices with strict type safety

import type { FileId, FolderId, WorkspaceId, UserId, BatchId } from '@/types';

// =============================================================================
// LOCAL TYPE DEFINITIONS
// =============================================================================

/**
 * View mode options for displaying files
 */
export type ViewMode = 'grid' | 'list' | 'card';

// =============================================================================
// FILE PROCESSING CONSTANTS
// =============================================================================

/**
 * File processing states
 */
export const FILE_PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUARANTINED: 'quarantined',
} as const satisfies Record<string, string>;

export type FileProcessingStatus =
  (typeof FILE_PROCESSING_STATUS)[keyof typeof FILE_PROCESSING_STATUS];

/**
 * Upload batch states
 */
export const BATCH_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const satisfies Record<string, string>;

export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];
/**
 * File classification levels for security
 */
export const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const satisfies Record<string, string>;

export type DataClassification =
  (typeof DATA_CLASSIFICATION)[keyof typeof DATA_CLASSIFICATION];

/**
 * File-specific error codes
 */
export const FILE_ERROR_CODE = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  MALWARE_DETECTED: 'MALWARE_DETECTED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
} as const satisfies Record<string, string>;

export type FileErrorCode =
  (typeof FILE_ERROR_CODE)[keyof typeof FILE_ERROR_CODE];

// =============================================================================
// FILE METADATA AND SECURITY
// =============================================================================

/**
 * Core file metadata structure
 */
export interface FileMetadata {
  readonly fileName: string;
  readonly originalFileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly mimeType: string;
  readonly md5Hash?: string;
  readonly sha256Hash?: string;
} /**
 * Security warning information for files
 */
export interface SecurityWarning {
  readonly type: 'file_type' | 'size' | 'malware' | 'suspicious_content';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly recommendation?: string;
}

/**
 * Enhanced branded type for validated batch status
 */
export type ValidatedBatchStatus = BatchStatus & {
  readonly __brand: 'ValidatedBatchStatus';
};

// =============================================================================
// TYPE GUARDS FOR FILES
// =============================================================================

export const isValidFileProcessingStatus = (
  status: unknown
): status is FileProcessingStatus => {
  return (
    typeof status === 'string' &&
    Object.values(FILE_PROCESSING_STATUS).includes(
      status as FileProcessingStatus
    )
  );
};

export const isValidBatchStatus = (
  status: unknown
): status is ValidatedBatchStatus => {
  return (
    typeof status === 'string' &&
    Object.values(BATCH_STATUS).includes(status as BatchStatus)
  );
};

export const isValidDataClassification = (
  classification: unknown
): classification is DataClassification => {
  return (
    typeof classification === 'string' &&
    Object.values(DATA_CLASSIFICATION).includes(
      classification as DataClassification
    )
  );
};

// =============================================================================
// ADDITIONAL TYPE ALIASES FOR COMPATIBILITY
// =============================================================================

/**
 * Type aliases for backwards compatibility and easier usage
 */
export type { FileData, FolderData } from './database';
export type WorkspaceData = any; // Define based on your workspace structure
export type FileType = string;
export type FileTreeNode = any; // Define based on your tree structure
export type FileTreeStats = any; // Define based on your stats structure

// =============================================================================
// EXPORT ALL FILES TYPES
// =============================================================================

export * from './database';
export type * from './index';
