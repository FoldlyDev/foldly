// Global Types for Foldly - Advanced Multi-Link File Collection Platform
// Following 2025 TypeScript best practices with strict type safety

// =============================================================================
// CORE ENUMS (ENHANCED WITH 2025 PATTERNS)
// =============================================================================

/**
 * Link types supported by the multi-link system
 * - base: General upload area (/username)
 * - custom: Topic-specific uploads (/username/topic)
 * - generated: Right-click folder link creation
 */
export const LINK_TYPE = {
  BASE: 'base',
  CUSTOM: 'custom',
  GENERATED: 'generated',
} as const satisfies Record<string, string>;

export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];

/**
 * @deprecated Use LINK_TYPE const object instead
 */
export enum LinkTypeEnum {
  BASE = 'base',
  CUSTOM = 'custom',
  GENERATED = 'generated',
}

/**
 * User roles with hierarchical permissions
 */
export const USER_ROLE = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const satisfies Record<string, string>;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * @deprecated Use USER_ROLE const object instead
 */
export enum UserRoleEnum {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * File processing states
 */
export const FILE_PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUARANTINED: 'quarantined',
} as const satisfies Record<string, string>;

export type FileProcessingStatus =
  (typeof FILE_PROCESSING_STATUS)[keyof typeof FILE_PROCESSING_STATUS];

/**
 * @deprecated Use FILE_PROCESSING_STATUS const object instead
 */
export enum FileProcessingStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  QUARANTINED = 'quarantined',
}

/**
 * Upload batch states
 */
export const BATCH_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial',
} as const satisfies Record<string, string>;

export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS];

/**
 * @deprecated Use BATCH_STATUS const object instead
 */
export enum BatchStatusEnum {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial',
}

/**
 * Access log types for audit trail
 */
export const ACCESS_TYPE = {
  VIEW: 'view',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  SHARE: 'share',
  DELETE: 'delete',
} as const satisfies Record<string, string>;

export type AccessType = (typeof ACCESS_TYPE)[keyof typeof ACCESS_TYPE];

/**
 * @deprecated Use ACCESS_TYPE const object instead
 */
export enum AccessTypeEnum {
  VIEW = 'view',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  SHARE = 'share',
  DELETE = 'delete',
}

/**
 * File classification levels
 */
export const DATA_CLASSIFICATION = {
  PUBLIC: 'public',
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  RESTRICTED: 'restricted',
} as const satisfies Record<string, string>;

export type DataClassification =
  (typeof DATA_CLASSIFICATION)[keyof typeof DATA_CLASSIFICATION];

/**
 * @deprecated Use DATA_CLASSIFICATION const object instead
 */
export enum DataClassificationEnum {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

/**
 * Subscription tiers
 */
export const SUBSCRIPTION_TIER = {
  FREE: 'free',
  PRO: 'pro',
  TEAM: 'team',
  ENTERPRISE: 'enterprise',
} as const satisfies Record<string, string>;

export type SubscriptionTier =
  (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

/**
 * @deprecated Use SUBSCRIPTION_TIER const object instead
 */
export enum SubscriptionTierEnum {
  FREE = 'free',
  PRO = 'pro',
  TEAM = 'team',
  ENTERPRISE = 'enterprise',
}

// =============================================================================
// BRANDED TYPES FOR ENHANCED TYPE SAFETY (2025 BEST PRACTICE)
// =============================================================================

export type UserId = string & { readonly __brand: 'UserId' };
export type LinkId = string & { readonly __brand: 'LinkId' };
export type FileId = string & { readonly __brand: 'FileId' };
export type FolderId = string & { readonly __brand: 'FolderId' };
export type BatchId = string & { readonly __brand: 'BatchId' };
export type SessionId = string & { readonly __brand: 'SessionId' };

// Enhanced color type with brand
export type HexColor = `#${string}` & { readonly __brand: 'HexColor' };

// Enhanced email type with brand
export type EmailAddress = `${string}@${string}.${string}` & {
  readonly __brand: 'EmailAddress';
};

// Enhanced URL types with brands
export type AbsoluteUrl = (`https://${string}` | `http://${string}`) & {
  readonly __brand: 'AbsoluteUrl';
};
export type RelativeUrl = `/${string}` & { readonly __brand: 'RelativeUrl' };
export type UploadUrl = (`/${string}` | `/${string}/${string}`) & {
  readonly __brand: 'UploadUrl';
};

// =============================================================================
// UTILITY TYPES (2025 ENHANCED)
// =============================================================================

/**
 * Standard timestamp fields for database entities
 */
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Optional timestamp fields for soft deletion
 */
export interface SoftDelete {
  readonly deletedAt?: Date;
}

/**
 * Standard ID field using branded UUID
 */
export interface WithId {
  readonly id: string; // UUID
}

/**
 * User reference field with branded type
 */
export interface WithUserId {
  readonly userId: UserId; // References Clerk user ID
}

/**
 * Standard database entity combining common fields
 */
export type BaseEntity = WithId & WithUserId & Timestamps;

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}

/**
 * API response wrapper with status
 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
  readonly timestamp: Date;
}

/**
 * File metadata structure
 */
export interface FileMetadata {
  readonly fileName: string;
  readonly originalFileName: string;
  readonly fileSize: number;
  readonly fileType: string;
  readonly mimeType: string;
  readonly md5Hash?: string;
  readonly sha256Hash?: string;
}

/**
 * Security warning structure
 */
export interface SecurityWarning {
  readonly type: 'file_type' | 'size' | 'malware' | 'suspicious_content';
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly recommendation?: string;
}

// =============================================================================
// FORM AND VALIDATION TYPES
// =============================================================================

/**
 * Common form field states
 */
export interface FormFieldState {
  readonly value: string;
  readonly error?: string;
  readonly isValid: boolean;
  readonly isLoading?: boolean;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: Record<string, string>;
}

/**
 * Advanced sorting options
 */
export interface SortOptions {
  readonly field: string;
  readonly direction: 'asc' | 'desc';
  readonly nullsLast?: boolean;
}

/**
 * Filter criteria for data queries
 */
export interface FilterCriteria {
  readonly field: string;
  readonly operator:
    | 'eq'
    | 'ne'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'in'
    | 'like'
    | 'between';
  readonly value: unknown;
}

// =============================================================================
// CONFIGURATION AND SETTINGS TYPES
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
}

/**
 * Uploader information collected during upload
 */
export interface UploaderInfo {
  readonly name: string;
  readonly email?: EmailAddress;
  readonly message?: string;
  readonly batchName?: string;
}

// =============================================================================
// ANALYTICS AND METRICS TYPES
// =============================================================================

/**
 * Usage statistics aggregation
 */
export interface UsageStats {
  readonly totalUploads: number;
  readonly totalFiles: number;
  readonly totalSize: number; // bytes
  readonly uniqueUploaders: number;
  readonly averageFilesPerUpload: number;
  readonly mostActiveLink?: string;
  readonly popularFileTypes: Record<string, number>;
}

/**
 * Analytics time period selector
 */
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all';

/**
 * Time-series data point for charts
 */
export interface AnalyticsDataPoint {
  readonly timestamp: Date;
  readonly value: number;
  readonly label?: string;
}

// =============================================================================
// NOTIFICATION SYSTEM TYPES
// =============================================================================

/**
 * Notification types for the system
 */
export const NOTIFICATION_TYPE = {
  UPLOAD_RECEIVED: 'upload_received',
  LINK_CREATED: 'link_created',
  STORAGE_WARNING: 'storage_warning',
  SECURITY_ALERT: 'security_alert',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
} as const satisfies Record<string, string>;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/**
 * @deprecated Use NOTIFICATION_TYPE const object instead
 */
export enum NotificationTypeEnum {
  UPLOAD_RECEIVED = 'upload_received',
  LINK_CREATED = 'link_created',
  STORAGE_WARNING = 'storage_warning',
  SECURITY_ALERT = 'security_alert',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
}

/**
 * Email template data structure
 */
export interface EmailTemplateData {
  readonly recipientName: string;
  readonly recipientEmail: EmailAddress;
  readonly subject: string;
  readonly templateVariables: Record<string, string | number | boolean>;
}

// =============================================================================
// ERROR HANDLING AND CODES
// =============================================================================

/**
 * Comprehensive error code system
 */
export const ERROR_CODE = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',

  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  MALWARE_DETECTED: 'MALWARE_DETECTED',

  // Link errors
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  LINK_EXPIRED: 'LINK_EXPIRED',
  LINK_DISABLED: 'LINK_DISABLED',
  PASSWORD_REQUIRED: 'PASSWORD_REQUIRED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const satisfies Record<string, string>;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

/**
 * @deprecated Use ERROR_CODE const object instead
 */
export enum ErrorCodeEnum {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  REQUIRED_FIELD = 'REQUIRED_FIELD',

  // File upload errors
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  MALWARE_DETECTED = 'MALWARE_DETECTED',

  // Link errors
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',
  LINK_EXPIRED = 'LINK_EXPIRED',
  LINK_DISABLED = 'LINK_DISABLED',
  PASSWORD_REQUIRED = 'PASSWORD_REQUIRED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

/**
 * Error context for debugging and logging
 */
export interface ErrorContext {
  readonly userId?: UserId;
  readonly linkId?: LinkId;
  readonly fileId?: FileId;
  readonly requestId?: string;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly timestamp: Date;
}

// =============================================================================
// TYPE GUARDS FOR RUNTIME SAFETY (2025 BEST PRACTICE)
// =============================================================================

export const isValidUserRole = (role: unknown): role is UserRole => {
  return (
    typeof role === 'string' &&
    Object.values(USER_ROLE).includes(role as UserRole)
  );
};

export const isValidLinkType = (type: unknown): type is LinkType => {
  return (
    typeof type === 'string' &&
    Object.values(LINK_TYPE).includes(type as LinkType)
  );
};

export const isValidSubscriptionTier = (
  tier: unknown
): tier is SubscriptionTier => {
  return (
    typeof tier === 'string' &&
    Object.values(SUBSCRIPTION_TIER).includes(tier as SubscriptionTier)
  );
};

export const isValidEmailAddress = (email: unknown): email is EmailAddress => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidHexColor = (color: unknown): color is HexColor => {
  return typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color);
};

export const isValidErrorCode = (code: unknown): code is ErrorCode => {
  return (
    typeof code === 'string' &&
    Object.values(ERROR_CODE).includes(code as ErrorCode)
  );
};

// =============================================================================
// ADDITIONAL 2025 UTILITY TYPES
// =============================================================================

export type NonEmptyArray<T> = [T, ...T[]];
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Template literal types for API routes
export type ApiRoute = `/api/${string}`;
export type UserRoute = `/user/${string}`;
export type AdminRoute = `/admin/${string}`;

// Discriminated unions for better type safety
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Utility type for exact object matching
export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type * from './index';
