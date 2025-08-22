// =============================================================================
// COMMON TYPES - Shared Patterns and Utilities
// =============================================================================
// 🎯 2025 Best Practice: Centralized common types for consistency

import type { LinkType, FileProcessingStatus, BatchStatus } from './enums';

// =============================================================================
// RESULT PATTERN - Type-safe error handling
// =============================================================================

/**
 * Success result type
 */
export interface SuccessResult<T> {
  success: true;
  data: T;
}

/**
 * Error result type with detailed error information
 */
export interface ErrorResult {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Database result type for consistent error handling
 */
export type DatabaseResult<T> = SuccessResult<T> | ErrorResult;

/**
 * Async result type for promises
 */
export type AsyncResult<T> = Promise<DatabaseResult<T>>;

// =============================================================================
// PAGINATION TYPES - Consistent pagination patterns
// =============================================================================

/**
 * Pagination parameters for database queries
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination metadata for responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// =============================================================================
// SORTING TYPES - Consistent sorting patterns
// =============================================================================

/**
 * Sort order enumeration
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sort parameters for database queries
 */
export interface SortParams<T extends string = string> {
  field: T;
  order: SortOrder;
}

/**
 * Multiple sort parameters
 */
export type MultiSortParams<T extends string = string> = SortParams<T>[];

// =============================================================================
// FILTERING TYPES - Consistent filtering patterns
// =============================================================================

/**
 * Filter operator types
 */
export type FilterOperator =
  | 'eq' // equals
  | 'ne' // not equals
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'like' // SQL LIKE
  | 'ilike' // case-insensitive LIKE
  | 'in' // IN array
  | 'nin' // NOT IN array
  | 'null' // IS NULL
  | 'nnull'; // IS NOT NULL

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

/**
 * Filter parameters for database queries
 */
export interface FilterParams {
  conditions: FilterCondition[];
  logic?: 'and' | 'or';
}

// =============================================================================
// ASYNC STATE MANAGEMENT - Loading states and error handling
// =============================================================================

/**
 * Loading state enumeration
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state with data and error handling
 */
export interface AsyncState<T = unknown, E = Error> {
  status: LoadingState;
  data: T | null;
  error: E | null;
  loading: boolean;
}

/**
 * Helper to create initial async state
 */
export const createAsyncState = <T = unknown, E = Error>(): AsyncState<
  T,
  E
> => ({
  status: 'idle',
  data: null,
  error: null,
  loading: false,
});

/**
 * Helper to create loading state
 */
export const createLoadingState = <T = unknown, E = Error>(): AsyncState<
  T,
  E
> => ({
  status: 'loading',
  data: null,
  error: null,
  loading: true,
});

/**
 * Helper to create success state
 */
export const createSuccessState = <T = unknown, E = Error>(
  data: T
): AsyncState<T, E> => ({
  status: 'success',
  data,
  error: null,
  loading: false,
});

/**
 * Helper to create error state
 */
export const createErrorState = <T = unknown, E = Error>(
  error: E
): AsyncState<T, E> => ({
  status: 'error',
  data: null,
  error,
  loading: false,
});

// =============================================================================
// SEARCH TYPES - Full-text search and filtering
// =============================================================================

/**
 * Search parameters
 */
export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
  caseSensitive?: boolean;
}

/**
 * Search result with highlighting
 */
export interface SearchResult<T> {
  item: T;
  score: number;
  highlights?: Record<string, string[]>;
}

// SearchResponse is defined in api.ts as it's an API response type

// =============================================================================
// AUDIT TYPES - Change tracking and history
// =============================================================================

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { from: unknown; to: unknown }>;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Trackable entity with audit fields
 */
export interface AuditableEntity {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// =============================================================================
// VALIDATION TYPES - Input validation and error handling
// =============================================================================

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation function type
 */
export type ValidatorFunction<T = unknown> = (value: T) => ValidationResult;

// =============================================================================
// TIMESTAMP TYPES - Consistent timestamp handling
// =============================================================================

/**
 * Timestamp fields for database entities
 */
export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Optional timestamp fields for partial updates
 */
export interface OptionalTimestampFields {
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================================================
// ID TYPES - Consistent ID handling
// =============================================================================

/**
 * UUID type for database IDs
 */
export type DatabaseId = string;

/**
 * Entity with ID
 */
export interface EntityWithId {
  id: DatabaseId;
}

/**
 * Reference to another entity
 */
export interface EntityReference {
  id: DatabaseId;
  type: string;
}

// =============================================================================
// STATISTICS TYPES - Common statistics patterns
// =============================================================================

/**
 * Basic count statistics
 */
export interface CountStats {
  total: number;
  active: number;
  inactive: number;
}

/**
 * Size statistics in bytes
 */
export interface SizeStats {
  totalSize: number;
  averageSize: number;
  minSize: number;
  maxSize: number;
}

/**
 * Time-based statistics
 */
export interface TimeStats {
  firstCreated: Date;
  lastCreated: Date;
  lastUpdated: Date;
}

/**
 * Combined statistics
 */
export interface EntityStats extends CountStats, SizeStats, TimeStats {
  type: string;
  entityId: string;
}

// =============================================================================
// UTILITY TYPES - Common utility patterns
// =============================================================================

/**
 * Make specific fields optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific fields required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Exclude timestamp fields
 */
export type WithoutTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>;

/**
 * Exclude system fields (id, timestamps)
 */
export type WithoutSystemFields<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Extract enum values
 */
export type EnumValues<T extends Record<string, string | number>> = T[keyof T];

// =============================================================================
// EXPORT HELPERS - Common patterns for exports
// =============================================================================

/**
 * Create a success result
 */
export const success = <T>(data: T): SuccessResult<T> => ({
  success: true,
  data,
});

/**
 * Create an error result
 */
export const error = (
  message: string,
  code?: string,
  details?: Record<string, unknown>
): ErrorResult => ({
  success: false,
  error: message,
  ...(code && { code }),
  ...(details && { details }),
});

/**
 * Type guard for success results
 */
export const isSuccess = <T>(
  result: DatabaseResult<T>
): result is SuccessResult<T> => result.success === true;

/**
 * Type guard for error results
 */
export const isError = <T>(result: DatabaseResult<T>): result is ErrorResult =>
  result.success === false;
