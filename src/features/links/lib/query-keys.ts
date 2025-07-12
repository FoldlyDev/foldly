/**
 * Query Keys Factory for Links Feature
 *
 * Hierarchical structure:
 * - links: ['links'] - All links queries
 * - links.lists(): ['links', 'list'] - All list queries
 * - links.list(filters): ['links', 'list', filters] - Specific list query
 * - links.details(): ['links', 'detail'] - All detail queries
 * - links.detail(id): ['links', 'detail', id] - Specific detail query
 * - links.stats(): ['links', 'stats'] - Links statistics
 */

import type { LinkType, LinkSortField, DatabaseId } from '@/lib/supabase/types';

export interface LinksQueryFilters {
  searchQuery?: string;
  filterType?: LinkType | 'all';
  filterStatus?: 'all' | 'active' | 'paused' | 'expired';
  sortBy?: LinkSortField;
  sortDirection?: 'asc' | 'desc';
}

export const linksQueryKeys = {
  // Base key
  all: ['links'] as const,

  // Lists
  lists: () => [...linksQueryKeys.all, 'list'] as const,
  list: (filters?: LinksQueryFilters) =>
    [...linksQueryKeys.lists(), filters] as const,

  // Details
  details: () => [...linksQueryKeys.all, 'detail'] as const,
  detail: (id: DatabaseId) => [...linksQueryKeys.details(), id] as const,

  // Stats
  stats: () => [...linksQueryKeys.all, 'stats'] as const,

  // Mutations - for invalidation
  mutations: {
    create: () => [...linksQueryKeys.all, 'create'] as const,
    update: (id: DatabaseId) => [...linksQueryKeys.all, 'update', id] as const,
    delete: (id: DatabaseId) => [...linksQueryKeys.all, 'delete', id] as const,
  },
} as const;

// Type helpers for query keys
export type LinksListQueryKey = ReturnType<typeof linksQueryKeys.list>;
export type LinksDetailQueryKey = ReturnType<typeof linksQueryKeys.detail>;
