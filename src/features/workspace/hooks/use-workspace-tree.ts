'use client';

import { useQuery } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../lib/query-keys';
import { fetchWorkspaceTreeAction } from '../lib/actions';
import type { WorkspaceTreeData } from '../lib/actions/tree-actions';

export function useWorkspaceTree() {
  return useQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      console.log('🔍 useWorkspaceTree: Fetching workspace tree data...');
      const result = await fetchWorkspaceTreeAction();
      console.log('📊 useWorkspaceTree: Fetch result:', {
        success: result.success,
        foldersCount: result.data?.folders?.length || 0,
        filesCount: result.data?.files?.length || 0,
        error: result.error,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnReconnect: true, // Refetch when reconnecting
    refetchOnMount: true, // ✅ Changed from false to true - allows refetch when cache is invalidated
    refetchInterval: false, // Disable automatic refetch interval
    retry: 1, // Reduce retry attempts to prevent duplicate calls
    networkMode: 'online', // Only fetch when online
  });
}

export type { WorkspaceTreeData };
