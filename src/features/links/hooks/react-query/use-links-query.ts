/**
 * React Query hook for fetching links list
 *
 * Integrates with existing server actions and provides optimized caching,
 * error handling, and loading states for the links feature.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchLinksAction } from '../../lib/actions/fetch';
import { linksQueryKeys, type LinksQueryFilters } from '../../lib/query-keys';
import type { LinkWithStats } from '@/lib/supabase/types/links';
import type { ActionResult } from '../../lib/validations';

interface UseLinksQueryOptions {
  filters?: LinksQueryFilters;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

interface UseLinksQueryResult {
  data: LinkWithStats[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook for fetching the user's links with filtering and pagination
 */
export function useLinksQuery(
  options: UseLinksQueryOptions = {}
): UseLinksQueryResult {
  const {
    filters,
    includeInactive = false,
    limit = 50,
    offset = 0,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: linksQueryKeys.list(filters),
    queryFn: async (): Promise<LinkWithStats[]> => {
      const result = await fetchLinksAction({
        includeInactive,
        limit,
        offset,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links');
      }

      return result.data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * Hook for fetching links with client-side filtering applied
 * This version applies filters on the client side for better UX
 */
export function useFilteredLinksQuery(
  filters: LinksQueryFilters,
  options: Omit<UseLinksQueryOptions, 'filters'> = {}
): UseLinksQueryResult {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useLinksQuery({
      ...options,
      // Don't pass filters to server, handle client-side
    });

  // Apply client-side filtering
  const filteredData = data.filter(link => {
    // Search query filter
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      const matchesSearch =
        link.title.toLowerCase().includes(searchLower) ||
        link.description?.toLowerCase().includes(searchLower) ||
        link.topic?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filters.filterType && filters.filterType !== 'all') {
      if (link.linkType !== filters.filterType) return false;
    }

    // Status filter
    if (filters.filterStatus && filters.filterStatus !== 'all') {
      switch (filters.filterStatus) {
        case 'active':
          if (!link.isActive) return false;
          break;
        case 'paused':
          if (link.isActive) return false;
          break;
        case 'expired':
          if (!link.expiresAt || new Date() <= new Date(link.expiresAt))
            return false;
          break;
      }
    }

    return true;
  });

  // Apply client-side sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!filters.sortBy) return 0;

    const field = filters.sortBy;
    const direction = filters.sortDirection || 'desc';

    let aValue = a[field];
    let bValue = b[field];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'desc' ? -comparison : comparison;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return direction === 'desc' ? -comparison : comparison;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return direction === 'desc' ? -comparison : comparison;
    }

    return 0;
  });

  return {
    data: sortedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
