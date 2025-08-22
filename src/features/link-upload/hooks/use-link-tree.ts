'use client';

import { useQuery } from '@tanstack/react-query';
import { linkQueryKeys } from '../lib/query-keys';
import { fetchLinkTreeAction } from '../lib/actions';

/**
 * Hook to fetch link tree data
 */
export function useLinkTree(linkId: string) {
  return useQuery({
    queryKey: linkQueryKeys.tree(linkId),
    queryFn: async () => {
      console.log('🔍 React Query: Fetching link tree data for linkId:', linkId);
      const result = await fetchLinkTreeAction(linkId);
      if (!result.success) {
        console.log(
          '❌ React Query: Failed to fetch link tree:',
          result.error
        );
        throw new Error(result.error || 'Failed to fetch link tree');
      }
      console.log('✅ React Query: Successfully fetched link tree data:', {
        linkId,
        folderCount: result.data?.folders?.length || 0,
        fileCount: result.data?.files?.length || 0,
        timestamp: new Date().toISOString(),
      });
      console.log('📋 React Query: Full data structure:', result.data);
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!linkId, // Only run query if linkId is provided
  });
}