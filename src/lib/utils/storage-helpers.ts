// =============================================================================
// STORAGE HELPERS - Storage Validation Utilities
// =============================================================================
// Reusable utilities for storage bucket configuration validation

import { logger } from './logger';
import { ERROR_MESSAGES } from '@/lib/constants';
import type { ActionResponse } from './action-helpers';

/**
 * Validate that a storage bucket is properly configured
 *
 * Used by file/folder actions before storage operations to ensure
 * bucket environment variables are set
 *
 * @param bucketName - The bucket name from environment variables
 * @param bucketType - Human-readable bucket type for error messages (e.g., 'Uploads', 'Branding')
 * @returns ActionResponse error if bucket not configured, null if valid
 *
 * @example
 * ```typescript
 * const error = validateBucketConfiguration(UPLOADS_BUCKET_NAME, 'Uploads');
 * if (error) return error;
 *
 * // Proceed with storage operation
 * await uploadFile({ bucket: UPLOADS_BUCKET_NAME, ... });
 * ```
 */
export function validateBucketConfiguration(
  bucketName: string | undefined,
  bucketType: string
): ActionResponse<never> | null {
  if (!bucketName) {
    logger.error(`${bucketType} bucket not configured`, {
      bucketType,
      envVarMissing: true,
    });

    return {
      success: false,
      error: ERROR_MESSAGES.STORAGE.NOT_CONFIGURED,
    } as const;
  }

  return null;
}
