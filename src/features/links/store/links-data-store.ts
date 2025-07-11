/**
 * LinksDataStore - Focused store for CRUD operations and data management
 * Following 2025 Zustand best practices with pure reducers
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  convertReducersToActions,
  createReducers,
} from './utils/convert-reducers-to-actions';
import type { LinkWithStats } from '@/lib/supabase/types';
import type { DatabaseId } from '@/lib/supabase/types';

// State interface
interface LinksDataState {
  links: LinkWithStats[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Initial state
const initialState: LinksDataState = {
  links: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Pure reducers - completely testable, no side effects
const dataReducers = createReducers<
  LinksDataState,
  {
    setLoading: (state: LinksDataState, loading: boolean) => LinksDataState;
    setError: (state: LinksDataState, error: string | null) => LinksDataState;
    setLinks: (state: LinksDataState, links: LinkData[]) => LinksDataState;
    addLink: (state: LinksDataState, link: LinkData) => LinksDataState;
    updateLink: (
      state: LinksDataState,
      id: LinkId,
      updates: Partial<LinkData>
    ) => LinksDataState;
    removeLink: (state: LinksDataState, id: LinkId) => LinksDataState;
    updateLinkStats: (
      state: LinksDataState,
      id: LinkId,
      stats: { views?: number; uploads?: number }
    ) => LinksDataState;
  }
>({
  setLoading: (state, loading) => ({
    ...state,
    isLoading: loading,
    error: loading ? null : state.error, // Clear error when starting new operation
  }),

  setError: (state, error) => ({
    ...state,
    error,
    isLoading: false,
  }),

  setLinks: (state, links) => ({
    ...state,
    links,
    isLoading: false,
    error: null,
    lastFetch: new Date(),
  }),

  addLink: (state, link) => ({
    ...state,
    links: [link, ...state.links], // Add to beginning for newest-first ordering
    error: null,
  }),

  updateLink: (state, id, updates) => ({
    ...state,
    links: state.links.map(link =>
      link.id === id ? { ...link, ...updates } : link
    ),
    error: null,
  }),

  removeLink: (state, id) => ({
    ...state,
    links: state.links.filter(link => link.id !== id),
    error: null,
  }),

  updateLinkStats: (state, id, stats) => ({
    ...state,
    links: state.links.map(link =>
      link.id === id
        ? {
            ...link,
            views: stats.views ?? link.views,
            uploads: stats.uploads ?? link.uploads,
            lastActivity: new Date().toISOString(),
          }
        : link
    ),
  }),
});

// Create the store
export const useLinksDataStore = create<
  LinksDataState & ReturnType<typeof convertReducersToActions>
>()(
  devtools(
    set => ({
      ...initialState,
      ...convertReducersToActions(set, dataReducers),
    }),
    { name: 'LinksDataStore' }
  )
);

// Selectors for optimized component subscriptions
export const linksDataSelectors = {
  // Get all links
  links: (state: LinksDataState) => state.links,

  // Get links by type
  baseLinks: (state: LinksDataState) =>
    state.links.filter(link => link.linkType === 'base'),
  topicLinks: (state: LinksDataState) =>
    state.links.filter(link => link.linkType !== 'base'),

  // Get link by ID
  getLinkById: (id: LinkId) => (state: LinksDataState) =>
    state.links.find(link => link.id === id),

  // Loading and error states
  isLoading: (state: LinksDataState) => state.isLoading,
  error: (state: LinksDataState) => state.error,

  // Computed values
  totalLinks: (state: LinksDataState) => state.links.length,
  activeLinks: (state: LinksDataState) =>
    state.links.filter(link => link.status === 'active').length,
  totalViews: (state: LinksDataState) =>
    state.links.reduce((sum, link) => sum + link.views, 0),
  totalUploads: (state: LinksDataState) =>
    state.links.reduce((sum, link) => sum + link.uploads, 0),
};
