'use server';

import { auth } from '@clerk/nextjs/server';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';
import { logger } from '@/lib/services/logging/logger';

// =============================================================================
// TYPES
// =============================================================================

interface StorageActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// STORAGE SERVER ACTIONS
// =============================================================================

/**
 * Get user storage dashboard data
 * Server action to safely access storage service from client components
 * Plan is determined from Clerk - no planKey parameter needed
 */
export async function getStorageDashboardAction(): Promise<StorageActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Use centralized storage service that gets plan from Clerk
    const result = await storageQuotaService.getUserStorageInfo(userId);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    logger.error('Failed to get storage dashboard', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get storage dashboard',
    };
  }
}

/**
 * Check if user can upload a file of given size
 * Server action to safely validate uploads from client components
 * Plan is determined from Clerk - no planKey parameter needed
 */
export async function validateUploadAction(
  fileSizeBytes: number
): Promise<StorageActionResult<any>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // Use checkUserQuota from centralized service
    const result = await storageQuotaService.checkUserQuota(
      userId,
      fileSizeBytes
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      data: {
        canUpload: result.data?.allowed || false,
        reason: result.data?.message,
        wouldExceedLimit: !result.data?.allowed || false,
        currentUsage: result.data?.storageUsed || 0,
        newTotal: (result.data?.storageUsed || 0) + fileSizeBytes,
        limit: result.data?.storageLimit || 0,
      },
    };
  } catch (error) {
    logger.error('Failed to validate upload', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to validate upload',
    };
  }
}

/**
 * Validate multiple files for upload
 * Server action to check if multiple files can be uploaded within storage limits
 * Plan is determined from Clerk - no planKey parameter needed
 */
export async function validateMultipleFilesAction(
  fileSizes: number[]
): Promise<
  StorageActionResult<{
    valid: boolean;
    reason?: string;
    totalSize: number;
    exceedsLimit: boolean;
    invalidFiles?: Array<{
      index: number;
      size: number;
      reason: string;
    }>;
    maxFileSize?: number;
  }>
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
        data: {
          valid: false,
          reason: 'User not authenticated',
          totalSize: 0,
          exceedsLimit: true,
        },
      };
    }

    const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

    if (totalSize === 0) {
      return {
        success: true,
        data: {
          valid: false,
          reason: 'No files selected',
          totalSize: 0,
          exceedsLimit: false,
        },
      };
    }

    // Get user storage info to check plan limits
    const storageInfoResult = await storageQuotaService.getUserStorageInfo(userId);

    if (!storageInfoResult.success) {
      return {
        success: false,
        error: 'Failed to get storage info',
        data: {
          valid: false,
          reason: 'Could not verify storage limits',
          totalSize,
          exceedsLimit: true,
        },
      };
    }

    const storageInfo = storageInfoResult.data!;
    const maxFileSize = storageInfo.maxFileSize;
    const plan = storageInfo.plan;
    const invalidFiles: Array<{ index: number; size: number; reason: string }> =
      [];

    // Check each file against plan's max file size
    fileSizes.forEach((size, index) => {
      if (size > maxFileSize) {
        invalidFiles.push({
          index,
          size,
          reason: `File exceeds limit for ${plan} plan`,
        });
      }
    });

    // If any files exceed the size limit, return invalid
    if (invalidFiles.length > 0) {
      return {
        success: true,
        data: {
          valid: false,
          reason: `${invalidFiles.length} file(s) exceed your plan's size limit`,
          totalSize,
          exceedsLimit: false, // This is about storage quota, not file size
          invalidFiles,
          maxFileSize: maxFileSize,
        },
      };
    }

    // Now check total storage quota using centralized service
    const quotaResult = await storageQuotaService.checkUserQuota(userId, totalSize);

    if (!quotaResult.success) {
      return {
        success: false,
        error: quotaResult.error,
        data: {
          valid: false,
          reason: 'Failed to check storage quota',
          totalSize,
          exceedsLimit: true,
        },
      };
    }

    const quotaData = quotaResult.data!;

    return {
      success: true,
      data: {
        valid: quotaData.allowed,
        ...(quotaData.message && { reason: quotaData.message }),
        totalSize,
        exceedsLimit: !quotaData.allowed && quotaData.storageUsed + totalSize > quotaData.storageLimit,
        maxFileSize: maxFileSize,
      },
    };
  } catch (error) {
    logger.error('Failed to validate multiple files', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to validate files',
      data: {
        valid: false,
        reason: 'Validation error occurred',
        totalSize: fileSizes.reduce((sum, size) => sum + size, 0),
        exceedsLimit: true,
      },
    };
  }
}
