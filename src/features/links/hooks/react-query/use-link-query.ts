/**
 * React Query hook for fetching individual links
 *
 * Integrates with existing server actions and provides optimized caching,
 * error handling, and loading states for individual link queries.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchLinkByIdAction } from '../../lib/actions/fetch';
import { linksQueryKeys } from '../../lib/query-keys';
import type { LinkWithStats, DatabaseId } from '@/lib/supabase/types';

interface UseLinkQueryOptions {
  enabled?: boolean;
}

interface UseLinkQueryResult {
  data: LinkWithStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook for fetching a single link by ID
 */
export function useLinkQuery(
  linkId: DatabaseId,
  options: UseLinkQueryOptions = {}
): UseLinkQueryResult {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: linksQueryKeys.detail(linkId),
    queryFn: async (): Promise<LinkWithStats | null> => {
      const result = await fetchLinkByIdAction(linkId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link');
      }

      return result.data || null;
    },
    enabled: enabled && !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return {
    data: query.data !== undefined ? query.data : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook for checking if a link exists (lightweight version)
 */
export function useLinkExists(
  linkId: DatabaseId,
  options: UseLinkQueryOptions = {}
): boolean {
  const { data, isLoading } = useLinkQuery(linkId, options);

  if (isLoading) return false;
  return data !== null;
}

/**
 * Hook for fetching link title only (useful for breadcrumbs)
 */
export function useLinkTitle(
  linkId: DatabaseId,
  options: UseLinkQueryOptions = {}
): string | null {
  const { data, isLoading } = useLinkQuery(linkId, options);

  if (isLoading || !data) return null;
  return data.title;
}
