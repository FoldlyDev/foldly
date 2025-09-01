'use client';

import { useQuery } from '@tanstack/react-query';
import { filesQueryKeys } from '../lib/query-keys';
import { fetchUserLinksAction, fetchLinkFilesAction } from '../lib/actions';

/**
 * Hook to fetch all user links organized by type
 */
export function useUserLinks() {
  return useQuery({
    queryKey: filesQueryKeys.links(),
    queryFn: async () => {
      const result = await fetchUserLinksAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links data');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch files for a specific link
 */
export function useLinkFiles(linkId: string | null) {
  return useQuery({
    queryKey: linkId ? filesQueryKeys.filesByLink(linkId) : ['disabled'],
    queryFn: async () => {
      if (!linkId) return [];
      const result = await fetchLinkFilesAction(linkId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link files');
      }
      return result.data;
    },
    enabled: !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}