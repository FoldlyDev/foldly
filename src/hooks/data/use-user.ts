// =============================================================================
// USE USER HOOKS - User Data Management
// =============================================================================
// 🎯 User queries with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserWorkspaceAction } from '@/lib/actions';
import { legacyKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get authenticated user's workspace
 *
 * Used across modules:
 * - Dashboard (load workspace data)
 * - Links module (associate links with workspace)
 * - Files module (workspace-scoped operations)
 * - Settings module (workspace settings)
 * - Billing module (workspace subscription)
 * - Onboarding flow (check workspace existence)
 *
 * MVP Constraint: 1:1 user-workspace relationship (one workspace per user)
 *
 * @returns Query with workspace data or null
 *
 * @example
 * ```tsx
 * function DashboardLayout() {
 *   const { data: workspace, isLoading } = useUserWorkspace();
 *
 *   if (isLoading) return <DashboardSkeleton />;
 *   if (!workspace) return <OnboardingRedirect />;
 *
 *   return <Dashboard workspace={workspace} />;
 * }
 * ```
 */
export function useUserWorkspace() {
  return useQuery({
    queryKey: legacyKeys.userWorkspace,
    queryFn: getUserWorkspaceAction,
    staleTime: 5 * 60 * 1000, // 5 minutes - workspace data rarely changes
  });
}
