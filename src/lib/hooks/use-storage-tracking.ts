// =============================================================================
// STORAGE TRACKING HOOKS - React hooks for real-time storage management
// =============================================================================
// 🎯 Provides React hooks for the new storage tracking system

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import type {
  UserStorageInfo,
  StorageValidationResult,
} from '@/lib/services/storage';

// Storage query keys
export const STORAGE_QUERY_KEYS = {
  dashboard: (userId: string) => ['storage', 'dashboard', userId],
  breakdown: (userId: string) => ['storage', 'breakdown', userId],
  validation: (userId: string, fileSize: number) => [
    'storage',
    'validation',
    userId,
    fileSize,
  ],
} as const;

/**
 * Hook to get user's storage dashboard information
 * Returns real-time storage usage, limits, and statistics
 */
export const useStorageDashboard = (planKey: string = 'free') => {
  const { user } = useUser();

  return useQuery({
    queryKey: STORAGE_QUERY_KEYS.dashboard(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { getUserStorageDashboardAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await getUserStorageDashboardAction(planKey);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch storage dashboard');
      }

      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to get storage breakdown by file type
 */
export const useStorageBreakdown = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: STORAGE_QUERY_KEYS.breakdown(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { getStorageBreakdownAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await getStorageBreakdownAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch storage breakdown');
      }

      return result.data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to validate if user can upload a file
 */
export const useUploadValidation = (
  fileSize: number,
  planKey: string = 'free'
) => {
  const { user } = useUser();

  return useQuery({
    queryKey: STORAGE_QUERY_KEYS.validation(user?.id || '', fileSize),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { validateUploadAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await validateUploadAction(fileSize, planKey);

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate upload');
      }

      return result.data;
    },
    enabled: !!user?.id && fileSize > 0,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Mutation hook for uploading files with storage tracking
 */
export const useUploadWithTracking = (planKey: string = 'free') => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      file: File;
      storagePath: string;
      metadata: {
        linkId?: string;
        batchId?: string;
        workspaceId?: string;
        folderId?: string;
      };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { uploadFileAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await uploadFileAction(params, planKey);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload file');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate storage-related queries to update UI
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: STORAGE_QUERY_KEYS.dashboard(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: STORAGE_QUERY_KEYS.breakdown(user.id),
        });
      }
    },
  });
};

/**
 * Mutation hook for deleting files with storage tracking
 */
export const useDeleteWithTracking = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { deleteFileAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await deleteFileAction(fileId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file');
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate storage-related queries to update UI
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: STORAGE_QUERY_KEYS.dashboard(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: STORAGE_QUERY_KEYS.breakdown(user.id),
        });
      }
    },
  });
};

/**
 * Mutation hook for syncing storage with Supabase
 */
export const useStorageSync = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { syncStorageAction } = await import(
        '@/lib/services/storage/storage-actions'
      );
      const result = await syncStorageAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to sync storage');
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all storage queries after sync
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: ['storage'],
        });
      }
    },
  });
};

/**
 * Helper hook that combines storage dashboard and validation
 * Useful for upload components that need both pieces of information
 */
export const useStorageState = (
  fileSize?: number,
  planKey: string = 'free'
) => {
  const dashboard = useStorageDashboard(planKey);
  const validation = useUploadValidation(fileSize || 0, planKey);

  return {
    dashboard: dashboard.data,
    validation: validation.data,
    isLoading: dashboard.isLoading || validation.isLoading,
    error: dashboard.error || validation.error,
    refetch: () => {
      dashboard.refetch();
      validation.refetch();
    },
  };
};

/**
 * Hook to check storage warnings and limits
 */
export const useStorageWarnings = (planKey: string = 'free') => {
  const { data: storageInfo } = useStorageDashboard(planKey);

  const warnings = {
    isNearLimit: storageInfo ? storageInfo.usagePercentage > 80 : false,
    isFull: storageInfo ? storageInfo.usagePercentage > 95 : false,
    canUpload: storageInfo ? storageInfo.usagePercentage < 100 : true,
    warningLevel: storageInfo
      ? storageInfo.usagePercentage > 95
        ? 'critical'
        : storageInfo.usagePercentage > 80
          ? 'warning'
          : 'normal'
      : ('normal' as 'normal' | 'warning' | 'critical'),
  };

  return warnings;
};
