// =============================================================================
// UNIFIED ERROR RESPONSE TYPE
// =============================================================================
// Standardized error response format for all server actions and API endpoints
// Following 2025 best practices for type-safe error handling

export interface ErrorResponse<T = unknown> {
  success: false;
  error: string;
  code?: string;
  details?: T;
  timestamp?: number;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp?: number;
    [key: string]: any;
  };
}

export type ActionResponse<T, E = unknown> = SuccessResponse<T> | ErrorResponse<E>;

// Error codes for common scenarios
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Storage errors
  STORAGE_ERROR: 'STORAGE_ERROR',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Security errors
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  PATH_TRAVERSAL: 'PATH_TRAVERSAL',
  INVALID_IP: 'INVALID_IP',
  
  // Webhook errors
  MISSING_HEADERS: 'MISSING_HEADERS',
  TIMESTAMP_INVALID: 'TIMESTAMP_INVALID',
  PAYLOAD_INVALID: 'PAYLOAD_INVALID',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  
  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Helper functions for creating responses
export function createSuccessResponse<T>(data: T, meta?: Record<string, any>): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta: { ...meta, timestamp: Date.now() } }),
  };
}

export function createErrorResponse<T = unknown>(
  error: string,
  code?: ErrorCode,
  details?: T
): ErrorResponse<T> {
  return {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
    timestamp: Date.now(),
  };
}

// Type guard for error responses
export function isErrorResponse<T, E>(
  response: ActionResponse<T, E>
): response is ErrorResponse<E> {
  return response.success === false;
}

// Type guard for success responses
export function isSuccessResponse<T, E>(
  response: ActionResponse<T, E>
): response is SuccessResponse<T> {
  return response.success === true;
}