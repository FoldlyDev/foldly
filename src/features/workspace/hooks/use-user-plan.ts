// =============================================================================
// USER PLAN HOOK - Integration with Billing Service
// =============================================================================
// 🎯 Client-side hook to get current user plan from billing service

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { getCurrentPlanAction } from '../lib/actions/billing-actions';

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
      console.log('[useUserPlan] Fetched plan for user:', user.id, '-> Plan:', plan);
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
  };
}