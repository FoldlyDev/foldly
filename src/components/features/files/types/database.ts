// Files Feature Database Types - Folder and FileUpload entities
// Following 2025 TypeScript best practices with strict type safety

import type { BaseEntity } from '../../../../types/database-infrastructure';

import type {
  HexColor,
  EmailAddress,
  LinkId,
  FileId,
  FolderId,
  BatchId,
} from '../../../../types/ids';

import type { DeepReadonly } from '../../../../types/utils';

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
 * Hierarchical folder system with advanced features
 */
export interface Folder extends BaseEntity {
  readonly parentFolderId?: FolderId; // NULL for root folders
  readonly uploadLinkId?: LinkId; // Associated upload link

  readonly name: string;
  readonly description?: string;
  readonly color?: HexColor; // Hex color for organization
  readonly path: string; // e.g., "Projects/Client Work/Logo Design"

  // Organization and metadata
  readonly isArchived: boolean;
  readonly sortOrder: number; // Manual ordering within parent folder

  // Security and permissions
  readonly isPublic: boolean;
  readonly inheritPermissions: boolean; // Inherit from parent folder
  readonly classification: DataClassification;

  // Statistics
  readonly fileCount: number;
  readonly totalSize: number; // bytes
  readonly lastActivity?: Date;
} /**
 * Input type for creating folders (Application Layer)
 */
export interface CreateFolderInput {
  readonly name: string;
  readonly description?: string;
  readonly color?: HexColor;
  readonly parentFolderId?: FolderId;
  readonly uploadLinkId?: LinkId;
  readonly isPublic?: boolean;
  readonly inheritPermissions?: boolean;
  readonly classification?: DataClassification;
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

// Export all files database types
export type * from './database';
