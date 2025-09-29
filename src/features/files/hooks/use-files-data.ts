'use client';

import { useQuery } from '@tanstack/react-query';
import { filesQueryKeys } from '../lib/query-keys';
import { fetchUserLinksAction, fetchLinkContentAction } from '../lib/actions';

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
 * Hook to fetch both files and folders for a specific link
 * Uses the centralized file system services
 */
export function useLinkContent(linkId: string | null) {
  return useQuery({
    queryKey: linkId ? filesQueryKeys.linkContent(linkId) : ['disabled'],
    queryFn: async () => {
      if (!linkId) return { files: [], folders: [] };
      const result = await fetchLinkContentAction(linkId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link content');
      }
      return result.data;
    },
    enabled: !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}