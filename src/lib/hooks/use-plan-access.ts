// =============================================================================
// PLAN ACCESS HOOKS - Client-Safe Plan Utilities
// =============================================================================
// 🎯 React hooks for plan access that properly separate server/client concerns

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const PLAN_QUERY_KEYS = {
  currentPlan: (userId: string) => ['plan', 'current', userId],
  planDetails: (userId: string) => ['plan', 'details', userId],
  planConfig: (planKey: string) => ['plan', 'config', planKey],
  allPlans: () => ['plans', 'all'],
  features: (userId: string) => ['plan', 'features', userId],
  featureAccess: (userId: string, feature: string) => [
    'plan',
    'feature',
    userId,
    feature,
  ],
  upgradeEligibility: (userId: string, targetPlan: string) => [
    'plan',
    'upgrade',
    userId,
    targetPlan,
  ],
} as const;

// =============================================================================
// PLAN DATA HOOKS
// =============================================================================

/**
 * Hook to get current user's plan
 */
export function useCurrentUserPlan() {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: PLAN_QUERY_KEYS.currentPlan(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { getCurrentUserPlanAction } = await import(
        '@/features/billing/lib/actions'
      );
      const result = await getCurrentUserPlanAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get current plan');
      }

      return result.data;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get user plan details
 */
export function useUserPlanDetails() {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: PLAN_QUERY_KEYS.planDetails(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { getUserPlanDetailsAction } = await import(
        '@/features/billing/lib/actions'
      );
      const result = await getUserPlanDetailsAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get plan details');
      }

      return result.data;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get plan configuration
 */
export function usePlanConfig(planKey: 'free' | 'pro' | 'business') {
  return useQuery({
    queryKey: PLAN_QUERY_KEYS.planConfig(planKey),
    queryFn: async () => {
      // Dynamic import to avoid client/server boundary issues
      const { getCurrentUserPlanConfigAction } = await import(
        '@/features/billing/lib/actions'
      );
      const result = await getCurrentUserPlanConfigAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get plan config');
      }

      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get all plans for comparison
 */
export function useAllPlans() {
  return useQuery({
    queryKey: PLAN_QUERY_KEYS.allPlans(),
    queryFn: async () => {
      // Dynamic import to avoid client/server boundary issues
      const { getActivePlansAction } = await import(
        '@/features/billing/lib/actions'
      );
      const result = await getActivePlansAction();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get plans');
      }

      return result.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// =============================================================================
// FEATURE ACCESS HOOKS
// =============================================================================

/**
 * Hook to check if user has access to a specific feature
 */
export function useFeatureAccess(feature: string) {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: PLAN_QUERY_KEYS.featureAccess(user?.id || '', feature),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { billing } = await import('@/lib/services/billing');
      const hasAccess = await billing.hasFeature(feature);

      return hasAccess;
    },
    enabled: isLoaded && !!user?.id && !!feature,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to get all user features
 */
export function useUserFeatures() {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: PLAN_QUERY_KEYS.features(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { billing } = await import('@/lib/services/billing');
      const integratedDataResult =
        await billing.integration.getIntegratedPlanData();

      if (!integratedDataResult.success) {
        throw new Error(
          integratedDataResult.error || 'Failed to get plan data'
        );
      }

      return integratedDataResult.data.clerkPlan.planFeatures;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to check upgrade eligibility
 */
export function useUpgradeEligibility(targetPlan: 'pro' | 'business') {
  const { user, isLoaded } = useUser();

  return useQuery({
    queryKey: PLAN_QUERY_KEYS.upgradeEligibility(user?.id || '', targetPlan),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Dynamic import to avoid client/server boundary issues
      const { billing } = await import('@/lib/services/billing');
      const integratedDataResult =
        await billing.integration.getIntegratedPlanData();

      if (!integratedDataResult.success) {
        throw new Error(
          integratedDataResult.error || 'Failed to get plan data'
        );
      }

      // Check if the target plan is in the upgrade options
      const canUpgrade =
        integratedDataResult.data.upgradeOptions.includes(targetPlan);

      return canUpgrade;
    },
    enabled: isLoaded && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// =============================================================================
// COMBINED HOOKS
// =============================================================================

/**
 * Combined hook for comprehensive plan information
 */
export function usePlanState() {
  const currentPlan = useCurrentUserPlan();
  const planDetails = useUserPlanDetails();
  const features = useUserFeatures();

  const isLoading =
    currentPlan.isLoading || planDetails.isLoading || features.isLoading;
  const isError =
    currentPlan.isError || planDetails.isError || features.isError;
  const error = currentPlan.error || planDetails.error || features.error;

  return {
    currentPlan: currentPlan.data,
    planDetails: planDetails.data,
    features: features.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      currentPlan.refetch();
      planDetails.refetch();
      features.refetch();
    },
  };
}
