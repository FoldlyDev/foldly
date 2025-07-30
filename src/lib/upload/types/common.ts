/**
 * Common Upload Types
 * Shared types used across upload features
 */

import type { FileId, BatchId, UserId, LinkId, WorkspaceId, FolderId } from '@/types/ids';
import type { ValidationError } from '@/types/utils';
import type { UploadStatus, BatchStatus, FileCategory } from '../constants/limits';

// =============================================================================
// FILE TYPES
// =============================================================================

/**
 * File upload metadata
 */
export interface UploadFile {
  id: FileId;
  batchId: BatchId;
  originalName: string;
  safeName: string;
  size: number;
  type: string;
  category: FileCategory;
  status: UploadStatus;
  progress: number;
  uploadedAt?: Date;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  storagePath?: string;
  thumbnailPath?: string;
  publicUrl?: string;
}

/**
 * Upload batch metadata
 */
export interface UploadBatch {
  id: BatchId;
  userId: UserId;
  status: BatchStatus;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// =============================================================================
// UPLOAD CONTEXTS
// =============================================================================

/**
 * Link upload context
 */
export interface LinkUploadContext {
  type: 'link';
  linkId: LinkId;
  uploaderName: string;
  uploaderEmail?: string;
  message?: string;
  password?: string;
}

/**
 * Workspace upload context
 */
export interface WorkspaceUploadContext {
  type: 'workspace';
  workspaceId: WorkspaceId;
  folderId?: FolderId;
  userId: UserId;
}

/**
 * Union type for upload contexts
 */
export type UploadContext = LinkUploadContext | WorkspaceUploadContext;

// =============================================================================
// UPLOAD EVENTS
// =============================================================================

/**
 * Upload progress event
 */
export interface UploadProgressEvent {
  fileId: FileId;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  speed?: number; // bytes per second
  remainingTime?: number; // seconds
}

/**
 * Upload state change event
 */
export interface UploadStateEvent {
  fileId: FileId;
  previousStatus: UploadStatus;
  newStatus: UploadStatus;
  error?: string;
}

/**
 * Batch state change event
 */
export interface BatchStateEvent {
  batchId: BatchId;
  previousStatus: BatchStatus;
  newStatus: BatchStatus;
  completedFiles: number;
  totalFiles: number;
}

// =============================================================================
// UPLOAD OPTIONS
// =============================================================================

/**
 * File upload options
 */
export interface FileUploadOptions {
  onProgress?: (event: UploadProgressEvent) => void;
  onStateChange?: (event: UploadStateEvent) => void;
  generateThumbnail?: boolean;
  scanForVirus?: boolean;
  detectDuplicates?: boolean;
  preserveMetadata?: boolean;
}

/**
 * Batch upload options
 */
export interface BatchUploadOptions extends FileUploadOptions {
  onBatchProgress?: (event: BatchStateEvent) => void;
  parallelUploads?: number;
  continueOnError?: boolean;
}

// =============================================================================
// UPLOAD RESULTS
// =============================================================================

/**
 * Single file upload result
 */
export interface FileUploadResult {
  success: boolean;
  fileId?: FileId;
  file?: UploadFile;
  error?: ValidationError;
  duration?: number;
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  success: boolean;
  batchId: BatchId;
  batch: UploadBatch;
  files: UploadFile[];
  errors: Array<{ fileId: FileId; error: ValidationError }>;
  duration: number;
}

// =============================================================================
// UPLOAD CONSTRAINTS
// =============================================================================

/**
 * Upload constraints for validation
 */
export interface UploadConstraints {
  maxFileSize: number;
  maxTotalSize?: number;
  maxFiles?: number;
  allowedFileTypes?: string[];
  blockedFileTypes?: string[];
  requireAuth?: boolean;
  requirePassword?: boolean;
  expiresAt?: Date;
}

// =============================================================================
// CALLBACKS AND HANDLERS
// =============================================================================

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (event: UploadProgressEvent) => void;

/**
 * Upload completion callback
 */
export type UploadCompleteCallback = (result: FileUploadResult) => void;

/**
 * Upload error callback
 */
export type UploadErrorCallback = (error: ValidationError, fileId?: FileId) => void;

/**
 * Batch completion callback
 */
export type BatchCompleteCallback = (result: BatchUploadResult) => void;

// =============================================================================
// UPLOAD SERVICE INTERFACES
// =============================================================================

/**
 * Upload service interface
 */
export interface UploadService {
  uploadFile(
    file: File,
    context: UploadContext,
    options?: FileUploadOptions
  ): Promise<FileUploadResult>;

  uploadBatch(
    files: File[],
    context: UploadContext,
    options?: BatchUploadOptions
  ): Promise<BatchUploadResult>;

  cancelUpload(fileId: FileId): Promise<boolean>;

  cancelBatch(batchId: BatchId): Promise<boolean>;

  retryUpload(fileId: FileId): Promise<FileUploadResult>;

  getUploadProgress(fileId: FileId): Promise<number>;

  getBatchProgress(batchId: BatchId): Promise<{
    progress: number;
    completedFiles: number;
    totalFiles: number;
  }>;
}

/**
 * Upload storage interface
 */
export interface UploadStorage {
  store(file: File, path: string): Promise<string>;
  delete(path: string): Promise<boolean>;
  exists(path: string): Promise<boolean>;
  getUrl(path: string): Promise<string>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
}