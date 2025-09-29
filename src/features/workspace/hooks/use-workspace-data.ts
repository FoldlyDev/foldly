'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { fetchWorkspaceDataAction } from '../lib/actions';

/**
 * Hook to fetch workspace data including folders, files, and stats
 */
export function useWorkspaceData() {
  return useQuery({
    queryKey: workspaceQueryKeys.data(),
    queryFn: async () => {
      const result = await fetchWorkspaceDataAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace data');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
