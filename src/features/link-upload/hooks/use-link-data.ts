'use client';

import { useQuery } from '@tanstack/react-query';
import { linkUploadQueryKeys } from '../lib/query-keys';
import { 
  fetchLinkBySlugAction, 
  fetchLinkTreeDataAction,
  validateLinkAccessAction 
} from '../lib/actions/link-data-actions';
import type { LinkWithStats } from '@/lib/database/types/links';

/**
 * Hook to fetch link data by slug (public access)
 */
export function useLinkData(slug: string, topic?: string) {
  return useQuery({
    queryKey: linkUploadQueryKeys.bySlug(slug, topic),
    queryFn: async () => {
      const result = await fetchLinkBySlugAction(slug, topic);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link data');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!slug, // Only run if slug is provided
  });
}

/**
 * Hook to fetch link tree data (folders and files)
 */
export function useLinkTreeData(linkId: string | undefined) {
  return useQuery({
    queryKey: linkId ? linkUploadQueryKeys.tree(linkId) : ['link-upload-tree-disabled'],
    queryFn: async () => {
      if (!linkId) throw new Error('Link ID is required');
      
      const result = await fetchLinkTreeDataAction(linkId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link tree data');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!linkId, // Only run if linkId is provided
  });
}

/**
 * Hook to validate link access with password if required
 */
export function useValidateLinkAccess(
  slugParts: string[],
  password?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: linkUploadQueryKeys.access(slugParts[0], slugParts[1]),
    queryFn: async () => {
      const result = await validateLinkAccessAction({
        slugParts,
        ...(password !== undefined && { password }),
      });
      
      if (!result.success) {
        // Special handling for password required error
        if (result.error === 'password_required') {
          throw { type: 'password_required', message: 'This link requires a password' };
        }
        throw new Error(result.error || 'Failed to validate link access');
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: enabled && slugParts.length > 0,
    retry: (failureCount, error: any) => {
      // Don't retry for password required errors
      if (error?.type === 'password_required') {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Combined hook to fetch link and tree data together
 */
export function useLinkWithTreeData(slug: string, topic?: string) {
  // First fetch the link data
  const linkQuery = useLinkData(slug, topic);
  
  // Then fetch tree data if link exists
  const treeQuery = useLinkTreeData(linkQuery.data?.id);

  return {
    link: linkQuery,
    tree: treeQuery,
    isLoading: linkQuery.isLoading || (linkQuery.isSuccess && treeQuery.isLoading),
    isError: linkQuery.isError || treeQuery.isError,
    error: linkQuery.error || treeQuery.error,
    data: linkQuery.isSuccess && treeQuery.isSuccess ? {
      link: linkQuery.data as LinkWithStats,
      folders: treeQuery.data?.folders || [],
      files: treeQuery.data?.files || [],
    } : null,
  };
}