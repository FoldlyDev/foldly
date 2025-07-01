// Upload and File Processing Types for Foldly - Advanced Multi-Link System
// File upload pipeline, processing states, and real-time upload tracking
// Following 2025 TypeScript best practices with strict type safety

import type {
  FileProcessingStatus,
  BatchStatus,
  SecurityWarning,
  HexColor,
  EmailAddress,
  UploaderInfo,
  FileMetadata,
  FileId,
  BatchId,
  LinkId,
  FolderId,
  DeepReadonly,
  Result,
} from '../global';

import type { UploadLink, Folder, FileUpload, UploadBatch } from '../database';

// =============================================================================
// BRANDED TYPES FOR UPLOAD SYSTEM (2025 BEST PRACTICE)
// =============================================================================

export type UploadId = string & { readonly __brand: 'UploadId' };
export type ProcessingJobId = string & { readonly __brand: 'ProcessingJobId' };
export type ThumbnailId = string & { readonly __brand: 'ThumbnailId' };
export type PreviewId = string & { readonly __brand: 'PreviewId' };
export type HashValue = string & { readonly __brand: 'HashValue' };

// =============================================================================
// UPLOAD PIPELINE STAGES (2025 CONST PATTERN)
// =============================================================================

/**
 * Complete upload pipeline stages using const assertion (2025 Best Practice)
 */
export const UPLOAD_STAGE = {
  INITIALIZATION: 'initialization',
  VALIDATION: 'validation',
  VIRUS_SCAN: 'virus_scan',
  METADATA_EXTRACTION: 'metadata_extraction',
  STORAGE_UPLOAD: 'storage_upload',
  THUMBNAIL_GENERATION: 'thumbnail_generation',
  BATCH_ORGANIZATION: 'batch_organization',
  NOTIFICATION: 'notification',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const satisfies Record<string, string>;

export type UploadStage = (typeof UPLOAD_STAGE)[keyof typeof UPLOAD_STAGE];

/**
 * Content type classification using const assertion
 */
export const CONTENT_TYPE = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  CODE: 'code',
  DATA: 'data',
  EXECUTABLE: 'executable',
  UNKNOWN: 'unknown',
} as const satisfies Record<string, string>;

export type ContentType = (typeof CONTENT_TYPE)[keyof typeof CONTENT_TYPE];

/**
 * Upload error codes using const assertion
 */
export const UPLOAD_ERROR_CODE = {
  // File validation errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  INVALID_FILE_NAME: 'INVALID_FILE_NAME',
  CORRUPTED_FILE: 'CORRUPTED_FILE',

  // Security errors
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  MALWARE_DETECTED: 'MALWARE_DETECTED',
  SUSPICIOUS_CONTENT: 'SUSPICIOUS_CONTENT',
  BLOCKED_FILE_TYPE: 'BLOCKED_FILE_TYPE',

  // Storage errors
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_SERVICE_ERROR: 'STORAGE_SERVICE_ERROR',
  UPLOAD_TIMEOUT: 'UPLOAD_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Processing errors
  METADATA_EXTRACTION_FAILED: 'METADATA_EXTRACTION_FAILED',
  THUMBNAIL_GENERATION_FAILED: 'THUMBNAIL_GENERATION_FAILED',
  SCAN_SERVICE_UNAVAILABLE: 'SCAN_SERVICE_UNAVAILABLE',

  // System errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const satisfies Record<string, string>;

export type UploadErrorCode =
  (typeof UPLOAD_ERROR_CODE)[keyof typeof UPLOAD_ERROR_CODE];

/**
 * Virus threat types and severity levels
 */
export const VIRUS_THREAT_TYPE = {
  VIRUS: 'virus',
  MALWARE: 'malware',
  TROJAN: 'trojan',
  ADWARE: 'adware',
  SUSPICIOUS: 'suspicious',
} as const satisfies Record<string, string>;

export type VirusThreatType =
  (typeof VIRUS_THREAT_TYPE)[keyof typeof VIRUS_THREAT_TYPE];

export const THREAT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const satisfies Record<string, string>;

export type ThreatSeverity =
  (typeof THREAT_SEVERITY)[keyof typeof THREAT_SEVERITY];

export const THREAT_ACTION = {
  QUARANTINE: 'quarantine',
  DELETE: 'delete',
  CLEAN: 'clean',
  MONITOR: 'monitor',
} as const satisfies Record<string, string>;

export type ThreatAction = (typeof THREAT_ACTION)[keyof typeof THREAT_ACTION];

// =============================================================================
// FILE UPLOAD PIPELINE TYPES
// =============================================================================

/**
 * Upload processing pipeline state
 */
export interface UploadPipelineState {
  readonly fileId: FileId;
  readonly batchId: BatchId;
  readonly currentStage: UploadStage;
  readonly completedStages: DeepReadonly<UploadStage[]>;
  readonly progress: number; // 0-100
  readonly startedAt: Date;
  readonly estimatedCompletionAt?: Date;
  readonly error?: UploadError;
  readonly warnings: DeepReadonly<SecurityWarning[]>;
  readonly metadata: FileProcessingMetadata;
}

/**
 * File processing metadata collected during upload
 */
export interface FileProcessingMetadata {
  // Basic file information
  readonly originalName: string;
  readonly sanitizedName: string;
  readonly size: number;
  readonly mimeType: string;
  readonly extension: string;

  // Content analysis
  readonly contentType: ContentType;
  readonly isExecutable: boolean;
  readonly isArchive: boolean;
  readonly containsEmbeddedFiles: boolean;

  // Media-specific metadata
  readonly imageMetadata?: ImageMetadata;
  readonly videoMetadata?: VideoMetadata;
  readonly audioMetadata?: AudioMetadata;
  readonly documentMetadata?: DocumentMetadata;

  // Security analysis
  readonly virusScanResult?: VirusScanResult;
  readonly hashChecksums: HashChecksums;
  readonly securityScore: number; // 0-100, higher is safer

  // Processing timestamps
  readonly uploadStartedAt: Date;
  readonly scanCompletedAt?: Date;
  readonly processingCompletedAt?: Date;
}

/**
 * Image metadata extraction
 */
export interface ImageMetadata {
  readonly width: number;
  readonly height: number;
  readonly format: string; // JPEG, PNG, GIF, etc.
  readonly colorSpace?: string;
  readonly hasTransparency: boolean;
  readonly isAnimated: boolean;
  readonly exifData?: DeepReadonly<Record<string, unknown>>;
  readonly thumbnailGenerated: boolean;
  readonly thumbnailPath?: string;
  readonly thumbnailId?: ThumbnailId;
}

/**
 * Video metadata extraction
 */
export interface VideoMetadata {
  readonly duration: number; // seconds
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly bitrate: number;
  readonly codec: string;
  readonly format: string;
  readonly hasAudio: boolean;
  readonly thumbnailGenerated: boolean;
  readonly thumbnailPath?: string;
  readonly thumbnailId?: ThumbnailId;
  readonly previewGenerated: boolean;
  readonly previewPath?: string;
  readonly previewId?: PreviewId;
}

/**
 * Audio metadata extraction
 */
export interface AudioMetadata {
  readonly duration: number; // seconds
  readonly bitrate: number;
  readonly sampleRate: number;
  readonly channels: number;
  readonly codec: string;
  readonly format: string;
  readonly title?: string;
  readonly artist?: string;
  readonly album?: string;
  readonly genre?: string;
  readonly year?: number;
}

/**
 * Document metadata extraction
 */
export interface DocumentMetadata {
  readonly pageCount?: number;
  readonly wordCount?: number;
  readonly characterCount?: number;
  readonly author?: string;
  readonly title?: string;
  readonly subject?: string;
  readonly keywords?: DeepReadonly<string[]>;
  readonly createdAt?: Date;
  readonly modifiedAt?: Date;
  readonly application?: string; // Creating application
  readonly isPasswordProtected: boolean;
  readonly hasEmbeddedFiles: boolean;
}

/**
 * File hash checksums for integrity verification
 */
export interface HashChecksums {
  readonly md5: HashValue;
  readonly sha1: HashValue;
  readonly sha256: HashValue;
}

/**
 * Virus scan result structure
 */
export interface VirusScanResult {
  readonly isClean: boolean;
  readonly threats: DeepReadonly<VirusThreat[]>;
  readonly scanEngine: string;
  readonly scanVersion: string;
  readonly scannedAt: Date;
  readonly scanDuration: number; // milliseconds
}

/**
 * Detected virus threat information
 */
export interface VirusThreat {
  readonly name: string;
  readonly type: VirusThreatType;
  readonly severity: ThreatSeverity;
  readonly description: string;
  readonly action: ThreatAction;
}

/**
 * Upload error with enhanced information
 */
export interface UploadError {
  readonly code: UploadErrorCode;
  readonly message: string;
  readonly stage: UploadStage;
  readonly details?: DeepReadonly<Record<string, unknown>>;
  readonly isRetryable: boolean;
  readonly retryAfter?: number; // seconds
  readonly timestamp: Date;
}

// =============================================================================
// BATCH UPLOAD MANAGEMENT
// =============================================================================

/**
 * Batch upload manager for coordinating multiple file uploads
 */
export interface BatchUploadManager {
  readonly batchId: BatchId;
  readonly linkId: LinkId;
  readonly uploaderInfo: UploaderInfo;
  readonly files: DeepReadonly<BatchFileState[]>;
  readonly status: BatchStatus;
  readonly progress: BatchProgress;
  readonly settings: BatchSettings;
  readonly createdAt: Date;
  readonly completedAt?: Date;
}

/**
 * Individual file state within a batch
 */
export interface BatchFileState {
  readonly fileId: FileId;
  readonly file: File;
  readonly status: FileProcessingStatus;
  readonly progress: number; // 0-100
  readonly stage: UploadStage;
  readonly uploadedBytes: number;
  readonly totalBytes: number;
  readonly error?: UploadError;
  readonly warnings: DeepReadonly<SecurityWarning[]>;
  readonly retryCount: number;
  readonly startedAt: Date;
  readonly completedAt?: Date;
}

/**
 * Overall batch progress tracking
 */
export interface BatchProgress {
  readonly totalFiles: number;
  readonly completedFiles: number;
  readonly failedFiles: number;
  readonly inProgressFiles: number;
  readonly queuedFiles: number;
  readonly totalBytes: number;
  readonly uploadedBytes: number;
  readonly overallProgress: number; // 0-100
  readonly estimatedTimeRemaining?: number; // seconds
  readonly transferRate?: number; // bytes per second
}

/**
 * Batch upload configuration settings
 */
export interface BatchSettings {
  readonly maxConcurrentUploads: number;
  readonly chunkSize: number; // bytes for chunked uploads
  readonly retryAttempts: number;
  readonly timeoutDuration: number; // seconds
  readonly autoOrganize: boolean;
  readonly targetFolderId?: FolderId;
  readonly generateThumbnails: boolean;
  readonly virusScanEnabled: boolean;
  readonly notifyOnCompletion: boolean;
}

// =============================================================================
// UPLOAD EVENTS (DISCRIMINATED UNION FOR TYPE SAFETY)
// =============================================================================

/**
 * Upload event system with discriminated unions (2025 Best Practice)
 */
export type UploadEvent =
  | {
      readonly type: 'batch.started';
      readonly payload: BatchUploadManager;
    }
  | {
      readonly type: 'batch.progress';
      readonly payload: {
        readonly batchId: BatchId;
        readonly progress: BatchProgress;
      };
    }
  | {
      readonly type: 'batch.completed';
      readonly payload: {
        readonly batchId: BatchId;
        readonly summary: BatchSummary;
      };
    }
  | {
      readonly type: 'batch.failed';
      readonly payload: {
        readonly batchId: BatchId;
        readonly error: UploadError;
      };
    }
  | {
      readonly type: 'file.started';
      readonly payload: {
        readonly batchId: BatchId;
        readonly fileId: FileId;
      };
    }
  | {
      readonly type: 'file.progress';
      readonly payload: {
        readonly batchId: BatchId;
        readonly fileId: FileId;
        readonly progress: number;
        readonly stage: UploadStage;
      };
    }
  | {
      readonly type: 'file.completed';
      readonly payload: {
        readonly batchId: BatchId;
        readonly fileId: FileId;
        readonly metadata: FileProcessingMetadata;
      };
    }
  | {
      readonly type: 'file.failed';
      readonly payload: {
        readonly batchId: BatchId;
        readonly fileId: FileId;
        readonly error: UploadError;
      };
    }
  | {
      readonly type: 'file.warning';
      readonly payload: {
        readonly batchId: BatchId;
        readonly fileId: FileId;
        readonly warning: SecurityWarning;
      };
    };

/**
 * Batch completion summary
 */
export interface BatchSummary {
  readonly batchId: BatchId;
  readonly linkId: LinkId;
  readonly uploaderName: string;
  readonly totalFiles: number;
  readonly successfulFiles: number;
  readonly failedFiles: number;
  readonly totalSize: number;
  readonly processingTime: number; // seconds
  readonly warnings: DeepReadonly<SecurityWarning[]>;
  readonly folderPath?: string;
  readonly downloadUrl?: string;
  readonly expiresAt?: Date;
}

// =============================================================================
// UPLOAD CONFIGURATION AND LIMITS
// =============================================================================

/**
 * Upload limits and restrictions
 */
export interface UploadLimits {
  readonly maxFileSize: number; // bytes
  readonly maxBatchSize: number; // bytes
  readonly maxFilesPerBatch: number;
  readonly allowedMimeTypes: DeepReadonly<string[]>;
  readonly blockedMimeTypes: DeepReadonly<string[]>;
  readonly allowedExtensions: DeepReadonly<string[]>;
  readonly blockedExtensions: DeepReadonly<string[]>;
  readonly requireVirusScan: boolean;
  readonly maxRetryAttempts: number;
  readonly uploadTimeout: number; // seconds
}

/**
 * File type configuration with processing options
 */
export interface FileTypeConfig {
  readonly category: ContentType;
  readonly mimeTypes: DeepReadonly<string[]>;
  readonly extensions: DeepReadonly<string[]>;
  readonly maxSize?: number; // bytes, overrides global limit
  readonly allowThumbnails: boolean;
  readonly requireScan: boolean;
  readonly securityLevel: ThreatSeverity;
  readonly processingOptions: FileProcessingOptions;
}

/**
 * File processing configuration options
 */
export interface FileProcessingOptions {
  readonly extractMetadata: boolean;
  readonly generateThumbnail: boolean;
  readonly createPreview: boolean;
  readonly compressionEnabled: boolean;
  readonly qualityOptimization: boolean;
  readonly formatConversion?: string; // target format
}

// =============================================================================
// UI INTERFACE STATE MANAGEMENT
// =============================================================================

/**
 * Upload interface state for UI components
 */
export interface UploadInterfaceState {
  readonly isActive: boolean;
  readonly isDragOver: boolean;
  readonly selectedFiles: DeepReadonly<File[]>;
  readonly rejectedFiles: DeepReadonly<RejectedFile[]>;
  readonly uploadQueue: DeepReadonly<QueuedUpload[]>;
  readonly activeUploads: DeepReadonly<ActiveUpload[]>;
  readonly completedUploads: DeepReadonly<CompletedUpload[]>;
  readonly settings: UploadInterfaceSettings;
}

/**
 * File rejected during selection
 */
export interface RejectedFile {
  readonly file: File;
  readonly reason: UploadErrorCode;
  readonly message: string;
}

/**
 * File queued for upload
 */
export interface QueuedUpload {
  readonly id: UploadId;
  readonly file: File;
  readonly targetFolder?: Folder;
  readonly priority: number;
  readonly queuedAt: Date;
}

/**
 * Currently uploading file
 */
export interface ActiveUpload {
  readonly id: UploadId;
  readonly file: File;
  readonly batchId: BatchId;
  readonly progress: number;
  readonly stage: UploadStage;
  readonly startedAt: Date;
  readonly estimatedCompletion?: Date;
}

/**
 * Successfully completed upload
 */
export interface CompletedUpload {
  readonly id: UploadId;
  readonly file: File;
  readonly fileUpload: FileUpload;
  readonly completedAt: Date;
  readonly warnings: DeepReadonly<SecurityWarning[]>;
}

/**
 * Upload interface configuration
 */
export interface UploadInterfaceSettings {
  readonly multipleFiles: boolean;
  readonly showProgress: boolean;
  readonly showThumbnails: boolean;
  readonly autoStart: boolean;
  readonly chunkSize: number;
  readonly maxConcurrent: number;
  readonly showFileList: boolean;
  readonly allowFolderSelection: boolean;
}

// =============================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION (2025 BEST PRACTICE)
// =============================================================================

/**
 * Type guard for upload stages
 */
export const isValidUploadStage = (stage: unknown): stage is UploadStage => {
  return (
    typeof stage === 'string' &&
    Object.values(UPLOAD_STAGE).includes(stage as UploadStage)
  );
};

/**
 * Type guard for content types
 */
export const isValidContentType = (type: unknown): type is ContentType => {
  return (
    typeof type === 'string' &&
    Object.values(CONTENT_TYPE).includes(type as ContentType)
  );
};

/**
 * Type guard for upload error codes
 */
export const isValidUploadErrorCode = (
  code: unknown
): code is UploadErrorCode => {
  return (
    typeof code === 'string' &&
    Object.values(UPLOAD_ERROR_CODE).includes(code as UploadErrorCode)
  );
};

/**
 * Result type for upload operations (2025 Best Practice)
 */
export type UploadResult<T> = Result<T, UploadError>;

// =============================================================================
// EXPORT ALL UPLOAD TYPES
// =============================================================================

export type * from './index';
