// Foldly Types - Barrel File for Easy Imports
// Following 2025 best practices for type organization
// Import from here instead of individual type files

// =============================================================================
// CORE TYPES EXPORTS
// =============================================================================

// Global types and utilities
export * from './global';

// Database schema types
export * from './database';

// API request/response types (excluding conflicts)
export type {
  // Upload Link API
  ListUploadLinksRequest,
  ListUploadLinksResponse,
  GetUploadLinkRequest,
  GetUploadLinkResponse,
  CreateUploadLinkRequest,
  CreateUploadLinkResponse,
  UpdateUploadLinkRequest,
  UpdateUploadLinkResponse,
  DeleteUploadLinkRequest,
  DeleteUploadLinkResponse,
  DuplicateUploadLinkRequest,
  DuplicateUploadLinkResponse,

  // Public Upload API
  ResolveUploadLinkRequest,
  ResolveUploadLinkResponse,
  ValidatePasswordRequest,
  ValidatePasswordResponse,
  StartUploadBatchRequest,
  StartUploadBatchResponse,
  UploadFileRequest,
  UploadFileResponse,
  GetUploadProgressRequest,
  GetUploadProgressResponse,
  CompleteUploadBatchRequest,
  CompleteUploadBatchResponse,

  // Folder Management API
  ListFoldersRequest,
  ListFoldersResponse,
  CreateFolderResponse,
  UpdateFolderRequest,
  UpdateFolderResponse,
  DeleteFolderRequest,
  DeleteFolderResponse,
  MoveFolderRequest,
  MoveFolderResponse,
  GenerateFolderLinkRequest,
  GenerateFolderLinkResponse,

  // File Operations API
  ListFilesRequest,
  ListFilesResponse,
  GetFileRequest,
  GetFileResponse,
  MoveFileRequest,
  MoveFileResponse,
  BulkMoveFilesRequest,
  BulkMoveFilesResponse,
  DeleteFileRequest,
  DeleteFileResponse,
  GenerateDownloadUrlRequest,
  GenerateDownloadUrlResponse,

  // Analytics API
  GetDashboardAnalyticsRequest,
  GetDashboardAnalyticsResponse,
  GetLinkAnalyticsRequest,
  GetLinkAnalyticsResponse,
  GetUsageAnalyticsRequest,
  GetUsageAnalyticsResponse,

  // Access Logs API
  ListAccessLogsRequest,
  ListAccessLogsResponse,
  CreateAccessLogRequest,
  CreateAccessLogResponse,

  // Batch Operations API
  ListBatchesRequest,
  ListBatchesResponse,
  GetBatchStatisticsResponse,
  ReprocessBatchRequest,
  ReprocessBatchResponse,

  // User Management API
  GetUserProfileResponse,
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  GetSubscriptionResponse,

  // Webhooks - API version
  UploadWebhookPayload,
} from './api';

// Authentication and user types (excluding conflicts)
export type {
  // Core auth types
  UserId,
  SessionId,
  OrganizationId,
  PlatformRole,
  AuthContext,
  FoldlyUser,

  // User preferences and settings
  UserPreferences,
  ThemePreference,
  DashboardLayoutPreference,
  EmailNotificationSettings,
  PrivacySettings,
  ProfileVisibility,
  LinkSharingDefault,

  // Subscription types
  UserSubscription,
  SubscriptionStatus,

  // Auth state and session
  AuthState,
  SessionData,
  OrganizationData,
  ServerAuthContext,

  // Clerk integration
  ClerkWebhookEvent,
  ClerkWebhookEventType,
  ClerkUser,
  LegacySessionData,

  // Auth utilities
  AuthRedirect,
  AuthError,
  UserProfile,
} from './auth';

// Upload and file processing types
export * from './upload';

// UI component and feature types
export * from './features';
