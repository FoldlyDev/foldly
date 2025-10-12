// =============================================================================
// USE ONBOARDING HOOKS - Global Data Hooks
// =============================================================================
// 🎯 Onboarding queries and mutations (check status, username availability, complete onboarding)

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkOnboardingStatus,
  checkUsernameAvailability,
  completeOnboardingAction,
} from '@/lib/actions';

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

/**
 * Check username availability in Clerk
 *
 * Used by:
 * - Onboarding form (validate username before submission)
 *
 * Features:
 * - Rate limited (5 requests per minute)
 * - Input sanitization (lowercase, special chars removed)
 * - Requires reverification (10 minutes)
 *
 * @returns Mutation to check username availability
 */
export function useCheckUsernameAvailability() {
  return useMutation({
    mutationFn: checkUsernameAvailability,
    retry: false, // Don't retry rate-limited requests
  });
}

/**
 * Complete onboarding process
 *
 * Creates user, workspace, link, and permission atomically in a single transaction.
 *
 * Used by:
 * - Onboarding form (final submission after username validation)
 *
 * Features:
 * - Atomic transaction (all operations succeed or all fail)
 * - Input sanitization
 * - Clerk username sync (separate from transaction)
 * - Resume detection (handles duplicate onboarding attempts)
 *
 * @returns Mutation to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboardingAction,
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate queries to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
      }
    },
    retry: false, // Don't retry onboarding (could create duplicates)
  });
}
