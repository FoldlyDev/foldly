'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { linkQueryKeys } from '../lib/query-keys';

/**
 * Hook to set up real-time subscriptions for link changes
 * This will be implemented later when we have Supabase realtime setup
 * For now, it's a placeholder that matches workspace structure
 */
export function useLinkRealtime(linkId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!linkId) return;

    console.log('🔄 Setting up realtime subscription for link:', linkId);

    // TODO: Implement Supabase realtime subscription for link changes
    // This would listen for:
    // - File uploads to the link
    // - Folder creation/deletion
    // - File deletion
    // - Batch operations

    // For now, we'll just set up periodic refetching
    const interval = setInterval(() => {
      // Only refetch if the query is already cached (user is actively viewing)
      const existingData = queryClient.getQueryData(linkQueryKeys.tree(linkId));
      if (existingData) {
        queryClient.invalidateQueries({
          queryKey: linkQueryKeys.tree(linkId),
          refetchType: 'none', // Don't immediately refetch, just mark as stale
        });
      }
    }, 30000); // 30 seconds

    return () => {
      console.log('🔄 Cleaning up realtime subscription for link:', linkId);
      clearInterval(interval);
    };
  }, [linkId, queryClient]);
}