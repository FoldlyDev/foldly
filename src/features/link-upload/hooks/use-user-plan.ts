// =============================================================================
// USER PLAN HOOK FOR LINK UPLOAD - Integration with Billing Service
// =============================================================================
// 🎯 Client-side hook to get current user plan from billing service

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { getCurrentPlanAction } from '@/features/workspace/lib/actions/billing-actions';

export function useUserPlan() {
  const { user } = useUser();

  const { data: planKey, isLoading, error } = useQuery({
    queryKey: ['user-plan', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return 'free'; // Default to free for unauthenticated users
      }
      
      const result = await getCurrentPlanAction();
      if (!result.success) {
        console.error('Failed to get user plan:', result.error);
        return 'free'; // Default to free on error
      }
      
      const plan = result.data || 'free';
      return plan;
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds - reduced for faster plan updates
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true, // Always check on mount
    refetchOnWindowFocus: true, // Check when window regains focus
  });

  return {
    planKey: planKey || 'free',
    isLoading,
    error,
    isPro: planKey === 'pro',
    isBusiness: planKey === 'business',
    requiresBranding: planKey !== 'pro' && planKey !== 'business', // Show branding for free and starter plans
  };
}