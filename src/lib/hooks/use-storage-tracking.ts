'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { getUserStorageInfoAction } from '@/lib/actions/storage-actions';

/**
 * Centralized storage tracking hook
 * Fetches user storage information from the server action which gets plan from Clerk
 * No planKey parameter needed - server determines plan from Clerk (source of truth)
 */
export function useStorageTracking() {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: ['storage', 'tracking', user?.id],
    queryFn: async () => {
      const result = await getUserStorageInfoAction();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch storage information');
      }
      
      // Type guard to ensure we have data
      if (!('data' in result) || !result.data) {
        throw new Error('No storage data available');
      }
      
      return result.data;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Hook to invalidate storage cache after operations
 * Use this after upload/delete operations to refresh storage data
 */
export function useInvalidateStorage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  
  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({
        queryKey: ['storage', 'tracking', user.id],
      });
    }
  };
}

/**
 * Hook to check storage warnings and limits
 * Provides easy-to-use warning states for UI components
 */
export function useStorageWarnings() {
  const { data: storageInfo, isLoading } = useStorageTracking();

  if (isLoading || !storageInfo) {
    return {
      isNearLimit: false,
      isAtLimit: false,
      isFull: false,
      canUpload: true,
      warningLevel: 'normal' as const,
      message: null,
    };
  }

  const percentage = storageInfo.usagePercentage;
  
  return {
    isNearLimit: percentage > 80 && percentage < 95,
    isAtLimit: percentage >= 95 && percentage < 100,
    isFull: percentage >= 100,
    canUpload: percentage < 100,
    warningLevel: 
      percentage >= 100 ? 'critical' as const :
      percentage >= 95 ? 'critical' as const :
      percentage >= 80 ? 'warning' as const :
      'normal' as const,
    message: 
      percentage >= 100 ? 'Storage full. Upgrade to continue uploading.' :
      percentage >= 95 ? `Critical: Only ${formatBytes(storageInfo.availableSpace)} remaining` :
      percentage >= 80 ? `Warning: ${Math.round(100 - percentage)}% storage remaining` :
      null,
  };
}

/**
 * Combined hook for components that need both storage info and warnings
 */
export function useStorageState() {
  const storageQuery = useStorageTracking();
  const warnings = useStorageWarnings();
  const invalidate = useInvalidateStorage();
  
  return {
    // Storage info
    data: storageQuery.data,
    isLoading: storageQuery.isLoading,
    error: storageQuery.error,
    
    // Warnings
    warnings,
    
    // Actions
    refetch: storageQuery.refetch,
    invalidate,
    
    // Computed values for convenience
    percentage: storageQuery.data?.usagePercentage ?? 0,
    formattedUsage: storageQuery.data ? 
      `${formatBytes(storageQuery.data.storageUsed)} / ${formatBytes(storageQuery.data.storageLimit)}` :
      null,
  };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Export type for storage info
 */
export type StorageInfo = {
  plan: string;
  storageUsed: number;
  storageLimit: number;
  availableSpace: number;
  usagePercentage: number;
  maxFileSize: number;
};