// Upload Types for Foldly - Upload Flow and File Processing
// Feature-specific types for upload functionality
// Following 2025 TypeScript best practices with strict type safety

import type { ReactNode, DragEvent } from 'react';
import type {
  HexColor,
  EmailAddress,
  LinkId,
  FileId,
  FolderId,
  BatchId,
  UserId,
} from '@/types/ids';

import type { DeepReadonly, ValidationError, Result } from '@/types/utils';

import type { LinkType } from '@/features/links/types';

import type { FileProcessingStatus } from '@/features/files/types';

import type { UploadLink } from '@/features/links/types';

import type { Folder } from '@/features/files/types';

import type { UploadBatch } from './database';

// =============================================================================
// UPLOAD CONFIGURATION AND REQUIREMENTS
// =============================================================================

/**
 * Upload requirements configuration
 */
export interface UploadRequirements {
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly allowFolderCreation: boolean;
  readonly maxFiles: number;
  readonly maxFileSize: number; // bytes
  readonly allowedFileTypes?: string[]; // MIME types
  readonly customInstructions?: string;
} /**
 * Uploader information collected during upload
 */
export interface UploaderInfo {
  readonly name: string;
  readonly email?: EmailAddress | undefined;
  readonly message?: string | undefined;
  readonly batchName?: string | undefined;
}

// =============================================================================
// UPLOAD FLOW CONSTANTS
// =============================================================================

/**
 * Upload flow steps using const assertion
 */
export const UPLOAD_FLOW_STEP = {
  LINK_RESOLVE: 'link_resolve',
  PASSWORD: 'password',
  UPLOADER_INFO: 'uploader_info',
  FILE_SELECTION: 'file_selection',
  UPLOAD: 'upload',
  COMPLETE: 'complete',
} as const satisfies Record<string, string>;

export type UploadFlowStep =
  (typeof UPLOAD_FLOW_STEP)[keyof typeof UPLOAD_FLOW_STEP];

/**
 * Type guard for upload flow steps
 */
export const isValidUploadFlowStep = (
  step: unknown
): step is UploadFlowStep => {
  return (
    typeof step === 'string' &&
    Object.values(UPLOAD_FLOW_STEP).includes(step as UploadFlowStep)
  );
};

// Upload service types
export type UploadProgressCallback = (fileId: FileId, progress: number) => void;

export interface FileValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  fileSize: number;
  fileType: string;
  fileName: string;
}

export interface UploadServiceInterface {
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

  createUploadBatch(
    linkId: string,
    uploaderInfo?: any
  ): Promise<Result<BatchId, ValidationError>>;
  completeBatch(batchId: BatchId): Promise<Result<boolean, ValidationError>>;
  cancelBatch(batchId: BatchId): Promise<Result<boolean, ValidationError>>;

  getUploadProgress(
    batchId: BatchId
  ): Promise<Result<Record<FileId, number>, ValidationError>>;
}

export interface FileValidationInterface {
  validateFile(file: File, constraints?: FileConstraints): FileValidationResult;
  validateFiles(
    files: File[],
    constraints?: FileConstraints
  ): FileValidationResult[];
  checkFileSize(file: File, maxSize: number): boolean;
  checkFileType(file: File, allowedTypes: string[]): boolean;
  checkFileName(fileName: string): boolean;
}

export interface FileConstraints {
  maxFileSize?: number;
  allowedFileTypes?: string[];
  maxFiles?: number;
  allowDuplicates?: boolean;
}

// Export all upload types
export * from './database';
