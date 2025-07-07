// API Infrastructure Types - Generic API patterns and utilities
// Standard response wrappers, versioning, and route patterns for all endpoints
// Following 2025 TypeScript best practices with strict type safety

import type { ErrorCode } from './errors';

import type { DeepReadonly } from './utils';

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

/**
 * Generic API request with common fields
 */
export interface BaseApiRequest {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Generic API error response
 */
export interface ApiError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly field?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Webhook payload base structure
 */
export interface WebhookPayload<T = unknown> {
  readonly event: string;
  readonly timestamp: Date;
  readonly data: T;
}
