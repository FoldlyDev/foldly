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
import { useMemo } from 'react';

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
    includeInactive = true,
    limit = 50,
    offset = 0,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: linksQueryKeys.list({ ...filters, includeInactive }),
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

  // Apply client-side filtering with base link pinning
  const filteredData = useMemo(() => {
    // Find the base link first
    const baseLink = data.find(link => link.linkType === 'base');
    const nonBaseLinks = data.filter(link => link.linkType !== 'base');

    // Apply filtering to all links
    const filterLink = (link: LinkWithStats) => {
      // Search query filter
      if (filters.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch =
          link.title.toLowerCase().includes(searchLower) ||
          link.description?.toLowerCase().includes(searchLower) ||
          link.topic?.toLowerCase().includes(searchLower) ||
          link.slug?.toLowerCase().includes(searchLower);
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
    };

    // Filter base link and other links
    const baseLinkMatches = baseLink ? filterLink(baseLink) : false;
    const filteredNonBaseLinks = nonBaseLinks.filter(filterLink);

    // Apply base link pinning logic
    let resultLinks: LinkWithStats[] = [];

    if (filters.searchQuery) {
      // If searching:
      // - If base link matches search, pin it at the start
      // - Otherwise, only show search results
      if (baseLinkMatches) {
        resultLinks = [baseLink!, ...filteredNonBaseLinks];
      } else {
        resultLinks = filteredNonBaseLinks;
      }
    } else {
      // If not searching:
      // - Always pin base link at the start (if it exists and passes other filters)
      if (baseLink && filterLink(baseLink)) {
        resultLinks = [baseLink, ...filteredNonBaseLinks];
      } else {
        resultLinks = filteredNonBaseLinks;
      }
    }

    return resultLinks;
  }, [data, filters]);

  // Apply client-side sorting (but keep base link pinned if it exists)
  const sortedData = useMemo(() => {
    if (!filters.sortBy) return filteredData;

    const baseLink = filteredData.find(link => link.linkType === 'base');
    const nonBaseLinks = filteredData.filter(link => link.linkType !== 'base');

    const field = filters.sortBy;
    const direction = filters.sortDirection || 'desc';

    const sortedNonBaseLinks = [...nonBaseLinks].sort((a, b) => {
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

    // Always keep base link at the start if it exists
    return baseLink ? [baseLink, ...sortedNonBaseLinks] : sortedNonBaseLinks;
  }, [filteredData, filters.sortBy, filters.sortDirection]);

  return {
    data: sortedData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}
