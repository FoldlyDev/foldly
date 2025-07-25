// Files Feature Database Types - Folder and FileUpload entities
// Following 2025 TypeScript best practices with strict type safety

import type {
  BaseEntity,
  EmailAddress,
  LinkId,
  FileId,
  FolderId,
  BatchId,
  DeepReadonly,
} from '@/types';

import type {
  DataClassification,
  FileProcessingStatus,
  SecurityWarning,
  FileMetadata,
} from './index';

// =============================================================================
// FOLDERS - HIERARCHICAL ORGANIZATION SYSTEM
// =============================================================================

/**
 * Simplified folder system for MVP - No colors or descriptions
 */
export interface Folder extends BaseEntity {
  readonly parentFolderId?: FolderId; // NULL for root folders
  readonly uploadLinkId?: LinkId; // Associated upload link

  readonly name: string;
  readonly path: string; // e.g., "Projects/Client Work/Logo Design"
  readonly depth: number; // 0 = root, 1 = first level, etc.

  // Organization and metadata
  readonly isArchived: boolean;
  readonly sortOrder: number; // Manual ordering within parent folder

  // Security - Simplified for MVP
  readonly isPublic: boolean;

  // Statistics
  readonly fileCount: number;
  readonly totalSize: number; // bytes

  readonly lastActivity?: Date;
} /**
 * Input type for creating folders (Application Layer) - Simplified for MVP
 */
export interface CreateFolderInput {
  readonly name: string;
  readonly parentFolderId?: FolderId;
  readonly uploadLinkId?: LinkId;
  readonly isPublic?: boolean;
  readonly sortOrder?: number;
}

/**
 * Input type for updating folders (Application Layer)
 */
export interface UpdateFolderInput extends Partial<CreateFolderInput> {
  readonly id: FolderId;
}

/**
 * Folder tree structure for navigation
 */
export interface FolderTree extends Folder {
  readonly children: readonly FolderTree[];
  readonly depth: number;
  readonly hasChildren: boolean;
}

// =============================================================================
// FILE UPLOADS - ENHANCED WITH BATCH SUPPORT
// =============================================================================

/**
 * Enhanced file uploads with comprehensive metadata and batch support
 */
export interface FileUpload extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id
  readonly folderId?: FolderId; // Organization destination
  readonly batchId: BatchId; // Groups files uploaded together

  // Uploader information
  readonly uploaderName: string; // Mandatory field
  readonly uploaderEmail?: EmailAddress; // Optional, required if link requires it
  readonly uploaderMessage?: string; // Optional message from uploader  // File metadata - using imported FileMetadata interface
  readonly fileName: string;
  readonly originalFileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly mimeType: string;
  readonly storagePath: string;

  // File integrity and security
  readonly md5Hash?: string;
  readonly sha256Hash?: string;
  readonly virusScanResult?: 'clean' | 'infected' | 'suspicious' | 'pending';
  readonly securityWarnings?: readonly SecurityWarning[];

  // Processing status
  readonly processingStatus: FileProcessingStatus;
  readonly isProcessed: boolean;
  readonly isSafe: boolean; // Overall safety determination
  readonly thumbnailPath?: string; // For images/videos

  // Access and download tracking
  readonly downloadCount: number;
  readonly lastDownloadAt?: Date;
  readonly downloadLinks?: readonly string[]; // Presigned URLs for different formats

  // Classification and organization
  readonly classification: DataClassification;
  readonly tags?: readonly string[];
  readonly isArchived: boolean;
}

/**
 * Input type for file uploads (Application Layer)
 */
export interface FileUploadInput {
  readonly uploadLinkId: LinkId;
  readonly batchId: BatchId;
  readonly folderId?: FolderId;
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly uploaderMessage?: string;
  readonly fileName: string;
  readonly originalFileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly mimeType: string;
  readonly storagePath: string;
  readonly md5Hash?: string;
  readonly sha256Hash?: string;
  readonly classification?: DataClassification;
  readonly tags?: readonly string[];
}

// Export all files database types and aliases
export type FileData = FileUpload;
export type FolderData = Folder;
export type * from './database';
