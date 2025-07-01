// API Types for Foldly - Advanced Multi-Link System
// Request/Response types for all API endpoints
// Following 2025 TypeScript best practices with strict type safety

import type {
  ApiResponse,
  PaginatedResponse,
  ErrorCode,
  EmailAddress,
  AbsoluteUrl,
  RelativeUrl,
  AnalyticsPeriod,
  SubscriptionTier,
  UploaderInfo,
  UploadRequirements,
  LinkId,
  FileId,
  FolderId,
  BatchId,
  UserId,
  DeepReadonly,
  Result,
  NonEmptyArray,
} from '../global';

import type {
  UploadLink,
  CreateUploadLinkInput,
  UpdateUploadLinkInput,
  Folder,
  CreateFolderInput,
  UpdateFolderInput,
  FolderTree,
  FileUpload,
  FileUploadInput,
  FileUploadProgress,
  UploadBatch,
  CreateUploadBatchInput,
  LinkAccessLog,
  CreateAccessLogInput,
  LinkSummary,
  DashboardOverview,
  AccessAnalytics,
  BatchStatistics,
} from '../database';

// =============================================================================
// API VERSIONING AND ROUTES (2025 PATTERNS)
// =============================================================================

/**
 * API version using template literal types
 */
export type ApiVersion = 'v1' | 'v2';

/**
 * API route templates with type safety
 */
export type ApiRoute<T extends string = string> = `/api/${ApiVersion}/${T}`;

/**
 * Enhanced API response with proper discriminated unions (2025 Best Practice)
 */
export type ApiResult<TData = unknown, TError = string> =
  | {
      readonly success: true;
      readonly data: TData;
      readonly meta: DeepReadonly<{
        readonly requestId: string;
        readonly timestamp: Date;
        readonly processingTime: number; // milliseconds
        readonly version: ApiVersion;
      }>;
    }
  | {
      readonly success: false;
      readonly error: {
        readonly code: ErrorCode;
        readonly message: string;
        readonly details?: TError;
        readonly field?: string; // For validation errors
        readonly retryable: boolean;
      };
      readonly meta: DeepReadonly<{
        readonly requestId: string;
        readonly timestamp: Date;
        readonly version: ApiVersion;
      }>;
    };

/**
 * Paginated API response with enhanced metadata
 */
export type PaginatedApiResult<T> = ApiResult<T[]> & {
  readonly pagination?: DeepReadonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
    readonly cursor?: string; // For cursor-based pagination
  }>;
};

// =============================================================================
// UPLOAD LINK API ENDPOINTS (ENHANCED)
// =============================================================================

/**
 * GET /api/links - List user's upload links
 */
export interface ListUploadLinksRequest {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly linkType?: string;
  readonly isActive?: boolean;
  readonly sortBy?: 'createdAt' | 'title' | 'totalUploads' | 'lastUploadAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export type ListUploadLinksResponse = ApiResponse<
  PaginatedResponse<UploadLink>
>;

/**
 * GET /api/links/:id - Get specific upload link
 */
export interface GetUploadLinkRequest {
  readonly id: string;
  readonly includeStats?: boolean;
  readonly includeFiles?: boolean;
  readonly includeFolders?: boolean;
}

export type GetUploadLinkResponse = ApiResponse<LinkSummary>;

/**
 * POST /api/links - Create new upload link
 */
export interface CreateUploadLinkRequest extends CreateUploadLinkInput {}

export type CreateUploadLinkResponse = ApiResponse<UploadLink>;

/**
 * PUT /api/links/:id - Update upload link
 */
export interface UpdateUploadLinkRequest extends UpdateUploadLinkInput {}

export type UpdateUploadLinkResponse = ApiResponse<UploadLink>;

/**
 * DELETE /api/links/:id - Delete upload link
 */
export interface DeleteUploadLinkRequest {
  readonly id: string;
  readonly permanent?: boolean; // Hard delete vs soft delete
}

export type DeleteUploadLinkResponse = ApiResponse<{ deleted: boolean }>;

/**
 * POST /api/links/:id/duplicate - Duplicate upload link
 */
export interface DuplicateUploadLinkRequest {
  readonly id: string;
  readonly newSlug: string;
  readonly newTitle: string;
}

export type DuplicateUploadLinkResponse = ApiResponse<UploadLink>;

// =============================================================================
// PUBLIC UPLOAD API ENDPOINTS
// =============================================================================

/**
 * GET /api/public/links/resolve - Resolve upload link by URL
 */
export interface ResolveUploadLinkRequest {
  readonly slug: string;
  readonly topic?: string;
  readonly password?: string; // If password-protected
}

export interface ResolveUploadLinkResponse
  extends ApiResponse<{
    readonly link: UploadLink;
    readonly requirements: UploadRequirements;
    readonly folderStructure?: FolderTree[];
    readonly isPasswordRequired: boolean;
    readonly isEmailRequired: boolean;
  }> {}

/**
 * POST /api/public/links/:linkId/validate-password - Validate link password
 */
export interface ValidatePasswordRequest {
  readonly linkId: string;
  readonly password: string;
}

export type ValidatePasswordResponse = ApiResponse<{ valid: boolean }>;

/**
 * POST /api/public/upload/batch - Start new upload batch
 */
export interface StartUploadBatchRequest extends CreateUploadBatchInput {}

export type StartUploadBatchResponse = ApiResponse<UploadBatch>;

/**
 * POST /api/public/upload/file - Upload single file
 */
export interface UploadFileRequest {
  readonly batchId: string;
  readonly file: File;
  readonly metadata: FileUploadInput;
  readonly folderId?: string; // Target folder
}

export type UploadFileResponse = ApiResponse<FileUploadProgress>;

/**
 * GET /api/public/upload/progress/:batchId - Get upload progress
 */
export interface GetUploadProgressRequest {
  readonly batchId: string;
}

export interface GetUploadProgressResponse
  extends ApiResponse<{
    readonly batch: UploadBatch;
    readonly files: FileUploadProgress[];
    readonly overallProgress: number; // 0-100
    readonly estimatedTimeRemaining?: number; // seconds
  }> {}

/**
 * POST /api/public/upload/complete - Complete upload batch
 */
export interface CompleteUploadBatchRequest {
  readonly batchId: string;
  readonly organizeFolders?: boolean;
}

export type CompleteUploadBatchResponse = ApiResponse<UploadBatch>;

// =============================================================================
// FOLDER MANAGEMENT API ENDPOINTS
// =============================================================================

/**
 * GET /api/folders - List user's folders
 */
export interface ListFoldersRequest {
  readonly linkId?: string; // Filter by upload link
  readonly parentId?: string; // Filter by parent folder
  readonly includeChildren?: boolean;
  readonly includeStats?: boolean;
}

export type ListFoldersResponse = ApiResponse<FolderTree[]>;

/**
 * POST /api/folders - Create new folder
 */
export interface CreateFolderRequest extends CreateFolderInput {}

export type CreateFolderResponse = ApiResponse<Folder>;

/**
 * PUT /api/folders/:id - Update folder
 */
export interface UpdateFolderRequest extends UpdateFolderInput {}

export type UpdateFolderResponse = ApiResponse<Folder>;

/**
 * DELETE /api/folders/:id - Delete folder
 */
export interface DeleteFolderRequest {
  readonly id: string;
  readonly deleteFiles?: boolean; // Delete contained files or move to parent
}

export type DeleteFolderResponse = ApiResponse<{ deleted: boolean }>;

/**
 * POST /api/folders/:id/move - Move folder to new parent
 */
export interface MoveFolderRequest {
  readonly id: string;
  readonly newParentId?: string; // null for root level
  readonly newPosition?: number; // Sort order
}

export type MoveFolderResponse = ApiResponse<Folder>;

/**
 * POST /api/folders/:id/generate-link - Generate upload link for folder
 */
export interface GenerateFolderLinkRequest {
  readonly id: string;
  readonly linkSettings: Pick<
    CreateUploadLinkInput,
    | 'title'
    | 'description'
    | 'requireEmail'
    | 'requirePassword'
    | 'isPublic'
    | 'expiresAt'
  >;
}

export type GenerateFolderLinkResponse = ApiResponse<UploadLink>;

// =============================================================================
// FILE MANAGEMENT API ENDPOINTS
// =============================================================================

/**
 * GET /api/files - List user's files
 */
export interface ListFilesRequest {
  readonly linkId?: string;
  readonly folderId?: string;
  readonly batchId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly fileType?: string;
  readonly sortBy?: 'createdAt' | 'fileName' | 'fileSize' | 'downloadCount';
  readonly sortOrder?: 'asc' | 'desc';
  readonly includeArchived?: boolean;
}

export type ListFilesResponse = ApiResponse<PaginatedResponse<FileUpload>>;

/**
 * GET /api/files/:id - Get file details
 */
export interface GetFileRequest {
  readonly id: string;
  readonly includeDownloadUrl?: boolean;
}

export type GetFileResponse = ApiResponse<FileUpload>;

/**
 * POST /api/files/:id/move - Move file to different folder
 */
export interface MoveFileRequest {
  readonly id: string;
  readonly targetFolderId?: string; // null for root level
}

export type MoveFileResponse = ApiResponse<FileUpload>;

/**
 * POST /api/files/bulk-move - Move multiple files
 */
export interface BulkMoveFilesRequest {
  readonly fileIds: string[];
  readonly targetFolderId?: string;
}

export type BulkMoveFilesResponse = ApiResponse<{ movedCount: number }>;

/**
 * DELETE /api/files/:id - Delete file
 */
export interface DeleteFileRequest {
  readonly id: string;
  readonly permanent?: boolean;
}

export type DeleteFileResponse = ApiResponse<{ deleted: boolean }>;

/**
 * POST /api/files/:id/download-url - Generate secure download URL
 */
export interface GenerateDownloadUrlRequest {
  readonly id: string;
  readonly expiresIn?: number; // seconds, default 3600 (1 hour)
}

export type GenerateDownloadUrlResponse = ApiResponse<{
  readonly downloadUrl: string;
  readonly expiresAt: Date;
}>;

// =============================================================================
// ANALYTICS API ENDPOINTS
// =============================================================================

/**
 * GET /api/analytics/dashboard - Dashboard overview analytics
 */
export interface GetDashboardAnalyticsRequest {
  readonly period?: AnalyticsPeriod;
}

export type GetDashboardAnalyticsResponse = ApiResponse<DashboardOverview>;

/**
 * GET /api/analytics/links/:id - Link-specific analytics
 */
export interface GetLinkAnalyticsRequest {
  readonly id: string;
  readonly period?: AnalyticsPeriod;
  readonly includeAccess?: boolean;
  readonly includeFiles?: boolean;
}

export type GetLinkAnalyticsResponse = ApiResponse<{
  readonly link: UploadLink;
  readonly uploadTrends: Array<{
    readonly date: Date;
    readonly uploads: number;
    readonly files: number;
    readonly size: number;
  }>;
  readonly accessAnalytics?: AccessAnalytics;
  readonly topUploaders: Array<{
    readonly name: string;
    readonly uploadCount: number;
    readonly totalSize: number;
  }>;
  readonly fileTypeDistribution: Record<string, number>;
}>;

/**
 * GET /api/analytics/usage - User usage analytics
 */
export interface GetUsageAnalyticsRequest {
  readonly period?: AnalyticsPeriod;
}

export interface GetUsageAnalyticsResponse
  extends ApiResponse<{
    readonly currentTier: SubscriptionTier;
    readonly usage: {
      readonly totalLinks: number;
      readonly totalFiles: number;
      readonly totalSize: number; // bytes
      readonly monthlyUploads: number;
    };
    readonly limits: {
      readonly maxLinks?: number;
      readonly maxFiles?: number;
      readonly maxSize?: number; // bytes
      readonly maxMonthlyUploads?: number;
    };
    readonly trends: Array<{
      readonly date: Date;
      readonly uploads: number;
      readonly storage: number;
    }>;
  }> {}

// =============================================================================
// ACCESS LOG API ENDPOINTS
// =============================================================================

/**
 * GET /api/access-logs - List access logs
 */
export interface ListAccessLogsRequest {
  readonly linkId?: string;
  readonly fileId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly accessType?: string;
  readonly flaggedOnly?: boolean;
}

export type ListAccessLogsResponse = ApiResponse<
  PaginatedResponse<LinkAccessLog>
>;

/**
 * POST /api/access-logs - Create access log (internal/public endpoint)
 */
export interface CreateAccessLogRequest extends CreateAccessLogInput {}

export type CreateAccessLogResponse = ApiResponse<LinkAccessLog>;

// =============================================================================
// BATCH OPERATIONS API ENDPOINTS
// =============================================================================

/**
 * GET /api/batches - List upload batches
 */
export interface ListBatchesRequest {
  readonly linkId?: string;
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

export type ListBatchesResponse = ApiResponse<PaginatedResponse<UploadBatch>>;

/**
 * GET /api/batches/statistics - Batch processing statistics
 */
export type GetBatchStatisticsResponse = ApiResponse<BatchStatistics>;

/**
 * POST /api/batches/:id/reprocess - Reprocess failed batch
 */
export interface ReprocessBatchRequest {
  readonly id: string;
  readonly retryFailedOnly?: boolean;
}

export type ReprocessBatchResponse = ApiResponse<UploadBatch>;

// =============================================================================
// USER MANAGEMENT API ENDPOINTS
// =============================================================================

/**
 * GET /api/user/profile - Get user profile
 */
export type GetUserProfileResponse = ApiResponse<{
  readonly id: string;
  readonly email: EmailAddress;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly avatarUrl?: string;
  readonly subscriptionTier: SubscriptionTier;
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
}>;

/**
 * PUT /api/user/profile - Update user profile
 */
export interface UpdateUserProfileRequest {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly avatarUrl?: string;
}

export type UpdateUserProfileResponse = ApiResponse<{
  readonly updated: boolean;
}>;

/**
 * GET /api/user/subscription - Get subscription details
 */
export interface GetSubscriptionResponse
  extends ApiResponse<{
    readonly tier: SubscriptionTier;
    readonly status: 'active' | 'canceled' | 'past_due' | 'unpaid';
    readonly currentPeriodStart: Date;
    readonly currentPeriodEnd: Date;
    readonly cancelAtPeriodEnd: boolean;
    readonly usage: {
      readonly links: number;
      readonly files: number;
      readonly storage: number; // bytes
    };
    readonly limits: {
      readonly maxLinks?: number;
      readonly maxFiles?: number;
      readonly maxStorage?: number; // bytes
    };
  }> {}

// =============================================================================
// WEBHOOKS AND INTEGRATIONS
// =============================================================================

/**
 * Webhook payload for upload events
 */
export interface UploadWebhookPayload {
  readonly event: 'upload.completed' | 'upload.failed' | 'batch.completed';
  readonly timestamp: Date;
  readonly linkId: string;
  readonly batchId?: string;
  readonly fileId?: string;
  readonly uploader: UploaderInfo;
  readonly data: {
    readonly fileCount?: number;
    readonly totalSize?: number;
    readonly processingTime?: number; // seconds
    readonly errors?: string[];
  };
}

/**
 * Clerk webhook payload for user events
 */
export interface ClerkWebhookPayload {
  readonly event: 'user.created' | 'user.updated' | 'user.deleted';
  readonly data: {
    readonly id: string;
    readonly email: EmailAddress;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly avatarUrl?: string;
  };
  readonly timestamp: Date;
}

// =============================================================================
// EXPORT ALL API TYPES
// =============================================================================

export type * from './index';
