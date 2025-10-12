// =============================================================================
// USE USER WORKSPACE HOOKS - Global Data Hooks
// =============================================================================
// 🎯 User workspace queries and mutations

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserWorkspaceAction,
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
 * NOTE: Workspace creation is handled by the onboarding flow via completeOnboardingAction(),
 * which creates user, workspace, link, and permission atomically in a single transaction.
 *
 * MVP Constraint: 1:1 user-workspace relationship (one workspace per user)
 *
 * Individual workspace creation will be added in future when multiple workspaces
 * per user are supported (post-MVP feature).
 */

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
