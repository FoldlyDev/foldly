// =============================================================================
// USE USER WORKSPACE HOOKS - Global Data Hooks
// =============================================================================
// 🎯 User workspace queries and mutations

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserWorkspaceAction,
  createUserWorkspaceAction,
  updateWorkspaceNameAction,
} from '@/lib/actions';

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load workspace data)
 * - Links module (associate links with workspace)
 * - Files module (workspace-scoped operations)
 *
 * @returns Query with workspace data or null
 */
export function useUserWorkspace() {
  return useQuery({
    queryKey: ['user-workspace'],
    queryFn: getUserWorkspaceAction,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create workspace for user (onboarding flow)
 *
 * Used by:
 * - Onboarding module (create workspace after username selection)
 *
 * @returns Mutation to create workspace
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username }: { username: string }) =>
      createUserWorkspaceAction(username),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate both workspace and onboarding status queries
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
        queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      }
    },
  });
}

/**
 * Update workspace name
 *
 * Used by:
 * - Settings module (rename workspace)
 *
 * @returns Mutation to update workspace name
 */
export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      name,
    }: {
      workspaceId: string;
      name: string;
    }) => updateWorkspaceNameAction(workspaceId, name),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate workspace query to refetch updated data
        queryClient.invalidateQueries({ queryKey: ['user-workspace'] });
      }
    },
  });
}
