'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWorkspaceDataAction } from '@/features/workspace/lib/actions';

/**
 * Hook to fetch workspace data for the files feature
 * Reuses the workspace feature's action for consistency
 */
export function useWorkspaceData() {
  return useQuery({
    queryKey: ['files', 'workspace', 'data'],
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