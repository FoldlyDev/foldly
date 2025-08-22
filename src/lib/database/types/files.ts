// =============================================================================
// FILE TYPES - Database File Entity and Related Types
// =============================================================================
// 🎯 Based on files table in drizzle/schema.ts

import type {
  DatabaseId,
  TimestampFields,
  WithoutSystemFields,
  PartialBy,
} from './common';
import type { FileProcessingStatus } from './enums';

// =============================================================================
// BASE FILE TYPES - Direct from database schema
// =============================================================================

/**
 * File entity - exact match to database schema (files table)
 */
export interface File extends TimestampFields {
  id: DatabaseId;
  linkId: DatabaseId | null; // Optional - null for personal workspace files
  batchId: DatabaseId | null; // Required when linkId is set, null for workspace files
  workspaceId: DatabaseId | null; // For personal workspace files
  folderId: DatabaseId | null; // NULL for root folder files

  // File identification
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extension: string | null;

  // Storage information
  storagePath: string;
  storageProvider: string;
  checksum: string | null;

  // Security and safety
  isSafe: boolean;
  virusScanResult: string;

  // File processing
  processingStatus: FileProcessingStatus;
  thumbnailPath: string | null;

  // Organization flags
  isOrganized: boolean;
  needsReview: boolean;
  sortOrder: number;

  // Access tracking
  downloadCount: number;
  lastAccessedAt: Date | null;

  // Upload tracking
  uploadedAt: Date;
}

/**
 * File insert type - for creating new files
 */
export type FileInsert = WithoutSystemFields<File>;

/**
 * File update type - for updating existing files
 */
export type FileUpdate = PartialBy<
  Omit<
    File,
    'id' | 'createdAt' | 'updatedAt' | 'uploadedAt'
  >,
  | 'linkId'
  | 'batchId'
  | 'workspaceId'
  | 'folderId'
  | 'fileName'
  | 'originalName'
  | 'fileSize'
  | 'mimeType'
  | 'extension'
  | 'storagePath'
  | 'storageProvider'
  | 'checksum'
  | 'isSafe'
  | 'virusScanResult'
  | 'processingStatus'
  | 'thumbnailPath'
  | 'isOrganized'
  | 'needsReview'
  | 'sortOrder'
  | 'downloadCount'
  | 'lastAccessedAt'
>;

// =============================================================================
// COMPUTED FILE TYPES - With calculated fields and relationships
// =============================================================================

/**
 * File with metadata - includes computed metadata
 */
export interface FileWithMetadata extends File {
  metadata: {
    sizeFormatted: string;
    typeCategory:
      | 'image'
      | 'video'
      | 'audio'
      | 'document'
      | 'archive'
      | 'other';
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
    hasPreview: boolean;
    hasThumbnail: boolean;
  };
  urls: {
    download: string;
    preview: string | null;
    thumbnail: string | null;
    stream: string | null;
  };
}

/**
 * File upload progress - for tracking upload progress
 */
export interface FileUploadProgress {
  id: DatabaseId;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progressPercentage: number;
  uploadSpeed: number; // bytes per second
  timeRemaining: number | null; // seconds
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: Date;
  completedAt: Date | null;
}

/**
 * File with batch info - includes batch relationship
 */
export interface FileWithBatch extends File {
  batch: {
    id: DatabaseId;
    uploaderEmail: string | null;
    uploaderName: string | null;
    batchStatus: string;
    totalFiles: number;
    processedFiles: number;
    createdAt: Date;
  };
}

/**
 * File with link info - includes link relationship
 */
export interface FileWithLink extends File {
  link: {
    id: DatabaseId;
    slug: string;
    title: string;
    isActive: boolean;
    brandColor: string | null;
  };
}

/**
 * File with folder info - includes folder relationship
 */
export interface FileWithFolder extends File {
  folder: {
    id: DatabaseId;
    name: string;
    path: string;
    depth: number;
  } | null;
}

// =============================================================================
// FILE UTILITY TYPES - Helper types for specific use cases
// =============================================================================

/**
 * File for listing - condensed info for lists
 */
export interface FileListItem {
  id: DatabaseId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  processingStatus: FileProcessingStatus;
  downloadCount: number;
  createdAt: Date;
  thumbnailPath: string | null;
  folderId: DatabaseId | null;
  sizeFormatted: string;
  typeCategory: string;
  hasPreview: boolean;
  downloadUrl: string;
}

/**
 * File for download - info needed for download requests
 */
export interface FileDownloadInfo {
  id: DatabaseId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  storageProvider: string;
  downloadUrl: string;
  linkId: DatabaseId | null;
}

/**
 * File for sharing - public info safe to share
 */
export interface PublicFileInfo {
  id: DatabaseId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  downloadCount: number;
  createdAt: Date;
  thumbnailPath: string | null;
  previewUrl: string | null;
  downloadUrl: string;
  sizeFormatted: string;
  typeCategory: string;
}

/**
 * File search result - for file search functionality
 */
export interface FileSearchResult {
  id: DatabaseId;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  matchReason: 'filename' | 'content' | 'metadata';
  matchScore: number;
  highlightedText: string | null;
}

// =============================================================================
// FILE FORM TYPES - For form handling and validation
// =============================================================================

/**
 * File upload form data
 */
export interface FileUploadForm {
  files: FileList;
  folderId?: DatabaseId;
  linkId: DatabaseId;
  batchName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Upload file type - for file upload processing
 */
export interface UploadFile {
  file: File;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  id?: string;
  progress?: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * File move form data
 */
export interface FileMoveForm {
  fileIds: DatabaseId[];
  targetFolderId: DatabaseId | null;
}

/**
 * File rename form data
 */
export interface FileRenameForm {
  fileName: string;
}

/**
 * File settings form data
 */
export interface FileSettingsForm {
  needsReview?: boolean;
  isOrganized?: boolean;
}

// =============================================================================
// FILE VALIDATION TYPES - Validation rules and constraints
// =============================================================================

/**
 * File validation constraints
 */
export interface FileValidationConstraints {
  fileName: {
    minLength: number;
    maxLength: number;
    pattern: RegExp;
    invalidChars: string[];
  };
  fileSize: {
    min: number;
    max: number;
  };
  mimeType: {
    allowed: string[];
    blocked: string[];
  };
}

/**
 * File field validation errors
 */
export interface FileValidationErrors {
  fileName?: string[];
  fileSize?: string[];
  mimeType?: string[];
}

// =============================================================================
// FILE FILTER TYPES - For querying and filtering files
// =============================================================================

/**
 * File filter options
 */
export interface FileFilterOptions {
  workspaceId?: DatabaseId;
  linkId?: DatabaseId;
  batchId?: DatabaseId;
  folderId?: DatabaseId;
  processingStatus?: FileProcessingStatus | FileProcessingStatus[];
  mimeType?: string | string[];
  typeCategory?: string | string[];
  hasPreview?: boolean;
  hasThumbnail?: boolean;
  fileSizeRange?: { min: number; max: number };
  createdDateRange?: { start: Date; end: Date };
  downloadCountRange?: { min: number; max: number };
  isSafe?: boolean;
  isOrganized?: boolean;
  needsReview?: boolean;
}

/**
 * File sort options
 */
export type FileSortField =
  | 'fileName'
  | 'originalName'
  | 'fileSize'
  | 'mimeType'
  | 'processingStatus'
  | 'downloadCount'
  | 'createdAt'
  | 'uploadedAt'
  | 'lastAccessedAt';

/**
 * File query options
 */
export interface FileQueryOptions {
  search?: string;
  filters?: FileFilterOptions;
  sort?: {
    field: FileSortField;
    order: 'asc' | 'desc';
  };
  include?: {
    batch?: boolean;
    link?: boolean;
    folder?: boolean;
    metadata?: boolean;
  };
}

// =============================================================================
// FILE HELPER FUNCTIONS - Type-safe utility functions
// =============================================================================

/**
 * Get file type category from MIME type
 */
export const getFileTypeCategory = (
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('archive') ||
    mimeType.includes('compressed')
  )
    return 'archive';
  return 'other';
};

/**
 * Check if file is image
 */
export const isImageFile = (file: Pick<File, 'mimeType'>): boolean => {
  return file.mimeType.startsWith('image/');
};

/**
 * Check if file is video
 */
export const isVideoFile = (file: Pick<File, 'mimeType'>): boolean => {
  return file.mimeType.startsWith('video/');
};

/**
 * Check if file is audio
 */
export const isAudioFile = (file: Pick<File, 'mimeType'>): boolean => {
  return file.mimeType.startsWith('audio/');
};

/**
 * Check if file has preview
 */
export const fileHasPreview = (file: Pick<File, 'mimeType'>): boolean => {
  return (
    isImageFile(file) ||
    isVideoFile(file) ||
    file.mimeType === 'application/pdf'
  );
};

/**
 * Check if file has thumbnail
 */
export const fileHasThumbnail = (
  file: Pick<File, 'thumbnailPath'>
): boolean => {
  return file.thumbnailPath !== null;
};

// Removed calculateAspectRatio - width/height not in database schema

/**
 * Format file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration to human readable format
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Removed isFileExpired - expiresAt not in database schema

/**
 * Check if file is processing
 */
export const isFileProcessing = (file: Pick<File, 'processingStatus'>): boolean => {
  return file.processingStatus === 'processing';
};

/**
 * Check if file processing is complete
 */
export const isFileProcessingComplete = (
  file: Pick<File, 'processingStatus'>
): boolean => {
  return file.processingStatus === 'completed';
};

/**
 * Check if file processing failed
 */
export const isFileProcessingFailed = (file: Pick<File, 'processingStatus'>): boolean => {
  return file.processingStatus === 'failed';
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return fileName.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Get file name without extension
 */
export const getFileNameWithoutExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) return fileName;
  return fileName.substring(0, lastDotIndex);
};

/**
 * Validate file name
 */
export const isValidFileName = (fileName: string): boolean => {
  // No special characters that would break file systems
  const invalidChars = /[<>:"/\\|?*]/;
  return (
    !invalidChars.test(fileName) &&
    fileName.length >= 1 &&
    fileName.length <= 255 &&
    fileName.trim().length > 0
  );
};

/**
 * Generate unique filename
 */
export const generateUniqueFileName = (
  originalName: string,
  timestamp: Date = new Date()
): string => {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  const timestampString = timestamp.toISOString().replace(/[:.]/g, '-');
  return extension
    ? `${nameWithoutExt}-${timestampString}.${extension}`
    : `${nameWithoutExt}-${timestampString}`;
};

/**
 * Get file icon based on MIME type
 */
export const getFileIcon = (mimeType: string): string => {
  const category = getFileTypeCategory(mimeType);

  const icons = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
    archive: '📦',
    other: '📁',
  };

  return icons[category];
};
