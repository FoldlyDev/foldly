// Files Feature Types for Foldly - File Management and Processing
// Business domain types specific to file functionality
// Following 2025 TypeScript best practices with strict type safety

import type { FileId, FolderId, WorkspaceId, UserId, BatchId } from '@/types';
import type { Workspace } from '@/lib/database/types';

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
/**
 * Re-export canonical workspace type from single source of truth
 * @deprecated Use Workspace directly from @/lib/database/types instead
 */
export type WorkspaceData = Workspace;
export type FileType = string;
export type FileTreeNode = any; // Define based on your tree structure
export type FileTreeStats = any; // Define based on your stats structure

// =============================================================================
// FILES FEATURE - TREE AND COPY OPERATIONS
// =============================================================================

import type { Link } from '@/lib/database/types/links';

/**
 * Tree node structure for displaying files and folders
 */
export interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  path: string;
  size?: number;
  mimeType?: string;
  children?: TreeNode[];
  metadata?: {
    uploadedAt?: Date;
    uploaderName?: string;
    uploaderEmail?: string;
  };
}

/**
 * Link with its associated file tree structure
 */
export interface LinkWithFileTree extends Link {
  fileTree: TreeNode[];
  totalFiles: number;
  totalSize: number;
}

/**
 * Copy operation result
 */
export interface CopyResult {
  success: boolean;
  copiedFiles: number;
  copiedFolders: number;
  errors: Array<{
    fileId: string;
    fileName: string;
    error: string;
  }>;
  totalSize: number;
}

/**
 * Copy progress tracking
 */
export interface CopyProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'copying' | 'completed' | 'error';
  error?: string;
}

/**
 * UI State for files feature
 */
export interface FilesUIState {
  // Selection state
  selectedLinkId: string | null;
  selectedFiles: Set<string>;
  selectedFolders: Set<string>;
  
  // Copy operation state
  copyOperations: Map<string, CopyProgress>;
  isCopying: boolean;
  destinationFolderId: string | null;
  
  // UI state
  expandedLinks: Set<string>;
  searchQuery: string;
  viewMode: ViewMode;
  
  // Modal states
  isWorkspaceFolderPickerOpen: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTarget: { id: string; type: 'file' | 'folder' } | null;
}

/**
 * Context menu actions
 */
export type ContextMenuAction = 
  | 'copyToWorkspace'
  | 'moveToWorkspace'
  | 'viewDetails'
  | 'select'
  | 'expand'
  | 'collapse'
  | 'selectAll'
  | 'deselectAll';

/**
 * File operation permissions
 */
export interface FilePermissions {
  canCopy: boolean;
  canView: boolean;
  reason?: string;
}

/**
 * Workspace folder for picker
 */
export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  parentId: string | null;
  depth: number;
  hasChildren: boolean;
}

/**
 * Copy options
 */
export interface CopyOptions {
  maintainStructure: boolean;
  handleDuplicates: 'skip' | 'rename' | 'replace';
  notifyOnComplete: boolean;
}

// =============================================================================
// EXPORT ALL FILES TYPES
// =============================================================================

export * from './database';
export type * from './index';
