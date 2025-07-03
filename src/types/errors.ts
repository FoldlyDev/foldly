// Error Infrastructure Types - Application-wide error handling
// HTTP status-like error codes and error context for debugging
// Following 2025 TypeScript best practices with strict type safety

import type { UserId, LinkId, FileId } from './ids';

// =============================================================================
// CORE ERROR CONSTANTS
// =============================================================================

/**
 * HTTP status-like error codes for application-wide error handling
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

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const satisfies Record<string, string>;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

// =============================================================================
// ERROR CONTEXT TYPES
// =============================================================================

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
// TYPE GUARDS
// =============================================================================

export const isValidErrorCode = (code: unknown): code is ErrorCode => {
  return (
    typeof code === 'string' &&
    Object.values(ERROR_CODE).includes(code as ErrorCode)
  );
};
