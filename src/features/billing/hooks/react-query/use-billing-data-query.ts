// =============================================================================
// BILLING DATA QUERY - Modern React Query Hook for User Billing Analytics
// =============================================================================
// 🎯 Comprehensive billing data following workspace/links query patterns

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
// Server actions imported dynamically to avoid client/server boundary issues
import { billingQueryKeys } from '../../lib/query-keys';
import { useMemo } from 'react';

interface UseBillingDataOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

interface BillingDataResult {
  data: {
    storageUsed: number;
    storageLimit: number;
    storageUsedGB: number;
    filesUploaded: number;
    totalFileSize: number;
    linksCreated: number;
    activeLinks: number;
    totalUploads: number;
    totalBatches: number;
    successfulBatches: number;
    totalDownloads: number;
    accountCreated: Date;
    lastActivity: Date;
    daysActive: number;
    subscriptionStartDate: Date;
    currentPlan: string;
    planFeatures: Record<string, boolean>;
  } | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
  // Derived data
  derivedData: {
    storageUsedGB: number;
    daysActive: number;
    averageUploadsPerDay: number;
    successRate: number;
    storagePercentage: number;
  } | null;
}

/**
 * Hook for fetching comprehensive user billing data from database
 * Replaces mock data with real database queries
 */
export function useBillingDataQuery(
  options: UseBillingDataOptions = {}
): BillingDataResult {
  const { user, isLoaded } = useUser();
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchInterval = undefined,
  } = options;

  const query = useQuery({
    queryKey: billingQueryKeys.userBillingData(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching user billing data...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getUserBillingDataAction } = await import('../../lib/actions');
      const result = await getUserBillingDataAction();
      
      if (!result.success) {
        console.log('❌ React Query: Failed to fetch billing data:', result.error);
        throw new Error(result.error || 'Failed to fetch billing data');
      }

      console.log('✅ React Query: Successfully fetched billing data:', {
        storageUsed: result.data?.storageUsedGB || 0,
        filesUploaded: result.data?.filesUploaded || 0,
        linksCreated: result.data?.linksCreated || 0,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Calculate derived values - using any type to fix TS issues temporarily
  const derivedData = useMemo(() => {
    if (!query.data) return null;

    const data = query.data as any;
    const storageUsedGB = Math.round((data.storageUsed || 0) / (1024 ** 3));
    const daysActive = data.accountCreated ? Math.floor(
      (Date.now() - new Date(data.accountCreated).getTime()) / (24 * 60 * 60 * 1000)
    ) : 0;
    const averageUploadsPerDay = daysActive > 0 ? Math.round((data.totalUploads || 0) / daysActive) : 0;
    const successRate = (data.totalBatches || 0) > 0 ? Math.round(((data.successfulBatches || 0) / data.totalBatches) * 100) : 100;
    const storagePercentage = (data.storageLimit || 0) > 0 ? Math.round(((data.storageUsed || 0) / data.storageLimit) * 100) : 0;

    return {
      storageUsedGB,
      daysActive,
      averageUploadsPerDay,
      successRate,
      storagePercentage,
    };
  }, [query.data]);

  return {
    data: query.data || null,
    isLoading: !isLoaded || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
    derivedData,
  };
}

/**
 * Lightweight hook for storage usage monitoring
 * Optimized for frequent updates and dashboard widgets
 */
export function useStorageMonitorQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
): Pick<BillingDataResult, 'data' | 'isLoading' | 'isError' | 'refetch'> & {
  storageData: {
    used: number;
    usedGB: number;
    limit: number;
    percentage: number;
    isNearLimit: boolean;
    isOverLimit: boolean;
  } | null;
} {
  const { data, isLoading, isError, refetch } = useBillingDataQuery({
    ...options,
    staleTime: 2 * 60 * 1000, // 2 minutes for storage monitoring
  });

  const storageData = useMemo(() => {
    if (!data) return null;

    const usedGB = Math.round(data.storageUsed / (1024 ** 3));
    const percentage = data.storageLimit > 0 ? Math.round((data.storageUsed / data.storageLimit) * 100) : 0;

    return {
      used: data.storageUsed,
      usedGB,
      limit: data.storageLimit,
      percentage: Math.min(percentage, 100),
      isNearLimit: percentage > 80,
      isOverLimit: percentage > 100,
    };
  }, [data]);

  return {
    data,
    isLoading,
    isError,
    refetch,
    storageData,
  };
}

/**
 * New hook using the Clerk + subscription_plans integration
 * Provides real-time plan details and feature access
 */
export function useUserPlanDetailsQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.userPlanDetails(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching user plan details...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getUserPlanDetailsAction } = await import('../../lib/actions');
      const result = await getUserPlanDetailsAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to fetch plan details:', result.error);
        throw new Error(result.error || 'Failed to fetch plan details');
      }

      console.log('✅ React Query: Successfully fetched plan details:', {
        currentPlan: result.data?.currentPlan,
        features: Object.keys((result.data as any)?.uiMetadata?.featureDescriptions || {}),
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (plan details change less frequently)
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Real-time storage usage hook with plan integration
 * Uses the new storage calculation system
 */
export function useRealTimeStorageQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.realTimeStorage(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching real-time storage usage...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getRealTimeStorageUsageAction } = await import('../../lib/actions');
      const result = await getRealTimeStorageUsageAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to fetch storage usage:', result.error);
        throw new Error(result.error || 'Failed to fetch storage usage');
      }

      console.log('✅ React Query: Successfully fetched storage usage:', {
        usedGB: Math.round((result.data?.storageUsage || 0) / (1024 ** 3)),
        percentage: result.data?.percentage,
        isNearLimit: result.data?.isNearLimit,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for storage monitoring)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to app
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Comprehensive billing integration status hook
 * Uses the new billing-clerk integration layer
 */
export function useBillingIntegrationQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.billingIntegration(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching billing integration status...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getBillingIntegrationStatusAction } = await import('../../lib/actions');
      const result = await getBillingIntegrationStatusAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to fetch billing integration:', result.error);
        throw new Error(result.error || 'Failed to fetch billing integration');
      }

      console.log('✅ React Query: Successfully fetched billing integration:', {
        currentPlan: (result.data as any)?.userPlan?.currentPlan,
        isHealthy: result.data?.isHealthy,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * User storage status hook with Clerk integration
 * Provides real-time storage monitoring with plan context
 */
export function useUserStorageStatusQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.userStorageStatus(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching user storage status...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getUserStorageStatusAction } = await import('../../lib/actions');
      const result = await getUserStorageStatusAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to fetch storage status:', result.error);
        throw new Error(result.error || 'Failed to fetch storage status');
      }

      console.log('✅ React Query: Successfully fetched storage status:', {
        limitFormatted: result.data?.limitFormatted,
        percentage: result.data?.percentage,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute for storage monitoring
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 90 * 1000, // Auto-refresh every 90 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Plan synchronization hook
 * Syncs user plan data between Clerk and database
 */
export function usePlanSyncQuery(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.planSync(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Syncing plan data...');
      
      // Dynamic import to avoid client/server boundary issues
      const { syncUserPlanDataAction } = await import('../../lib/actions');
      const result = await syncUserPlanDataAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to sync plan data:', result.error);
        throw new Error(result.error || 'Failed to sync plan data');
      }

      console.log('✅ React Query: Successfully synced plan data:', {
        clerkPlan: result.data?.clerkPlan,
        planName: result.data?.planConfig?.planName,
        isSubscribed: result.data?.isSubscribed,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Less retries since this is sync operation
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * ✅ NEW: Clean plan configuration hook - NO conditional logic
 * Fetches current user's plan configuration directly from subscription_plans table
 * Single source of truth for all plan data
 */
export function usePlanConfig(
  options: Pick<UseBillingDataOptions, 'enabled'> = {}
) {
  const { user, isLoaded } = useUser();
  const { enabled = true } = options;

  return useQuery({
    queryKey: billingQueryKeys.planConfig(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 React Query: Fetching plan configuration from database...');
      
      // Dynamic import to avoid client/server boundary issues
      const { getCurrentUserPlanConfigAction } = await import('../../lib/actions');
      const result = await getCurrentUserPlanConfigAction();
      
      if (!result.success) {
        console.error('❌ React Query: Failed to fetch plan config:', result.error);
        throw new Error(result.error || 'Failed to fetch plan configuration');
      }

      console.log('✅ React Query: Successfully fetched plan config:', {
        planName: result.data?.planName,
        planKey: result.data?.planKey,
        storageLimit: result.data?.storageLimit || 'Unknown',
        storageLimitGb: result.data?.storageLimitGb || 0,
        monthlyPrice: `$${result.data?.monthlyPrice || '0.00'}`,
        timestamp: new Date().toISOString()
      });

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - plan config changes infrequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}