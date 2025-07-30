'use server';

import { auth } from '@clerk/nextjs/server';
import { 
  getUserStorageDashboard,
  canUserUpload,
  type UserStorageInfo,
  type StorageValidationResult,
} from '@/lib/services/storage/storage-tracking-service';
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
 */
export async function getStorageDashboardAction(
  userPlanKey: string = 'free'
): Promise<StorageActionResult<UserStorageInfo>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const storageInfo = await getUserStorageDashboard(userId, userPlanKey);

    return {
      success: true,
      data: storageInfo,
    };
  } catch (error) {
    logger.error('Failed to get storage dashboard', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get storage dashboard',
    };
  }
}

/**
 * Check if user can upload a file of given size
 * Server action to safely validate uploads from client components
 */
export async function validateUploadAction(
  fileSizeBytes: number,
  userPlanKey: string = 'free'
): Promise<StorageActionResult<StorageValidationResult>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { 
        success: false, 
        error: 'Unauthorized',
        data: {
          canUpload: false,
          reason: 'User not authenticated',
          wouldExceedLimit: true,
          currentUsage: 0,
          newTotal: fileSizeBytes,
          limit: 0,
        }
      };
    }

    const validationResult = await canUserUpload(userId, fileSizeBytes, userPlanKey);

    return {
      success: true,
      data: validationResult,
    };
  } catch (error) {
    logger.error('Failed to validate upload', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate upload',
      data: {
        canUpload: false,
        reason: 'Error validating storage limits',
        wouldExceedLimit: true,
        currentUsage: 0,
        newTotal: fileSizeBytes,
        limit: 0,
      }
    };
  }
}

/**
 * Validate multiple files for upload
 * Server action to check if multiple files can be uploaded within storage limits
 */
export async function validateMultipleFilesAction(
  fileSizes: number[],
  userPlanKey: string = 'free'
): Promise<StorageActionResult<{
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
}>> {
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
        }
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

    // Get plan limits for file size validation
    const { getPlanLimits } = await import('@/lib/services/billing/plan-limits-service');
    const planLimitsResult = await getPlanLimits(userPlanKey);
    
    if (!planLimitsResult.success) {
      return {
        success: false,
        error: 'Failed to get plan limits',
        data: {
          valid: false,
          reason: 'Could not verify plan limits',
          totalSize,
          exceedsLimit: true,
        }
      };
    }

    const planLimits = planLimitsResult.data!;
    const invalidFiles: Array<{ index: number; size: number; reason: string }> = [];

    // Check each file against plan's max file size
    fileSizes.forEach((size, index) => {
      if (size > planLimits.maxFileSize) {
        invalidFiles.push({
          index,
          size,
          reason: `File exceeds ${planLimits.maxFileSizeMb}MB limit for ${userPlanKey} plan`
        });
      }
    });

    // If any files exceed the size limit, return invalid
    if (invalidFiles.length > 0) {
      return {
        success: true,
        data: {
          valid: false,
          reason: `${invalidFiles.length} file(s) exceed your plan's ${planLimits.maxFileSizeMb}MB size limit`,
          totalSize,
          exceedsLimit: false, // This is about storage quota, not file size
          invalidFiles,
          maxFileSize: planLimits.maxFileSize,
        },
      };
    }

    // Now check total storage quota
    const validation = await canUserUpload(userId, totalSize, userPlanKey);

    return {
      success: true,
      data: {
        valid: validation.canUpload,
        ...(validation.reason && { reason: validation.reason }),
        totalSize,
        exceedsLimit: validation.wouldExceedLimit,
        maxFileSize: planLimits.maxFileSize,
      },
    };
  } catch (error) {
    logger.error('Failed to validate multiple files', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate files',
      data: {
        valid: false,
        reason: 'Validation error occurred',
        totalSize: fileSizes.reduce((sum, size) => sum + size, 0),
        exceedsLimit: true,
      }
    };
  }
}