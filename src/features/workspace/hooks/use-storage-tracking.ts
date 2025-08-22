'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';
import { 
  getStorageDashboardAction,
  validateUploadAction,
  validateMultipleFilesAction,
} from '../lib/actions/storage-actions';
import { type UserStorageInfo, type StorageValidationResult } from '@/lib/services/storage/storage-tracking-service';
import { formatBytes, getStorageQuotaStatus, shouldShowStorageWarning, type StorageQuotaStatus } from '../lib/utils/storage-utils';
import { workspaceQueryKeys } from '../lib/query-keys';
import { useUserPlan } from './use-user-plan';

// =============================================================================
// TYPES
// =============================================================================

export interface StorageTrackingData {
  storageInfo: UserStorageInfo;
  canUpload: (fileSize: number) => Promise<StorageValidationResult>;
  formatSize: (bytes: number) => string;
  refetchStorage: () => void;
  isLoading: boolean;
  error: Error | null;
}

// StorageQuotaStatus is now imported from utils

// =============================================================================
// STORAGE QUERY KEYS
// =============================================================================

export const storageQueryKeys = {
  all: ['storage'] as const,
  dashboard: (userId: string) => [...storageQueryKeys.all, 'dashboard', userId] as const,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Utility functions are now imported from utils file

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Hook for tracking user storage usage and quota management
 * Provides real-time storage information and validation functions
 */
export function useStorageTracking(): StorageTrackingData {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { planKey: userPlanKey } = useUserPlan();

  // Query for storage dashboard data using server action
  const {
    data: storageResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...storageQueryKeys.dashboard(user?.id || ''), userPlanKey],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      console.log('[useStorageTracking] Fetching storage for plan:', userPlanKey);
      const result = await getStorageDashboardAction(userPlanKey);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get storage dashboard');
      }
      console.log('[useStorageTracking] Storage result:', result.data);
      return result.data!;
    },
    enabled: !!user?.id && !!userPlanKey,
    staleTime: 1000 * 60 * 2, // 2 minutes - storage data changes frequently
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Extract storage info from server action result
  const storageInfo = storageResult;

  // Function to check if user can upload a file of given size using server action
  const canUpload = useCallback(
    async (fileSize: number): Promise<StorageValidationResult> => {
      if (!user?.id) {
        return {
          canUpload: false,
          reason: 'User not authenticated',
          wouldExceedLimit: true,
          currentUsage: 0,
          newTotal: fileSize,
          limit: 0,
        };
      }

      const result = await validateUploadAction(fileSize, userPlanKey);
      return result.data || {
        canUpload: false,
        reason: result.error || 'Validation failed',
        wouldExceedLimit: true,
        currentUsage: 0,
        newTotal: fileSize,
        limit: 0,
      };
    },
    [user?.id, userPlanKey]
  );

  // Function to format bytes to human-readable format
  const formatSize = useCallback((bytes: number) => {
    return formatBytes(bytes);
  }, []);

  // Function to manually refetch storage data
  const refetchStorage = useCallback(() => {
    refetch();
  }, [refetch]);

  // Default storage info if loading or error
  const defaultStorageInfo: UserStorageInfo = {
    userId: user?.id || '',
    storageUsedBytes: 0,
    storageLimitBytes: 50 * 1024 * 1024 * 1024, // 50GB default
    filesCount: 0,
    remainingBytes: 50 * 1024 * 1024 * 1024,
    usagePercentage: 0,
    planKey: userPlanKey,
  };

  return {
    storageInfo: storageInfo || defaultStorageInfo,
    canUpload,
    formatSize,
    refetchStorage,
    isLoading,
    error: error as Error | null,
  };
}

// =============================================================================
// HELPER HOOKS
// =============================================================================

/**
 * Hook for getting storage quota status
 */
export function useStorageQuotaStatus(): StorageQuotaStatus {
  const { storageInfo } = useStorageTracking();
  return getStorageQuotaStatus(storageInfo.usagePercentage);
}

/**
 * Hook for invalidating storage queries after file operations
 */
export function useInvalidateStorage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { planKey: userPlanKey } = useUserPlan();

  return useCallback(() => {
    if (user?.id) {
      // Invalidate storage data with the exact query key that includes plan
      queryClient.invalidateQueries({
        queryKey: [...storageQueryKeys.dashboard(user.id), userPlanKey],
      });

      // Also invalidate workspace tree data since file counts might have changed
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    }
  }, [queryClient, user?.id, userPlanKey]);
}

/**
 * Hook for pre-upload storage validation
 */
export function usePreUploadValidation() {
  const { user } = useUser();
  const { planKey: userPlanKey } = useUserPlan();
  const { formatSize } = useStorageTracking();

  return useCallback(
    async (files: File[] | FileList): Promise<{
      valid: boolean;
      reason?: string;
      totalSize: number;
      exceedsLimit: boolean;
      invalidFiles?: Array<{
        file: File;
        reason: string;
      }>;
      maxFileSize?: number;
    }> => {
      const fileArray = Array.from(files);
      const fileSizes = fileArray.map(file => file.size);
      const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);

      if (totalSize === 0) {
        return {
          valid: false,
          reason: 'No files selected',
          totalSize: 0,
          exceedsLimit: false,
        };
      }

      if (!user?.id) {
        return {
          valid: false,
          reason: 'User not authenticated',
          totalSize,
          exceedsLimit: true,
        };
      }

      const result = await validateMultipleFilesAction(fileSizes, userPlanKey);
      
      // If server returned invalid files, enhance the data with file references
      if (result.data?.invalidFiles && result.data.invalidFiles.length > 0) {
        const invalidFilesWithDetails = result.data.invalidFiles.map(invalid => {
          const file = fileArray[invalid.index];
          if (!file) {
            return null;
          }
          return {
            file,
            reason: `${file.name} (${formatSize(invalid.size)}) exceeds the ${userPlanKey} plan limit`
          };
        }).filter((item): item is { file: File; reason: string } => item !== null);

        const response: {
          valid: boolean;
          reason?: string;
          totalSize: number;
          exceedsLimit: boolean;
          invalidFiles?: Array<{ file: File; reason: string }>;
          maxFileSize?: number;
        } = {
          valid: result.data.valid,
          totalSize: result.data.totalSize,
          exceedsLimit: result.data.exceedsLimit,
        };
        
        if (result.data.reason) response.reason = result.data.reason;
        if (result.data.maxFileSize) response.maxFileSize = result.data.maxFileSize;
        if (invalidFilesWithDetails.length > 0) response.invalidFiles = invalidFilesWithDetails;
        
        return response;
      }
      
      if (!result.data) {
        return {
          valid: false,
          reason: result.error || 'Validation failed',
          totalSize,
          exceedsLimit: true,
        };
      }
      
      const response: {
        valid: boolean;
        reason?: string;
        totalSize: number;
        exceedsLimit: boolean;
        invalidFiles?: Array<{ file: File; reason: string }>;
        maxFileSize?: number;
      } = {
        valid: result.data.valid,
        totalSize: result.data.totalSize,
        exceedsLimit: result.data.exceedsLimit,
      };
      
      if (result.data.reason) response.reason = result.data.reason;
      if (result.data.maxFileSize) response.maxFileSize = result.data.maxFileSize;
      
      return response;
    },
    [user?.id, userPlanKey, formatSize]
  );
}