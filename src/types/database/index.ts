// Database Types for Foldly - Advanced Multi-Link System
// Matches the Supabase PostgreSQL schema from ARCHITECTURE.md
// Following 2025 TypeScript best practices with strict type safety

import type {
  BaseEntity,
  Timestamps,
  WithId,
  WithUserId,
  LinkType,
  BatchStatus,
  FileProcessingStatus,
  AccessType,
  DataClassification,
  HexColor,
  EmailAddress,
  SecurityWarning,
  FileMetadata,
  UserId,
  LinkId,
  FileId,
  FolderId,
  BatchId,
  DeepReadonly,
  Optional,
  NonEmptyArray,
} from '../global';

// =============================================================================
// SUPABASE GENERATED TYPES SUPPORT (2025 BEST PRACTICE)
// =============================================================================

/**
 * Generated database types from Supabase CLI
 * Run: npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database/generated.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      upload_links: {
        Row: UploadLinkRow;
        Insert: UploadLinkInsert;
        Update: UploadLinkUpdate;
      };
      folders: {
        Row: FolderRow;
        Insert: FolderInsert;
        Update: FolderUpdate;
      };
      file_uploads: {
        Row: FileUploadRow;
        Insert: FileUploadInsert;
        Update: FileUploadUpdate;
      };
      upload_batches: {
        Row: UploadBatchRow;
        Insert: UploadBatchInsert;
        Update: UploadBatchUpdate;
      };
      access_logs: {
        Row: AccessLogRow;
        Insert: AccessLogInsert;
        Update: AccessLogUpdate;
      };
    };
    Views: {
      dashboard_overview: {
        Row: DashboardOverviewRow;
      };
      link_analytics: {
        Row: LinkAnalyticsRow;
      };
    };
    Functions: {
      get_folder_tree: {
        Args: {
          link_id: string;
        };
        Returns: FolderTreeNode[];
      };
      update_link_stats: {
        Args: {
          link_id: string;
        };
        Returns: void;
      };
    };
  };
}

// =============================================================================
// UPLOAD LINKS - MULTI-LINK SYSTEM (ENHANCED)
// =============================================================================

/**
 * Enhanced upload links with multi-type support
 * Supports base links (/username), custom topic links (/username/topic), and generated links
 */
export interface UploadLink extends BaseEntity {
  // Link identification and routing
  readonly slug: string; // username part (base for both link types)
  readonly topic?: string; // NULL for base links, topic name for custom links
  readonly title: string;
  readonly description?: string;
  readonly instructions?: string; // Custom instructions for uploaders

  // Link type and behavior
  readonly linkType: LinkType;
  readonly autoCreateFolders: boolean;
  readonly defaultFolderId?: FolderId; // References folders.id

  // Security controls (recipient-managed)
  readonly requireEmail: boolean;
  readonly requirePassword: boolean;
  readonly passwordHash?: string; // bcrypt hash if password required
  readonly isPublic: boolean; // visibility control
  readonly allowFolderCreation: boolean; // uploader can create folders

  // File and upload limits
  readonly maxFiles: number;
  readonly maxFileSize: number; // bytes
  readonly allowedFileTypes?: readonly string[]; // MIME type restrictions
  readonly expiresAt?: Date;

  // Usage tracking
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number; // bytes
  readonly lastUploadAt?: Date;

  // Relationships
  readonly folders?: readonly Folder[];
  readonly fileUploads?: readonly FileUpload[];
  readonly uploadBatches?: readonly UploadBatch[];
  readonly accessLogs?: readonly LinkAccessLog[];
}

/**
 * Database row type for upload_links table
 */
export interface UploadLinkRow {
  readonly id: string;
  readonly user_id: string;
  readonly slug: string;
  readonly topic: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly instructions: string | null;
  readonly link_type: LinkType;
  readonly auto_create_folders: boolean;
  readonly default_folder_id: string | null;
  readonly require_email: boolean;
  readonly require_password: boolean;
  readonly password_hash: string | null;
  readonly is_public: boolean;
  readonly allow_folder_creation: boolean;
  readonly max_files: number;
  readonly max_file_size: number;
  readonly allowed_file_types: string[] | null;
  readonly expires_at: string | null;
  readonly total_uploads: number;
  readonly total_files: number;
  readonly total_size: number;
  readonly last_upload_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Input type for inserting upload links
 */
export interface UploadLinkInsert {
  readonly id?: string;
  readonly user_id: string;
  readonly slug: string;
  readonly topic?: string | null;
  readonly title: string;
  readonly description?: string | null;
  readonly instructions?: string | null;
  readonly link_type?: LinkType;
  readonly auto_create_folders?: boolean;
  readonly default_folder_id?: string | null;
  readonly require_email?: boolean;
  readonly require_password?: boolean;
  readonly password_hash?: string | null;
  readonly is_public?: boolean;
  readonly allow_folder_creation?: boolean;
  readonly max_files?: number;
  readonly max_file_size?: number;
  readonly allowed_file_types?: string[] | null;
  readonly expires_at?: string | null;
  readonly total_uploads?: number;
  readonly total_files?: number;
  readonly total_size?: number;
  readonly last_upload_at?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for updating upload links
 */
export interface UploadLinkUpdate {
  readonly id?: string;
  readonly user_id?: string;
  readonly slug?: string;
  readonly topic?: string | null;
  readonly title?: string;
  readonly description?: string | null;
  readonly instructions?: string | null;
  readonly link_type?: LinkType;
  readonly auto_create_folders?: boolean;
  readonly default_folder_id?: string | null;
  readonly require_email?: boolean;
  readonly require_password?: boolean;
  readonly password_hash?: string | null;
  readonly is_public?: boolean;
  readonly allow_folder_creation?: boolean;
  readonly max_files?: number;
  readonly max_file_size?: number;
  readonly allowed_file_types?: string[] | null;
  readonly expires_at?: string | null;
  readonly total_uploads?: number;
  readonly total_files?: number;
  readonly total_size?: number;
  readonly last_upload_at?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for creating upload links (Application Layer)
 */
export interface CreateUploadLinkInput {
  readonly slug: string;
  readonly topic?: string;
  readonly title: string;
  readonly description?: string;
  readonly instructions?: string;
  readonly linkType?: LinkType;
  readonly autoCreateFolders?: boolean;
  readonly defaultFolderId?: FolderId;
  readonly requireEmail?: boolean;
  readonly requirePassword?: boolean;
  readonly password?: string; // Will be hashed
  readonly isPublic?: boolean;
  readonly allowFolderCreation?: boolean;
  readonly maxFiles?: number;
  readonly maxFileSize?: number;
  readonly allowedFileTypes?: readonly string[];
  readonly expiresAt?: Date;
}

/**
 * Input type for updating upload links (Application Layer)
 */
export interface UpdateUploadLinkInput extends Partial<CreateUploadLinkInput> {
  readonly id: LinkId;
}

// =============================================================================
// FOLDERS - HIERARCHICAL ORGANIZATION SYSTEM (ENHANCED)
// =============================================================================

/**
 * Hierarchical folder system with advanced features
 */
export interface Folder extends BaseEntity {
  readonly parentFolderId?: FolderId; // NULL for root folders, references folders.id
  readonly uploadLinkId?: LinkId; // Associated upload link, references upload_links.id

  readonly name: string;
  readonly description?: string;
  readonly color?: HexColor; // Hex color for organization

  // Auto-generated path for easy navigation (computed field)
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

  // Relationships
  readonly parentFolder?: Folder;
  readonly childFolders?: readonly Folder[];
  readonly fileUploads?: readonly FileUpload[];
  readonly uploadLink?: UploadLink;
}

/**
 * Database row type for folders table
 */
export interface FolderRow {
  readonly id: string;
  readonly user_id: string;
  readonly parent_folder_id: string | null;
  readonly upload_link_id: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly color: string | null;
  readonly path: string;
  readonly is_archived: boolean;
  readonly sort_order: number;
  readonly is_public: boolean;
  readonly inherit_permissions: boolean;
  readonly classification: DataClassification;
  readonly file_count: number;
  readonly total_size: number;
  readonly last_activity: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Input type for inserting folders
 */
export interface FolderInsert {
  readonly id?: string;
  readonly user_id: string;
  readonly parent_folder_id?: string | null;
  readonly upload_link_id?: string | null;
  readonly name: string;
  readonly description?: string | null;
  readonly color?: string | null;
  readonly path?: string;
  readonly is_archived?: boolean;
  readonly sort_order?: number;
  readonly is_public?: boolean;
  readonly inherit_permissions?: boolean;
  readonly classification?: DataClassification;
  readonly file_count?: number;
  readonly total_size?: number;
  readonly last_activity?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for updating folders
 */
export interface FolderUpdate {
  readonly id?: string;
  readonly user_id?: string;
  readonly parent_folder_id?: string | null;
  readonly upload_link_id?: string | null;
  readonly name?: string;
  readonly description?: string | null;
  readonly color?: string | null;
  readonly path?: string;
  readonly is_archived?: boolean;
  readonly sort_order?: number;
  readonly is_public?: boolean;
  readonly inherit_permissions?: boolean;
  readonly classification?: DataClassification;
  readonly file_count?: number;
  readonly total_size?: number;
  readonly last_activity?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
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

/**
 * Folder tree node for database function returns
 */
export interface FolderTreeNode {
  readonly id: string;
  readonly name: string;
  readonly parent_id: string | null;
  readonly path: string;
  readonly depth: number;
  readonly file_count: number;
  readonly total_size: number;
}

// =============================================================================
// FILE UPLOADS - ENHANCED WITH BATCH SUPPORT
// =============================================================================

/**
 * Enhanced file uploads with comprehensive metadata and batch support
 */
export interface FileUpload extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id
  readonly folderId?: FolderId; // Organization destination, references folders.id
  readonly batchId: BatchId; // Groups files uploaded together

  // Uploader information
  readonly uploaderName: string; // Mandatory field
  readonly uploaderEmail?: EmailAddress; // Optional, required if link requires it
  readonly uploaderMessage?: string; // Optional message from uploader

  // File metadata
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

  // Relationships
  readonly uploadLink?: UploadLink;
  readonly folder?: Folder;
  readonly uploadBatch?: UploadBatch;
}

/**
 * Database row type for file_uploads table
 */
export interface FileUploadRow {
  readonly id: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly folder_id: string | null;
  readonly batch_id: string;
  readonly uploader_name: string;
  readonly uploader_email: string | null;
  readonly uploader_message: string | null;
  readonly file_name: string;
  readonly original_file_name: string;
  readonly file_size: number;
  readonly file_type: string;
  readonly mime_type: string;
  readonly storage_path: string;
  readonly md5_hash: string | null;
  readonly sha256_hash: string | null;
  readonly virus_scan_result: string | null;
  readonly security_warnings: Json | null;
  readonly processing_status: FileProcessingStatus;
  readonly is_processed: boolean;
  readonly is_safe: boolean;
  readonly thumbnail_path: string | null;
  readonly download_count: number;
  readonly last_download_at: string | null;
  readonly download_links: string[] | null;
  readonly classification: DataClassification;
  readonly tags: string[] | null;
  readonly is_archived: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Input type for inserting file uploads
 */
export interface FileUploadInsert {
  readonly id?: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly folder_id?: string | null;
  readonly batch_id: string;
  readonly uploader_name: string;
  readonly uploader_email?: string | null;
  readonly uploader_message?: string | null;
  readonly file_name: string;
  readonly original_file_name: string;
  readonly file_size: number;
  readonly file_type: string;
  readonly mime_type: string;
  readonly storage_path: string;
  readonly md5_hash?: string | null;
  readonly sha256_hash?: string | null;
  readonly virus_scan_result?: string | null;
  readonly security_warnings?: Json | null;
  readonly processing_status?: FileProcessingStatus;
  readonly is_processed?: boolean;
  readonly is_safe?: boolean;
  readonly thumbnail_path?: string | null;
  readonly download_count?: number;
  readonly last_download_at?: string | null;
  readonly download_links?: string[] | null;
  readonly classification?: DataClassification;
  readonly tags?: string[] | null;
  readonly is_archived?: boolean;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for updating file uploads
 */
export interface FileUploadUpdate {
  readonly id?: string;
  readonly user_id?: string;
  readonly upload_link_id?: string;
  readonly folder_id?: string | null;
  readonly batch_id?: string;
  readonly uploader_name?: string;
  readonly uploader_email?: string | null;
  readonly uploader_message?: string | null;
  readonly file_name?: string;
  readonly original_file_name?: string;
  readonly file_size?: number;
  readonly file_type?: string;
  readonly mime_type?: string;
  readonly storage_path?: string;
  readonly md5_hash?: string | null;
  readonly sha256_hash?: string | null;
  readonly virus_scan_result?: string | null;
  readonly security_warnings?: Json | null;
  readonly processing_status?: FileProcessingStatus;
  readonly is_processed?: boolean;
  readonly is_safe?: boolean;
  readonly thumbnail_path?: string | null;
  readonly download_count?: number;
  readonly last_download_at?: string | null;
  readonly download_links?: string[] | null;
  readonly classification?: DataClassification;
  readonly tags?: string[] | null;
  readonly is_archived?: boolean;
  readonly created_at?: string;
  readonly updated_at?: string;
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

/**
 * File upload with progress information
 */
export interface FileUploadProgress extends FileUpload {
  readonly uploadProgress: number; // 0-100
  readonly processingProgress: number; // 0-100
  readonly estimatedTimeRemaining?: number; // seconds
}

// =============================================================================
// UPLOAD BATCHES - BATCH PROCESSING SYSTEM
// =============================================================================

/**
 * Upload batch for grouping related files
 */
export interface UploadBatch extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id

  // Uploader information
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly batchName?: string; // Optional custom batch name
  readonly displayName: string; // Auto-generated: "[Name] (Batch) [Date]"

  // Batch metadata
  readonly status: BatchStatus;
  readonly totalFiles: number;
  readonly processedFiles: number;
  readonly failedFiles: number;
  readonly totalSize: number; // bytes

  // Processing information
  readonly uploadStartedAt: Date;
  readonly uploadCompletedAt?: Date;
  readonly processingCompletedAt?: Date;
  readonly estimatedCompletionAt?: Date;

  // Organization
  readonly targetFolderId?: FolderId; // Default destination folder
  readonly autoOrganized: boolean; // Whether files were auto-organized
  readonly organizationRules?: DeepReadonly<Record<string, unknown>>; // JSON rules used

  // Relationships
  readonly uploadLink?: UploadLink;
  readonly fileUploads?: readonly FileUpload[];
  readonly targetFolder?: Folder;
}

/**
 * Database row type for upload_batches table
 */
export interface UploadBatchRow {
  readonly id: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly uploader_name: string;
  readonly uploader_email: string | null;
  readonly batch_name: string | null;
  readonly display_name: string;
  readonly status: BatchStatus;
  readonly total_files: number;
  readonly processed_files: number;
  readonly failed_files: number;
  readonly total_size: number;
  readonly upload_started_at: string;
  readonly upload_completed_at: string | null;
  readonly processing_completed_at: string | null;
  readonly estimated_completion_at: string | null;
  readonly target_folder_id: string | null;
  readonly auto_organized: boolean;
  readonly organization_rules: Json | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Input type for inserting upload batches
 */
export interface UploadBatchInsert {
  readonly id?: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly uploader_name: string;
  readonly uploader_email?: string | null;
  readonly batch_name?: string | null;
  readonly display_name?: string;
  readonly status?: BatchStatus;
  readonly total_files?: number;
  readonly processed_files?: number;
  readonly failed_files?: number;
  readonly total_size?: number;
  readonly upload_started_at?: string;
  readonly upload_completed_at?: string | null;
  readonly processing_completed_at?: string | null;
  readonly estimated_completion_at?: string | null;
  readonly target_folder_id?: string | null;
  readonly auto_organized?: boolean;
  readonly organization_rules?: Json | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for updating upload batches
 */
export interface UploadBatchUpdate {
  readonly id?: string;
  readonly user_id?: string;
  readonly upload_link_id?: string;
  readonly uploader_name?: string;
  readonly uploader_email?: string | null;
  readonly batch_name?: string | null;
  readonly display_name?: string;
  readonly status?: BatchStatus;
  readonly total_files?: number;
  readonly processed_files?: number;
  readonly failed_files?: number;
  readonly total_size?: number;
  readonly upload_started_at?: string;
  readonly upload_completed_at?: string | null;
  readonly processing_completed_at?: string | null;
  readonly estimated_completion_at?: string | null;
  readonly target_folder_id?: string | null;
  readonly auto_organized?: boolean;
  readonly organization_rules?: Json | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for creating upload batches (Application Layer)
 */
export interface CreateUploadBatchInput {
  readonly uploadLinkId: LinkId;
  readonly uploaderName: string;
  readonly uploaderEmail?: EmailAddress;
  readonly batchName?: string;
  readonly targetFolderId?: FolderId;
}

/**
 * Batch processing statistics
 */
export interface BatchStatistics {
  readonly totalBatches: number;
  readonly activeBatches: number;
  readonly completedBatches: number;
  readonly failedBatches: number;
  readonly averageFilesPerBatch: number;
  readonly averageBatchSize: number; // bytes
  readonly processingTimeStats: DeepReadonly<{
    readonly average: number; // seconds
    readonly min: number;
    readonly max: number;
  }>;
}

// =============================================================================
// ACCESS LOGS - AUDIT TRAIL SYSTEM
// =============================================================================

/**
 * Link access logging for security and analytics
 */
export interface LinkAccessLog extends BaseEntity {
  readonly uploadLinkId: LinkId; // References upload_links.id
  readonly fileId?: FileId; // References file_uploads.id for file-specific access

  // Access information
  readonly accessType: AccessType;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly referer?: string;
  readonly country?: string; // GeoIP location
  readonly city?: string; // GeoIP location

  // User context (if authenticated)
  readonly accessorName?: string; // Name provided during access
  readonly accessorEmail?: EmailAddress; // Email if provided

  // Security context
  readonly wasPasswordRequired: boolean;
  readonly passwordAttempts?: number; // Failed attempts before success
  readonly securityFlags?: readonly string[]; // Suspicious activity indicators

  // Session information
  readonly sessionId?: string;
  readonly sessionDuration?: number; // seconds for view/download sessions

  // Metadata
  readonly metadata?: DeepReadonly<Record<string, unknown>>; // Additional context data

  // Relationships
  readonly uploadLink?: UploadLink;
  readonly file?: FileUpload;
}

/**
 * Database row type for access_logs table
 */
export interface AccessLogRow {
  readonly id: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly file_id: string | null;
  readonly access_type: AccessType;
  readonly ip_address: string;
  readonly user_agent: string;
  readonly referer: string | null;
  readonly country: string | null;
  readonly city: string | null;
  readonly accessor_name: string | null;
  readonly accessor_email: string | null;
  readonly was_password_required: boolean;
  readonly password_attempts: number | null;
  readonly security_flags: string[] | null;
  readonly session_id: string | null;
  readonly session_duration: number | null;
  readonly metadata: Json | null;
  readonly created_at: string;
  readonly updated_at: string;
}

/**
 * Input type for inserting access logs
 */
export interface AccessLogInsert {
  readonly id?: string;
  readonly user_id: string;
  readonly upload_link_id: string;
  readonly file_id?: string | null;
  readonly access_type: AccessType;
  readonly ip_address: string;
  readonly user_agent: string;
  readonly referer?: string | null;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly accessor_name?: string | null;
  readonly accessor_email?: string | null;
  readonly was_password_required?: boolean;
  readonly password_attempts?: number | null;
  readonly security_flags?: string[] | null;
  readonly session_id?: string | null;
  readonly session_duration?: number | null;
  readonly metadata?: Json | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for updating access logs
 */
export interface AccessLogUpdate {
  readonly id?: string;
  readonly user_id?: string;
  readonly upload_link_id?: string;
  readonly file_id?: string | null;
  readonly access_type?: AccessType;
  readonly ip_address?: string;
  readonly user_agent?: string;
  readonly referer?: string | null;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly accessor_name?: string | null;
  readonly accessor_email?: string | null;
  readonly was_password_required?: boolean;
  readonly password_attempts?: number | null;
  readonly security_flags?: string[] | null;
  readonly session_id?: string | null;
  readonly session_duration?: number | null;
  readonly metadata?: Json | null;
  readonly created_at?: string;
  readonly updated_at?: string;
}

/**
 * Input type for creating access logs (Application Layer)
 */
export interface CreateAccessLogInput {
  readonly uploadLinkId: LinkId;
  readonly fileId?: FileId;
  readonly accessType: AccessType;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly referer?: string;
  readonly accessorName?: string;
  readonly accessorEmail?: EmailAddress;
  readonly wasPasswordRequired?: boolean;
  readonly passwordAttempts?: number;
  readonly securityFlags?: readonly string[];
  readonly sessionId?: string;
  readonly metadata?: DeepReadonly<Record<string, unknown>>;
}

// =============================================================================
// ANALYTICS AND REPORTING TYPES
// =============================================================================

/**
 * Access analytics aggregation
 */
export interface AccessAnalytics {
  readonly totalAccesses: number;
  readonly uniqueVisitors: number;
  readonly topCountries: Array<{
    readonly country: string;
    readonly count: number;
  }>;
  readonly accessTypeDistribution: Record<AccessType, number>;
  readonly suspiciousActivity: {
    readonly flaggedAccesses: number;
    readonly blockedAttempts: number;
    readonly multiplePasswordFailures: number;
  };
  readonly timeDistribution: Array<{
    readonly hour: number;
    readonly count: number;
  }>;
}

/**
 * Link analytics view row
 */
export interface LinkAnalyticsRow {
  readonly link_id: string;
  readonly total_accesses: number;
  readonly unique_visitors: number;
  readonly total_uploads: number;
  readonly total_files: number;
  readonly total_size: number;
  readonly last_activity: string | null;
  readonly security_score: number;
}

/**
 * Comprehensive link summary
 */
export interface LinkSummary extends UploadLink {
  readonly recentUploads: FileUpload[];
  readonly topUploaders: Array<{
    readonly name: string;
    readonly email?: EmailAddress;
    readonly uploadCount: number;
    readonly totalSize: number;
  }>;
  readonly folderStructure: FolderTree[];
  readonly securityMetrics: {
    readonly totalAccesses: number;
    readonly uniqueVisitors: number;
    readonly failedPasswordAttempts: number;
    readonly suspiciousActivity: number;
  };
}

/**
 * Dashboard overview aggregation
 */
export interface DashboardOverview {
  readonly totalLinks: number;
  readonly activeLinks: number;
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number;
  readonly recentActivity: Array<{
    readonly type: 'upload' | 'link_created' | 'access';
    readonly description: string;
    readonly timestamp: Date;
    readonly linkId?: LinkId;
    readonly fileId?: FileId;
  }>;
  readonly topLinks: Array<{
    readonly linkId: LinkId;
    readonly title: string;
    readonly uploadCount: number;
    readonly recentActivity: Date;
  }>;
}

/**
 * Dashboard overview view row
 */
export interface DashboardOverviewRow {
  readonly total_links: number;
  readonly active_links: number;
  readonly total_uploads: number;
  readonly total_files: number;
  readonly total_size: number;
  readonly recent_activity: Json;
  readonly top_links: Json;
}

// =============================================================================
// UTILITY TYPES FOR DATABASE OPERATIONS (2025 PATTERNS)
// =============================================================================

/**
 * Utility type for making certain fields required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Utility type for database queries with filters
 */
export interface DatabaseQuery<T> {
  readonly filters?: Partial<T>;
  readonly orderBy?: Array<{
    readonly field: keyof T;
    readonly ascending?: boolean;
  }>;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Result type for database operations
 */
export type DatabaseResult<T> =
  | { success: true; data: T; count?: number }
  | { success: false; error: string; details?: unknown };

/**
 * Paginated database result
 */
export interface PaginatedDatabaseResult<T> {
  readonly data: readonly T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
  };
}

/**
 * Database relationship loading options
 */
export type RelationshipLoad<T> = {
  readonly [K in keyof T]?: T[K] extends (infer U)[]
    ? boolean | RelationshipLoad<U>
    : T[K] extends object
      ? boolean | RelationshipLoad<T[K]>
      : boolean;
};

/**
 * Type-safe database client operations
 */
export interface DatabaseClient {
  readonly uploadLinks: {
    readonly findMany: (
      query?: DatabaseQuery<UploadLink>
    ) => Promise<DatabaseResult<UploadLink[]>>;
    readonly findUnique: (
      id: LinkId
    ) => Promise<DatabaseResult<UploadLink | null>>;
    readonly create: (
      data: CreateUploadLinkInput
    ) => Promise<DatabaseResult<UploadLink>>;
    readonly update: (
      data: UpdateUploadLinkInput
    ) => Promise<DatabaseResult<UploadLink>>;
    readonly delete: (id: LinkId) => Promise<DatabaseResult<void>>;
  };
  readonly folders: {
    readonly findMany: (
      query?: DatabaseQuery<Folder>
    ) => Promise<DatabaseResult<Folder[]>>;
    readonly findUnique: (
      id: FolderId
    ) => Promise<DatabaseResult<Folder | null>>;
    readonly create: (
      data: CreateFolderInput
    ) => Promise<DatabaseResult<Folder>>;
    readonly update: (
      data: UpdateFolderInput
    ) => Promise<DatabaseResult<Folder>>;
    readonly delete: (id: FolderId) => Promise<DatabaseResult<void>>;
  };
  readonly fileUploads: {
    readonly findMany: (
      query?: DatabaseQuery<FileUpload>
    ) => Promise<DatabaseResult<FileUpload[]>>;
    readonly findUnique: (
      id: FileId
    ) => Promise<DatabaseResult<FileUpload | null>>;
    readonly create: (
      data: FileUploadInput
    ) => Promise<DatabaseResult<FileUpload>>;
    readonly delete: (id: FileId) => Promise<DatabaseResult<void>>;
  };
}

// =============================================================================
// MIGRATION AND VERSIONING SUPPORT
// =============================================================================

/**
 * Database schema version for migrations
 */
export interface SchemaVersion {
  readonly version: string;
  readonly appliedAt: Date;
  readonly description: string;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  readonly currentVersion: string;
  readonly pendingMigrations: readonly string[];
  readonly lastMigration?: SchemaVersion;
}
