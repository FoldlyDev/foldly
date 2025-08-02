'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { fetchWorkspaceTreeAction } from '../lib/actions';

/**
 * Hook to fetch workspace tree data
 */
export function useWorkspaceTree() {
  return useQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      const result = await fetchWorkspaceTreeAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
