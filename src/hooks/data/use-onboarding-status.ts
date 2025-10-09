// =============================================================================
// USE ONBOARDING STATUS HOOK - Global Data Hook
// =============================================================================
// 🎯 Check if user has completed onboarding (has workspace)

'use client';

import { useQuery } from '@tanstack/react-query';
import { checkOnboardingStatus } from '@/lib/actions';

/**
 * Check if authenticated user has completed onboarding
 *
 * Used across modules:
 * - Landing navigation (show correct CTA button)
 * - Dashboard layout (redirect to onboarding if incomplete)
 * - Onboarding page (redirect to dashboard if already complete)
 *
 * @returns Query with { hasWorkspace: boolean, workspaceId: string | null }
 */
export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: checkOnboardingStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry auth checks
  });
}
