// Upload Service Types
// Interfaces for upload feature services

import type {
  FileId,
  BatchId,
  ValidationError,
  Result,
  FileProcessingStatus,
} from '@/types';

/**
 * Upload progress callback function
 */
export type UploadProgressCallback = (fileId: FileId, progress: number) => void;

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fileSize: number;
  fileType: string;
  fileName: string;
}

/**
 * Upload service interface
 */
export interface UploadServiceInterface {
  // File upload operations
  uploadFile(
    file: File,
    batchId: BatchId,
    onProgress?: UploadProgressCallback
  ): Promise<Result<FileId, ValidationError>>;

  uploadBatch(
    files: File[],
    batchId: BatchId,
    onProgress?: UploadProgressCallback
  ): Promise<Result<FileId[], ValidationError>>;

  // Batch management
  createUploadBatch(
    linkId: string,
    uploaderInfo?: any
  ): Promise<Result<BatchId, ValidationError>>;
  completeBatch(batchId: BatchId): Promise<Result<boolean, ValidationError>>;
  cancelBatch(batchId: BatchId): Promise<Result<boolean, ValidationError>>;

  // Progress tracking
  getUploadProgress(
    batchId: BatchId
  ): Promise<Result<Record<FileId, number>, ValidationError>>;
}

/**
 * File validation service interface
 */
export interface FileValidationInterface {
  // Single file validation
  validateFile(file: File, constraints?: FileConstraints): FileValidationResult;

  // Batch validation
  validateFiles(
    files: File[],
    constraints?: FileConstraints
  ): FileValidationResult[];

  // Constraint checking
  checkFileSize(file: File, maxSize: number): boolean;
  checkFileType(file: File, allowedTypes: string[]): boolean;
  checkFileName(fileName: string): boolean;
}

/**
 * File upload constraints
 */
export interface FileConstraints {
  maxFileSize?: number; // bytes
  allowedFileTypes?: string[];
  maxFiles?: number;
  allowDuplicates?: boolean;
}
