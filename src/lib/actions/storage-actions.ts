'use server';

import { auth } from '@clerk/nextjs/server';
import { storageQuotaService } from '@/lib/services/storage/storage-quota-service';

/**
 * Get user's storage information
 * This is a thin wrapper that calls the service layer
 * No business logic here - just auth and service orchestration
 */
export async function getUserStorageInfoAction() {
  try {
    // Get authenticated user ID from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - please sign in',
      };
    }

    // Call the service layer to get storage info
    // All business logic is in the service
    const result = await storageQuotaService.getUserStorageInfo(userId);
    
    return result;
  } catch (error) {
    console.error('Error in getUserStorageInfoAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get storage information',
    };
  }
}

/**
 * Type export for the storage info response
 */
export type StorageInfoResponse = Awaited<ReturnType<typeof getUserStorageInfoAction>>;