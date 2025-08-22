/**
 * Database error codes and messages for the links feature
 * Provides centralized error handling for database constraints
 */

export const DATABASE_ERROR_CODES = {
  // Slug consistency constraint
  SLUG_CONSISTENCY_VIOLATION: 'SLUG_CONSISTENCY_VIOLATION',
  // Duplicate link constraint
  DUPLICATE_LINK: 'DUPLICATE_LINK',
  // General database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export const DATABASE_ERROR_MESSAGES = {
  [DATABASE_ERROR_CODES.SLUG_CONSISTENCY_VIOLATION]:
    'All links must use the same slug as your base link. Please create a base link first or use the existing base link slug.',
  [DATABASE_ERROR_CODES.DUPLICATE_LINK]:
    'A link with this slug and topic already exists.',
  [DATABASE_ERROR_CODES.LINK_NOT_FOUND]: 'The requested link was not found.',
  [DATABASE_ERROR_CODES.VALIDATION_ERROR]: 'Invalid input data provided.',
  [DATABASE_ERROR_CODES.DATABASE_ERROR]:
    'An unexpected database error occurred.',
} as const;

// Type for the error codes
export type DatabaseErrorCode =
  (typeof DATABASE_ERROR_CODES)[keyof typeof DATABASE_ERROR_CODES];

/**
 * Helper function to detect constraint violation types from database errors
 */
export function detectConstraintViolation(
  error: Error
): DatabaseErrorCode | null {
  const message = error.message.toLowerCase();

  // Trigger-based slug consistency errors
  if (
    message.includes('all links must use the same slug') ||
    message.includes('cannot create topic/custom link without a base link')
  ) {
    return DATABASE_ERROR_CODES.SLUG_CONSISTENCY_VIOLATION;
  }

  // Legacy check constraint (if still exists)
  if (message.includes('links_slug_consistency_check')) {
    return DATABASE_ERROR_CODES.SLUG_CONSISTENCY_VIOLATION;
  }

  if (
    message.includes('links_slug_topic_idx') ||
    message.includes('duplicate key')
  ) {
    return DATABASE_ERROR_CODES.DUPLICATE_LINK;
  }

  return null;
}

/**
 * Helper function to get error message for a given error code
 */
export function getErrorMessage(code: DatabaseErrorCode): string {
  return DATABASE_ERROR_MESSAGES[code];
}
