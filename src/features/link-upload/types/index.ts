// Link Upload Types for Foldly
// Feature-specific types for link-based upload functionality
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

// Re-export shared upload types
export type {
  FileValidationResult,
  FileConstraints,
  UploadProgressCallback,
  UploadProgressEvent,
  UploadStateEvent,
  BatchStateEvent,
  FileUploadOptions,
  BatchUploadOptions,
  FileUploadResult,
  BatchUploadResult,
  UploadConstraints,
} from '@/lib/upload/types/common';

// =============================================================================
// LINK UPLOAD SPECIFIC TYPES
// =============================================================================

/**
 * Link upload requirements configuration
 */
export interface LinkUploadRequirements {
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly allowFolderCreation: boolean;
  readonly maxFiles: number;
  readonly maxFileSize: number; // bytes
  readonly allowedFileTypes?: string[]; // MIME types
  readonly customInstructions?: string;
  readonly expiresAt?: Date;
}

/**
 * Uploader information collected during link upload
 */
export interface UploaderInfo {
  readonly name: string;
  readonly email?: EmailAddress | undefined;
  readonly message?: string | undefined;
  readonly batchName?: string | undefined;
}

// =============================================================================
// LINK UPLOAD FLOW TYPES
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

// =============================================================================
// LINK UPLOAD SERVICE INTERFACES
// =============================================================================

/**
 * Link upload service interface
 */
export interface LinkUploadServiceInterface {
  uploadFile(
    file: File,
    linkId: LinkId,
    uploaderInfo: UploaderInfo,
    folderId?: FolderId,
    password?: string,
    onProgress?: UploadProgressCallback
  ): Promise<Result<FileId, ValidationError>>;

  uploadBatch(
    files: File[],
    linkId: LinkId,
    uploaderInfo: UploaderInfo,
    folderId?: FolderId,
    password?: string,
    onProgress?: UploadProgressCallback
  ): Promise<Result<FileId[], ValidationError>>;

  validateLink(
    linkId: LinkId,
    password?: string
  ): Promise<Result<LinkUploadRequirements, ValidationError>>;

  createUploadBatch(
    linkId: LinkId,
    uploaderInfo: UploaderInfo
  ): Promise<Result<BatchId, ValidationError>>;
}

// =============================================================================
// LINK UPLOAD UI TYPES
// =============================================================================

/**
 * Link upload form state
 */
export interface LinkUploadFormState {
  currentStep: UploadFlowStep;
  linkId?: LinkId;
  password?: string;
  uploaderInfo?: UploaderInfo;
  selectedFiles: File[];
  uploadProgress: Record<FileId, number>;
  errors: ValidationError[];
}

/**
 * Link upload context
 */
export interface LinkUploadContext {
  link: UploadLink;
  requirements: LinkUploadRequirements;
  uploaderInfo?: UploaderInfo;
  selectedFolder?: Folder;
}

// Export all database types
export * from './database';