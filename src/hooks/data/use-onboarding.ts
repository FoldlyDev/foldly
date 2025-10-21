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
import { transformQueryResult, transformActionError, createMutationErrorHandler } from '@/hooks/utils/mutation-helpers';

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
    queryFn: async () => {
      const result = await checkOnboardingStatus();
      return transformQueryResult(result, 'Failed to check onboarding status');
    },
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
    mutationFn: async (username: string) => {
      const result = await checkUsernameAvailability({ username });
      return transformActionError(result, 'Failed to check username availability');
    },
    onError: createMutationErrorHandler('Username availability check'),
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
    mutationFn: async (username: string) => {
      const result = await completeOnboardingAction({ username });
      return transformActionError(result, 'Failed to complete onboarding');
    },
    onSuccess: () => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
    },
    onError: createMutationErrorHandler('Onboarding completion'),
    retry: false, // Don't retry onboarding (could create duplicates)
  });
}
