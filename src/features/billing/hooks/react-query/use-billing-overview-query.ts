// =============================================================================
// BILLING OVERVIEW QUERY - Modern React Query Hook for Dashboard Cards
// =============================================================================
// 🎯 Real database-driven billing overview following workspace/links patterns

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
// Server actions imported dynamically to avoid client/server boundary issues
import { billingQueryKeys } from '../../lib/query-keys';
import { useClerkSubscription } from '../use-clerk-billing';
import { useMemo } from 'react';

interface UseBillingOverviewOptions {
  enabled?: boolean;
  staleTime?: number;
}

interface BillingOverviewResult {
  data: {
    currentPlan: string;
    storageUsed: number;
    storageLimit: string;
    featuresActive: number;
    daysRemaining: number | null;
    monthlySpend: number;
    planData: any;
  } | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook for fetching billing overview data for dashboard cards
 * Uses real database queries and follows React Query best practices
 */
export function useBillingOverviewQuery(
  options: UseBillingOverviewOptions = {}
): BillingOverviewResult {
  const { user, isLoaded } = useUser();
  const { isFreeTier, isProTier, isBusinessTier } = useClerkSubscription();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  // Determine current plan from Clerk subscription
  const currentPlan = useMemo(() => {
    if (!isLoaded) return 'free';
    if (isBusinessTier) return 'business';
    if (isProTier) return 'pro';
    return 'free';
  }, [isLoaded, isBusinessTier, isProTier]);

  const query = useQuery({
    queryKey: billingQueryKeys.userBillingOverview(user?.id || '', currentPlan),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Dynamic import to avoid client/server boundary issues
      const { getBillingOverviewAction } = await import('../../lib/actions');
      const result = await getBillingOverviewAction(currentPlan);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch billing overview');
      }

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    data: query.data || null,
    isLoading: !isLoaded || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook for fetching storage usage with plan-aware limits
 */
export function useStorageUsageQuery(
  options: UseBillingOverviewOptions = {}
): BillingOverviewResult {
  const { user, isLoaded } = useUser();
  const { isFreeTier, isProTier, isBusinessTier } = useClerkSubscription();

  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes (more frequent for storage)
  } = options;

  // Determine current plan from Clerk subscription
  const currentPlan = useMemo(() => {
    if (!isLoaded) return 'free';
    if (isBusinessTier) return 'business';
    if (isProTier) return 'pro';
    return 'free';
  }, [isLoaded, isBusinessTier, isProTier]);

  const query = useQuery({
    queryKey: billingQueryKeys.userStorageUsage(user?.id || '', currentPlan),
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { getStorageUsageAction } = await import('../../lib/actions');
      const result = await getStorageUsageAction(currentPlan);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch storage usage');
      }

      return result.data;
    },
    enabled: enabled && isLoaded && !!user?.id,
    staleTime,
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // More important for storage monitoring
    retry: 3,
  });

  return {
    data: query.data || null,
    isLoading: !isLoaded || query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
