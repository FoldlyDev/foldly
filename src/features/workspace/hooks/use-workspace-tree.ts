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
      console.log('🔍 React Query: Fetching workspace tree data...');
      const result = await fetchWorkspaceTreeAction();
      if (!result.success) {
        console.log('❌ React Query: Failed to fetch workspace tree:', result.error);
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      console.log('✅ React Query: Successfully fetched workspace tree data:', {
        workspace: result.data?.workspace?.id,
        folderCount: result.data?.folders?.length || 0,
        fileCount: result.data?.files?.length || 0,
        timestamp: new Date().toISOString()
      });
      console.log('📋 React Query: Full data structure:', result.data);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}