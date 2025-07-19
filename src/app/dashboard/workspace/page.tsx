import type { Metadata } from 'next';
import { Suspense } from 'react';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { WorkspaceContainer } from '@/features/workspace/components/views/workspace-container';
import {
  workspaceQueryKeys,
  fetchWorkspaceTreeAction,
} from '@/features/workspace/lib';
import { getWorkspaceByUserId } from '@/features/workspace/lib/actions/workspace-actions';
import { getQueryClient } from '@/lib/config/query-client';

export const metadata: Metadata = {
  title: 'Dashboard Workspace | Foldly',
  description:
    'Your file collection dashboard workspace - track links, manage files, and monitor performance',
};

export default async function WorkspacePage() {
  // Server-side query client for SSR prefetching
  const queryClient = getQueryClient();

  // Parallel data prefetching on the server - Following 2025 best practices
  await Promise.all([
    // Prefetch workspace settings (critical path)
    queryClient.prefetchQuery({
      queryKey: workspaceQueryKeys.settings(),
      queryFn: async () => {
        const result = await getWorkspaceByUserId();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch workspace');
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
    
    // Prefetch workspace tree data on server
    queryClient.prefetchQuery({
      queryKey: workspaceQueryKeys.tree(),
      queryFn: async () => {
        const result = await fetchWorkspaceTreeAction();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch workspace tree');
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<WorkspaceLoadingFallback />}>
        <WorkspaceContainer />
      </Suspense>
    </HydrationBoundary>
  );
}

// Loading fallback component for better UX
function WorkspaceLoadingFallback() {
  return (
    <div className='workspace-loading'>
      <div className='animate-pulse space-y-4'>
        <div className='h-8 bg-gray-200 rounded-md w-1/4'></div>
        <div className='h-32 bg-gray-200 rounded-md'></div>
        <div className='h-64 bg-gray-200 rounded-md'></div>
      </div>
    </div>
  );
}
