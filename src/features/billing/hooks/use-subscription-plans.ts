// =============================================================================
// SUBSCRIPTION PLANS HOOKS - React Query Integration for Plan Data
// =============================================================================
// 🎯 Modern hooks for fetching and caching subscription plan data

'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  getActivePlansAction,
  getMvpPlansAction,
  getPlanByKeyAction,
} from '../lib/actions';
import type { SubscriptionPlan } from '../lib/actions';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const subscriptionPlansQueryKeys = {
  all: ['subscription-plans'] as const,
  active: () => [...subscriptionPlansQueryKeys.all, 'active'] as const,
  mvp: () => [...subscriptionPlansQueryKeys.all, 'mvp'] as const,
  byKey: (planKey: string) => [...subscriptionPlansQueryKeys.all, 'by-key', planKey] as const,
  features: (planKey: string) => [...subscriptionPlansQueryKeys.all, 'features', planKey] as const,
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to fetch all active subscription plans
 */
export function useActivePlans() {
  return useQuery({
    queryKey: subscriptionPlansQueryKeys.active(),
    queryFn: async () => {
      const result = await getActivePlansAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch active plans');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch MVP-enabled subscription plans
 */
export function useMvpPlans() {
  return useQuery({
    queryKey: subscriptionPlansQueryKeys.mvp(),
    queryFn: async () => {
      const result = await getMvpPlansAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch MVP plans');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all subscription plans (including inactive)
 */
export function useAllPlans() {
  return useQuery({
    queryKey: subscriptionPlansQueryKeys.all,
    queryFn: async () => {
      const result = await getActivePlansAction(); // Use active plans for now
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch all plans');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a specific plan by key
 */
export function usePlanByKey(planKey: string | null) {
  return useQuery({
    queryKey: subscriptionPlansQueryKeys.byKey(planKey || ''),
    queryFn: async () => {
      if (!planKey) return null;
      const result = await getPlanByKeyAction(planKey);
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch plan: ${planKey}`);
      }
      return result.data;
    },
    enabled: !!planKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch plan UI metadata (simplified)
 */
export function usePlanUIMetadata(planKey: string | null) {
  return useQuery({
    queryKey: subscriptionPlansQueryKeys.features(planKey || ''),
    queryFn: async () => {
      if (!planKey) return null;
      const result = await getPlanByKeyAction(planKey);
      if (!result.success) {
        throw new Error(result.error || `Failed to fetch plan: ${planKey}`);
      }
      const plan = result.data;
      if (!plan) return null;
      
      return {
        highlightFeatures: (plan.highlightFeatures as string[]) || [],
        featureDescriptions: (plan.featureDescriptions as Record<string, string>) || {},
      };
    },
    enabled: !!planKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get plans formatted for display (with loading states)
 */
export function usePlansForDisplay() {
  const { data: plans, isLoading, error } = useMvpPlans();

  const formattedPlans = plans?.map(plan => ({
    id: plan.planKey,
    name: plan.planName,
    description: plan.planDescription || '',
    monthlyPrice: parseFloat(plan.monthlyPriceUsd),
    yearlyPrice: parseFloat(plan.yearlyPriceUsd || '0'),
    features: [], // Derived from feature flags, not stored as array
    isPopular: plan.planKey === 'pro', // Pro plan is popular
    color: plan.planKey === 'free' ? '#10B981' : plan.planKey === 'pro' ? '#3B82F6' : '#8B5CF6',
    icon: plan.planKey === 'free' ? '📦' : plan.planKey === 'pro' ? '⭐' : '🚀',
    tier: plan.planKey as 'free' | 'pro' | 'business',
    planData: plan,
  }));

  return {
    plans: formattedPlans || [],
    isLoading,
    error,
  };
}

/**
 * Hook to check if a specific plan has a highlight feature (simplified)
 */
export function usePlanHasHighlightFeature(planKey: string | null, featureName: string) {
  const { data: plan } = usePlanByKey(planKey);
  
  if (!plan || !featureName) {
    return false;
  }

  const highlightFeatures = (plan.highlightFeatures as string[]) || [];
  return highlightFeatures.includes(featureName);
}

/**
 * Hook to get plan comparison data
 */
export function usePlanComparison() {
  const { data: plans, isLoading, error } = useMvpPlans();

  const comparisonData = plans?.map(plan => ({
    planKey: plan.planKey,
    planName: plan.planName,
    monthlyPrice: parseFloat(plan.monthlyPriceUsd),
    yearlyPrice: parseFloat(plan.yearlyPriceUsd || '0'),
    highlightFeatures: (plan.highlightFeatures as string[]) || [],
    featureDescriptions: (plan.featureDescriptions as Record<string, string>) || {},
    storageLimit: plan.storageLimitGb === -1 ? 'Unlimited' : `${plan.storageLimitGb}GB`,
    isPopular: plan.isPopular || false,
    color: plan.planKey === 'free' ? '#10B981' : plan.planKey === 'pro' ? '#3B82F6' : '#8B5CF6',
  }));

  return {
    comparison: comparisonData || [],
    isLoading,
    error,
  };
}

// =============================================================================
// TYPES FOR CONSUMERS
// =============================================================================

export type PlanForDisplay = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular: boolean;
  color: string;
  icon: string;
  tier: 'free' | 'pro' | 'business';
  planData: SubscriptionPlan;
};

export type PlanComparison = {
  planKey: string;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlightFeatures: string[];
  featureDescriptions: Record<string, string>;
  storageLimit: string;
  isPopular: boolean;
  color: string;
};

// =============================================================================
// EXPORTS
// =============================================================================

export type { SubscriptionPlan };