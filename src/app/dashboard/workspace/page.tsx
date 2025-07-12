import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WorkspaceContainer } from '@/features/workspace';
import {
  workspaceQueryKeys,
  fetchWorkspaceTreeAction,
} from '@/features/workspace/lib';
import { getQueryClient } from '@/lib/query-client';

export const metadata: Metadata = {
  title: 'Dashboard Workspace | Foldly',
  description:
    'Your file collection dashboard workspace - track links, manage files, and monitor performance',
};

export default async function WorkspacePage() {
  // Server-side query client for SSR prefetching
  const queryClient = getQueryClient();

  // Prefetch workspace tree data on the server
  await queryClient.prefetchQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      const result = await fetchWorkspaceTreeAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkspaceContainer />
    </HydrationBoundary>
  );
}
