// =============================================================================
// USE WORKSPACE HOOKS - Workspace Management
// =============================================================================
// 🎯 Workspace mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkspaceNameAction } from '@/lib/actions';
import { transformActionError, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { legacyKeys } from '@/lib/config/query-keys';

// =============================================================================
// NOTE: Workspace Creation
// =============================================================================
// Workspace creation is handled by the onboarding flow via completeOnboardingAction(),
// which creates user, workspace, link, and permission atomically in a single transaction.
//
// MVP Constraint: 1:1 user-workspace relationship (one workspace per user)
//
// Individual workspace creation will be added in future when multiple workspaces
// per user are supported (post-MVP feature).

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Update workspace name
 *
 * Used in:
 * - Settings module (rename workspace)
 * - Workspace settings panel
 *
 * Features:
 * - Input validation (min 2, max 100 characters - server-side)
 * - Automatic query invalidation (refreshes workspace data)
 * - Rate limited (MODERATE preset - 20 req/min)
 *
 * @returns Mutation to update workspace name
 *
 * @example
 * ```tsx
 * function WorkspaceSettings({ workspace }: { workspace: Workspace }) {
 *   const updateName = useUpdateWorkspaceName();
 *
 *   const handleRename = (newName: string) => {
 *     updateName.mutate({
 *       workspaceId: workspace.id,
 *       name: newName
 *     }, {
 *       onSuccess: () => {
 *         toast.success('Workspace renamed successfully');
 *       }
 *     });
 *   };
 *
 *   return <WorkspaceNameForm onSubmit={handleRename} />;
 * }
 * ```
 */
export function useUpdateWorkspaceName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      name,
    }: {
      workspaceId: string;
      name: string;
    }) => {
      const result = await updateWorkspaceNameAction(workspaceId, name);
      return transformActionError(result, 'Failed to update workspace name');
    },
    retry: false, // Never retry mutations
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate workspace query to refetch updated data
      queryClient.invalidateQueries({ queryKey: legacyKeys.userWorkspace });
    },
    onError: createMutationErrorHandler('Workspace name update'),
  });
}
