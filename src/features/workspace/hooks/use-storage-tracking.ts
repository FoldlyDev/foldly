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

  // Get user's current plan (defaulting to 'free' for now - can be enhanced later)
  const userPlanKey = 'free'; // TODO: Integrate with actual user subscription service

  // Query for storage dashboard data using server action
  const {
    data: storageResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: storageQueryKeys.dashboard(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await getStorageDashboardAction(userPlanKey);
      if (!result.success) {
        throw new Error(result.error || 'Failed to get storage dashboard');
      }
      return result.data!;
    },
    enabled: !!user?.id,
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

  return useCallback(() => {
    if (user?.id) {
      // Invalidate storage data
      queryClient.invalidateQueries({
        queryKey: storageQueryKeys.dashboard(user.id),
      });

      // Also invalidate workspace tree data since file counts might have changed
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    }
  }, [queryClient, user?.id]);
}

/**
 * Hook for pre-upload storage validation
 */
export function usePreUploadValidation() {
  const { user } = useUser();

  return useCallback(
    async (files: File[] | FileList): Promise<{
      valid: boolean;
      reason?: string;
      totalSize: number;
      exceedsLimit: boolean;
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

      const result = await validateMultipleFilesAction(fileSizes, 'free'); // TODO: Get actual user plan
      
      return result.data || {
        valid: false,
        reason: result.error || 'Validation failed',
        totalSize,
        exceedsLimit: true,
      };
    },
    [user?.id]
  );
}