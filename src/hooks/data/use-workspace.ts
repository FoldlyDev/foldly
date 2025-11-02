// =============================================================================
// USE WORKSPACE HOOKS - Workspace Management
// =============================================================================
// 🎯 Workspace mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateWorkspaceNameAction,
  getWorkspaceStatsAction,
  getRecentActivityAction,
} from '@/lib/actions';
import { transformActionError, transformQueryResult, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { legacyKeys, workspaceKeys } from '@/lib/config/query-keys';

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
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get workspace statistics
 *
 * Used in:
 * - Dashboard overview
 * - Workspace header stats
 * - Analytics summary cards
 *
 * @returns Query with workspace statistics
 *
 * @example
 * ```tsx
 * function WorkspaceStats() {
 *   const { data: stats, isLoading } = useWorkspaceStats();
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <StatCard label="Files" value={stats?.totalFiles} />
 *       <StatCard label="Storage" value={formatBytes(stats?.storageUsed)} />
 *       <StatCard label="Links" value={stats?.activeLinks} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useWorkspaceStats() {
  return useQuery({
    queryKey: workspaceKeys.stats(),
    queryFn: async () => {
      const result = await getWorkspaceStatsAction();
      return transformQueryResult(result, 'Failed to fetch workspace statistics', {
        totalFiles: 0,
        storageUsed: 0,
        activeLinks: 0,
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get recent file activity
 *
 * Used in:
 * - Dashboard recent activity feed
 * - Recent uploads widget
 * - Activity timeline
 *
 * @param limit - Maximum number of files to return (default: 10)
 * @returns Query with array of recent files
 *
 * @example
 * ```tsx
 * function RecentActivity() {
 *   const { data: recentFiles, isLoading } = useRecentActivity(20);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <h2>Recent Uploads</h2>
 *       {recentFiles?.map(file => (
 *         <ActivityItem key={file.id} file={file} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: workspaceKeys.recentActivity(limit),
    queryFn: async () => {
      const result = await getRecentActivityAction({ limit });
      return transformQueryResult(result, 'Failed to fetch recent activity', []);
    },
    staleTime: 30 * 1000, // 30 seconds - activity changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

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
      const result = await updateWorkspaceNameAction({ workspaceId, name });
      return transformActionError(result, 'Failed to update workspace name');
    },
    retry: false, // Never retry mutations
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate workspace query to refetch updated data
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
    onError: createMutationErrorHandler('Workspace name update'),
  });
}
