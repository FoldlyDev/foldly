// =============================================================================
// API TYPES - Request/Response Types for API Interactions
// =============================================================================
// 🎯 2025 Best Practice: Centralized API types for consistent communication

import type {
  DatabaseResult,
  PaginatedResponse,
  PaginationParams,
  SortParams,
  FilterParams,
} from './common';
import type {
  Link,
  LinkInsert,
  LinkUpdate,
  LinkWithStats,
  LinkWithFiles,
  LinkWithFolders,
} from './links';
import type { User, UserInsert, UserUpdate, UserProfile } from './users';
import type { File, FileInsert, FileUpdate, FileWithMetadata } from './files';
import type {
  Folder,
  FolderInsert,
  FolderUpdate,
  FolderWithContents,
} from './folders';
import type {
  Batch,
  BatchInsert,
  BatchUpdate,
  BatchWithFiles,
} from './batches';
import type { Workspace, WorkspaceInsert, WorkspaceUpdate } from './workspaces';

// =============================================================================
// GENERIC API TYPES - Common patterns for all API endpoints
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Generic API error response
 */
export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
    field?: string;
  };
  timestamp: string;
}

/**
 * Generic API result type
 */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T>
  extends ApiResponse<PaginatedResponse<T>> {
  data: PaginatedResponse<T>;
}

/**
 * Generic list query parameters
 */
export interface ListQueryParams extends PaginationParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

// =============================================================================
// USER API TYPES - User-related API endpoints
// =============================================================================

/**
 * User profile response
 */
export interface UserProfileResponse extends ApiResponse<UserProfile> {}

/**
 * User list response
 */
export interface UserListResponse extends PaginatedApiResponse<User> {}

/**
 * User creation request
 */
export interface CreateUserRequest {
  userData: UserInsert;
}

/**
 * User update request
 */
export interface UpdateUserRequest {
  userId: string;
  userData: UserUpdate;
}

/**
 * User query parameters
 */
export interface UserQueryParams extends ListQueryParams {
  subscriptionTier?: string;
  storageUsed?: string;
  createdDateRange?: string;
}

// =============================================================================
// WORKSPACE API TYPES - Workspace-related API endpoints
// =============================================================================

/**
 * Workspace response
 */
export interface WorkspaceResponse extends ApiResponse<Workspace> {}

/**
 * Workspace list response
 */
export interface WorkspaceListResponse
  extends PaginatedApiResponse<Workspace> {}

/**
 * Workspace creation request
 */
export interface CreateWorkspaceRequest {
  workspaceData: WorkspaceInsert;
}

/**
 * Workspace update request
 */
export interface UpdateWorkspaceRequest {
  workspaceId: string;
  workspaceData: WorkspaceUpdate;
}

// =============================================================================
// LINK API TYPES - Link-related API endpoints
// =============================================================================

/**
 * Link response
 */
export interface LinkResponse extends ApiResponse<Link> {}

/**
 * Link with stats response
 */
export interface LinkWithStatsResponse extends ApiResponse<LinkWithStats> {}

/**
 * Link with files response
 */
export interface LinkWithFilesResponse extends ApiResponse<LinkWithFiles> {}

/**
 * Link with folders response
 */
export interface LinkWithFoldersResponse extends ApiResponse<LinkWithFolders> {}

/**
 * Links list response
 */
export interface LinksListResponse extends PaginatedApiResponse<Link> {}

/**
 * Link creation request
 */
export interface CreateLinkRequest {
  linkData: LinkInsert;
}

/**
 * Link update request
 */
export interface UpdateLinkRequest {
  linkId: string;
  linkData: LinkUpdate;
}

/**
 * Link query parameters
 */
export interface LinkQueryParams extends ListQueryParams {
  linkType?: string;
  isPublic?: boolean;
  isActive?: boolean;
  requireEmail?: boolean;
  requirePassword?: boolean;
  brandEnabled?: boolean;
  isExpired?: boolean;
  createdDateRange?: string;
  lastUploadDateRange?: string;
  fileSizeRange?: string;
  fileCountRange?: string;
  include?: string; // comma-separated list of relations to include
}

/**
 * Link password verification request
 */
export interface VerifyLinkPasswordRequest {
  linkId: string;
  password: string;
}

/**
 * Link password verification response
 */
export interface VerifyLinkPasswordResponse
  extends ApiResponse<{ valid: boolean }> {}

/**
 * Link analytics request
 */
export interface LinkAnalyticsRequest {
  linkId: string;
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
}

/**
 * Link analytics response
 */
export interface LinkAnalyticsResponse
  extends ApiResponse<{
    views: Array<{ date: string; count: number }>;
    uploads: Array<{ date: string; count: number }>;
    totalViews: number;
    totalUploads: number;
    uniqueVisitors: number;
  }> {}

// =============================================================================
// FILE API TYPES - File-related API endpoints
// =============================================================================

/**
 * File response
 */
export interface FileResponse extends ApiResponse<File> {}

/**
 * File with metadata response
 */
export interface FileWithMetadataResponse
  extends ApiResponse<FileWithMetadata> {}

/**
 * Files list response
 */
export interface FilesListResponse extends PaginatedApiResponse<File> {}

/**
 * File upload request
 */
export interface FileUploadRequest {
  file: File;
  linkId: string;
  folderId?: string;
  batchId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * File upload response
 */
export interface FileUploadResponse
  extends ApiResponse<{
    file: File;
    uploadUrl: string;
    uploadHeaders: Record<string, string>;
  }> {}

/**
 * File update request
 */
export interface UpdateFileRequest {
  fileId: string;
  fileData: FileUpdate;
}

/**
 * File query parameters
 */
export interface FileQueryParams extends ListQueryParams {
  linkId?: string;
  batchId?: string;
  folderId?: string;
  status?: string;
  mimeType?: string;
  typeCategory?: string;
  isPublic?: boolean;
  hasPreview?: boolean;
  hasThumbnail?: boolean;
  fileSizeRange?: string;
  dimensionsRange?: string;
  durationRange?: string;
  createdDateRange?: string;
  downloadCountRange?: string;
  isExpired?: boolean;
  include?: string;
}

/**
 * File download request
 */
export interface FileDownloadRequest {
  fileId: string;
  download?: boolean; // true for download, false for inline
}

/**
 * File download response
 */
export interface FileDownloadResponse
  extends ApiResponse<{
    downloadUrl: string;
    expires: string;
    filename: string;
    mimeType: string;
    size: number;
  }> {}

/**
 * Bulk file operation request
 */
export interface BulkFileOperationRequest {
  fileIds: string[];
  operation: 'move' | 'delete' | 'archive' | 'public' | 'private';
  targetFolderId?: string;
}

/**
 * Bulk file operation response
 */
export interface BulkFileOperationResponse
  extends ApiResponse<{
    successful: string[];
    failed: Array<{ id: string; error: string }>;
  }> {}

// =============================================================================
// FOLDER API TYPES - Folder-related API endpoints
// =============================================================================

/**
 * Folder response
 */
export interface FolderResponse extends ApiResponse<Folder> {}

/**
 * Folder with contents response
 */
export interface FolderWithContentsResponse
  extends ApiResponse<FolderWithContents> {}

/**
 * Folders list response
 */
export interface FoldersListResponse extends PaginatedApiResponse<Folder> {}

/**
 * Folder creation request
 */
export interface CreateFolderRequest {
  folderData: FolderInsert;
}

/**
 * Folder update request
 */
export interface UpdateFolderRequest {
  folderId: string;
  folderData: FolderUpdate;
}

/**
 * Folder query parameters
 */
export interface FolderQueryParams extends ListQueryParams {
  linkId?: string;
  parentFolderId?: string;
  isArchived?: boolean;
  isPublic?: boolean;
  depth?: number;
  depthRange?: string;
  fileCountRange?: string;
  sizeRange?: string;
  createdDateRange?: string;
  hasFiles?: boolean;
  hasSubfolders?: boolean;
  include?: string;
}

/**
 * Folder tree request
 */
export interface FolderTreeRequest {
  linkId: string;
  maxDepth?: number;
  includeFiles?: boolean;
}

/**
 * Folder tree response
 */
export interface FolderTreeResponse
  extends ApiResponse<{
    root: FolderWithContents;
    tree: Array<FolderWithContents>;
    maxDepth: number;
    totalFolders: number;
    totalFiles: number;
  }> {}

// =============================================================================
// BATCH API TYPES - Batch upload-related API endpoints
// =============================================================================

/**
 * Batch response
 */
export interface BatchResponse extends ApiResponse<Batch> {}

/**
 * Batch with files response
 */
export interface BatchWithFilesResponse extends ApiResponse<BatchWithFiles> {}

/**
 * Batches list response
 */
export interface BatchesListResponse extends PaginatedApiResponse<Batch> {}

/**
 * Batch creation request
 */
export interface CreateBatchRequest {
  batchData: BatchInsert;
}

/**
 * Batch update request
 */
export interface UpdateBatchRequest {
  batchId: string;
  batchData: BatchUpdate;
}

/**
 * Batch query parameters
 */
export interface BatchQueryParams extends ListQueryParams {
  linkId?: string;
  folderId?: string;
  status?: string;
  createdDateRange?: string;
  completedDateRange?: string;
  fileSizeRange?: string;
  fileCountRange?: string;
  hasErrors?: boolean;
  include?: string;
}

/**
 * Batch retry request
 */
export interface RetryBatchRequest {
  batchId: string;
  retryFailedOnly?: boolean;
}

/**
 * Batch retry response
 */
export interface RetryBatchResponse
  extends ApiResponse<{
    batch: Batch;
    retryCount: number;
    retriedFiles: string[];
  }> {}

// =============================================================================
// UPLOAD API TYPES - File upload-related API endpoints
// =============================================================================

/**
 * Upload initiation request
 */
export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  linkId: string;
  folderId?: string;
  batchId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Upload initiation response
 */
export interface InitiateUploadResponse
  extends ApiResponse<{
    uploadId: string;
    uploadUrl: string;
    uploadHeaders: Record<string, string>;
    chunkSize: number;
    totalChunks: number;
    expiresAt: string;
  }> {}

/**
 * Upload chunk request
 */
export interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  chunk: Blob;
  checksum: string;
}

/**
 * Upload chunk response
 */
export interface UploadChunkResponse
  extends ApiResponse<{
    chunkIndex: number;
    uploaded: boolean;
    nextChunkIndex: number;
    completedChunks: number;
    totalChunks: number;
    progressPercentage: number;
  }> {}

/**
 * Complete upload request
 */
export interface CompleteUploadRequest {
  uploadId: string;
  checksum: string;
  metadata?: Record<string, unknown>;
}

/**
 * Complete upload response
 */
export interface CompleteUploadResponse
  extends ApiResponse<{
    file: File;
    processingStatus: string;
    estimatedProcessingTime: number;
  }> {}

/**
 * Upload progress response
 */
export interface UploadProgressResponse
  extends ApiResponse<{
    uploadId: string;
    fileName: string;
    fileSize: number;
    uploadedBytes: number;
    progressPercentage: number;
    uploadSpeed: number;
    timeRemaining: number;
    status: string;
  }> {}

// =============================================================================
// ANALYTICS API TYPES - Analytics-related API endpoints
// =============================================================================

/**
 * Analytics query parameters
 */
export interface AnalyticsQueryParams {
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  timezone?: string;
  filters?: Record<string, unknown>;
}

/**
 * Dashboard analytics response
 */
export interface DashboardAnalyticsResponse
  extends ApiResponse<{
    summary: {
      totalLinks: number;
      totalFiles: number;
      totalViews: number;
      totalUploads: number;
      storageUsed: number;
      storageLimit: number;
    };
    trends: {
      linksCreated: Array<{ date: string; count: number }>;
      filesUploaded: Array<{ date: string; count: number }>;
      pageViews: Array<{ date: string; count: number }>;
      storageUsed: Array<{ date: string; bytes: number }>;
    };
    topLinks: Array<{
      id: string;
      title: string;
      views: number;
      uploads: number;
    }>;
    recentActivity: Array<{
      type: 'link_created' | 'file_uploaded' | 'link_viewed';
      timestamp: string;
      details: Record<string, unknown>;
    }>;
  }> {}

// =============================================================================
// SEARCH API TYPES - Search-related API endpoints
// =============================================================================

/**
 * Search request
 */
export interface SearchRequest {
  query: string;
  type?: 'links' | 'files' | 'folders' | 'all';
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

/**
 * Search response
 */
export interface SearchResponse
  extends ApiResponse<{
    results: Array<{
      type: 'link' | 'file' | 'folder';
      id: string;
      title: string;
      description?: string;
      url: string;
      score: number;
      highlights?: Record<string, string[]>;
      metadata?: Record<string, unknown>;
    }>;
    total: number;
    query: string;
    took: number;
    facets?: Record<string, Array<{ value: string; count: number }>>;
  }> {}

// =============================================================================
// WEBHOOK API TYPES - Webhook-related API endpoints
// =============================================================================

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'link.created'
  | 'link.updated'
  | 'link.deleted'
  | 'file.uploaded'
  | 'file.processed'
  | 'file.downloaded'
  | 'batch.completed'
  | 'batch.failed';

/**
 * Webhook payload
 */
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Webhook delivery response
 */
export interface WebhookDeliveryResponse
  extends ApiResponse<{
    delivered: boolean;
    deliveryId: string;
    attempts: number;
    nextRetry?: string;
  }> {}

// =============================================================================
// HEALTH API TYPES - Health check and status endpoints
// =============================================================================

/**
 * Health check response
 */
export interface HealthCheckResponse
  extends ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<
      string,
      {
        status: 'up' | 'down' | 'degraded';
        responseTime: number;
        lastCheck: string;
        error?: string;
      }
    >;
    version: string;
    uptime: number;
    timestamp: string;
  }> {}

/**
 * System status response
 */
export interface SystemStatusResponse
  extends ApiResponse<{
    database: {
      connected: boolean;
      responseTime: number;
      activeConnections: number;
      maxConnections: number;
    };
    storage: {
      provider: string;
      available: boolean;
      totalSpace: number;
      usedSpace: number;
      freeSpace: number;
    };
    cache: {
      connected: boolean;
      hitRate: number;
      memoryUsage: number;
    };
    queues: {
      processing: number;
      waiting: number;
      failed: number;
    };
  }> {}

// =============================================================================
// TYPE GUARDS - Runtime type checking for API responses
// =============================================================================

/**
 * Type guard for API success responses
 */
export const isApiSuccess = <T>(
  response: ApiResult<T>
): response is ApiResponse<T> => {
  return response.success === true;
};

/**
 * Type guard for API error responses
 */
export const isApiError = <T>(response: ApiResult<T>): response is ApiError => {
  return response.success === false;
};

/**
 * Type guard for paginated responses
 */
export const isPaginatedResponse = <T>(
  response: ApiResponse<T | PaginatedResponse<T>>
): response is PaginatedApiResponse<T> => {
  return (
    typeof response.data === 'object' &&
    response.data !== null &&
    'data' in response.data &&
    'meta' in response.data
  );
};

// =============================================================================
// HELPER FUNCTIONS - API response utilities
// =============================================================================

/**
 * Extract data from API response
 */
export const extractApiData = <T>(response: ApiResult<T>): T | null => {
  return isApiSuccess(response) ? response.data : null;
};

/**
 * Extract error from API response
 */
export const extractApiError = <T>(response: ApiResult<T>): string | null => {
  return isApiError(response) ? response.error.message : null;
};

/**
 * Create API response
 */
export const createApiResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message !== undefined) {
    response.message = message;
  }

  return response;
};

/**
 * Create API error response
 */
export const createApiError = (
  message: string,
  code: string,
  details?: Record<string, unknown>
): ApiError => {
  const error: ApiError['error'] = {
    message,
    code,
  };

  if (details !== undefined) {
    error.details = details;
  }

  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
};
