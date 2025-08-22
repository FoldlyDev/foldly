# 🔄 State Management Implementation Guide

> **React Query v5 + Zustand hybrid architecture for optimal performance and developer experience**  
> **Status**: 95% Complete - Production ready with modern patterns  
> **Last Updated**: January 2025

## 🎯 **State Management Overview**

Foldly implements a **hybrid state management architecture** that combines the best of both worlds:

- **React Query v5**: Server state management with intelligent caching, background updates, and optimistic mutations
- **Zustand**: Client-side UI state management with minimal boilerplate and excellent TypeScript support

This architecture provides **exceptional performance**, **developer experience**, and **maintainability** while following 2025 best practices.

### **Architecture Principles**

1. **Clear Separation**: Server state vs Client state handled by specialized tools
2. **Single Source of Truth**: Each piece of state has one authoritative source
3. **Optimistic Updates**: Immediate UI updates with server sync and rollback
4. **Intelligent Caching**: Automatic cache management with strategic invalidation
5. **Type Safety**: End-to-end TypeScript integration with branded types

---

## 🏗️ **React Query v5 Implementation**

### **Global Query Client Configuration**

```typescript
// src/lib/config/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered stale after 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes after component unmount
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Don't refetch on reconnect unless data is stale
        refetchOnReconnect: 'always',
        // Network mode configuration
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
        // Network mode for mutations
        networkMode: 'online',
      },
    },
  });
}

// Global query client instance
export const queryClient = createQueryClient();
```

### **Provider Setup**

```typescript
// src/lib/providers/query-client-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createQueryClient } from '@/lib/config/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create query client instance once per component tree
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
```

---

## 🔗 **Feature-Based Query Implementation**

### **Links Feature Query Hooks**

```typescript
// src/features/links/hooks/react-query/use-links-query.ts
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { fetchUserLinks } from '@/features/links/lib/actions';
import { linkQueryKeys } from '@/features/links/lib/query-keys';
import type { LinkWithStats } from '@/features/links/types';

/**
 * Hook for fetching user links with automatic caching and background updates
 */
export function useLinksQuery(
  userId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: linkQueryKeys.userLinks(userId),
    queryFn: async () => {
      const result = await fetchUserLinks(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options?.refetchInterval,
    meta: {
      // Add metadata for devtools and error handling
      feature: 'links',
      operation: 'fetch-user-links',
    },
  });
}

/**
 * Suspense version for use in React 18+ Suspense boundaries
 */
export function useLinksSuspenseQuery(userId: string) {
  return useSuspenseQuery({
    queryKey: linkQueryKeys.userLinks(userId),
    queryFn: async () => {
      const result = await fetchUserLinks(userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching a single link by ID
 */
export function useLinkQuery(linkId: string, userId: string) {
  return useQuery({
    queryKey: linkQueryKeys.link(linkId),
    queryFn: async () => {
      const result = await fetchLinkById(linkId, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!linkId && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes for individual links
  });
}

/**
 * Hook for link analytics data
 */
export function useLinkAnalyticsQuery(linkId: string, userId: string) {
  return useQuery({
    queryKey: linkQueryKeys.analytics(linkId),
    queryFn: async () => {
      const result = await fetchLinkAnalytics(linkId, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!linkId && !!userId,
    staleTime: 30 * 1000, // 30 seconds for analytics (more frequent updates)
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}
```

### **Optimistic Update Mutations**

```typescript
// src/features/links/hooks/react-query/use-create-link-mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLinkAction } from '@/features/links/lib/actions';
import { linkQueryKeys } from '@/features/links/lib/query-keys';
import { toast } from 'sonner';
import type {
  LinkInsert,
  LinkSelect,
  LinkWithStats,
} from '@/features/links/types';

export function useCreateLinkMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkData: LinkInsert): Promise<LinkSelect> => {
      const result = await createLinkAction(linkData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    // Optimistic update - immediately update UI before server response
    onMutate: async newLinkData => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: linkQueryKeys.userLinks(userId),
      });

      // Snapshot the previous value
      const previousLinks = queryClient.getQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId),
        old => {
          if (!old) return [];

          // Create optimistic link
          const optimisticLink: LinkWithStats = {
            id: `temp-${Date.now()}`, // Temporary ID
            ...newLinkData,
            fileCount: 0,
            batchCount: 0,
            totalSize: 0,
            fullUrl: newLinkData.topic
              ? `foldly.com/${newLinkData.slug}/${newLinkData.topic}`
              : `foldly.com/${newLinkData.slug}`,
            hasRecentActivity: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return [optimisticLink, ...old];
        }
      );

      // Return context object with snapshot
      return { previousLinks };
    },

    // On success, update with real data from server
    onSuccess: (newLink, variables, context) => {
      // Replace optimistic update with real data
      queryClient.setQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId),
        old => {
          if (!old) return [];

          // Remove optimistic entry and add real one
          const withoutOptimistic = old.filter(
            link => !link.id.startsWith('temp-')
          );
          const realLink: LinkWithStats = {
            ...newLink,
            fileCount: 0,
            batchCount: 0,
            totalSize: 0,
            fullUrl: newLink.topic
              ? `foldly.com/${newLink.slug}/${newLink.topic}`
              : `foldly.com/${newLink.slug}`,
            hasRecentActivity: false,
          };

          return [realLink, ...withoutOptimistic];
        }
      );

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.userLinks(userId),
      });

      toast.success('Link created successfully!');
    },

    // On error, rollback optimistic update
    onError: (error, variables, context) => {
      // Rollback to previous state
      if (context?.previousLinks) {
        queryClient.setQueryData(
          linkQueryKeys.userLinks(userId),
          context.previousLinks
        );
      }

      toast.error(error.message || 'Failed to create link');
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.userLinks(userId),
      });
    },

    meta: {
      feature: 'links',
      operation: 'create-link',
    },
  });
}

// src/features/links/hooks/react-query/use-update-link-mutation.ts
export function useUpdateLinkMutation(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      linkId,
      updates,
    }: {
      linkId: string;
      updates: Partial<LinkInsert>;
    }) => {
      const result = await updateLinkAction(linkId, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onMutate: async ({ linkId, updates }) => {
      // Cancel queries
      await queryClient.cancelQueries({
        queryKey: linkQueryKeys.userLinks(userId),
      });
      await queryClient.cancelQueries({
        queryKey: linkQueryKeys.link(linkId),
      });

      // Snapshot previous values
      const previousLinks = queryClient.getQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId)
      );
      const previousLink = queryClient.getQueryData<LinkSelect>(
        linkQueryKeys.link(linkId)
      );

      // Optimistically update user links list
      queryClient.setQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId),
        old => {
          if (!old) return [];
          return old.map(link =>
            link.id === linkId
              ? { ...link, ...updates, updatedAt: new Date() }
              : link
          );
        }
      );

      // Optimistically update individual link
      queryClient.setQueryData<LinkSelect>(linkQueryKeys.link(linkId), old => {
        if (!old) return old;
        return { ...old, ...updates, updatedAt: new Date() };
      });

      return { previousLinks, previousLink };
    },

    onSuccess: updatedLink => {
      // Update cache with server response
      queryClient.setQueryData<LinkWithStats[]>(
        linkQueryKeys.userLinks(userId),
        old => {
          if (!old) return [];
          return old.map(link =>
            link.id === updatedLink.id ? { ...link, ...updatedLink } : link
          );
        }
      );

      queryClient.setQueryData(linkQueryKeys.link(updatedLink.id), updatedLink);

      toast.success('Link updated successfully!');
    },

    onError: (error, { linkId }, context) => {
      // Rollback optimistic updates
      if (context?.previousLinks) {
        queryClient.setQueryData(
          linkQueryKeys.userLinks(userId),
          context.previousLinks
        );
      }
      if (context?.previousLink) {
        queryClient.setQueryData(
          linkQueryKeys.link(linkId),
          context.previousLink
        );
      }

      toast.error(error.message || 'Failed to update link');
    },

    onSettled: (data, error, { linkId }) => {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.userLinks(userId),
      });
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.link(linkId),
      });
    },
  });
}
```

### **Query Key Management**

```typescript
// src/features/links/lib/query-keys.ts
/**
 * Centralized query key factory for links feature
 * Provides type-safe, hierarchical query keys with proper invalidation support
 */
export const linkQueryKeys = {
  // Base key for all link-related queries
  all: ['links'] as const,

  // User-specific queries
  userLinks: (userId: string) =>
    [...linkQueryKeys.all, 'user', userId] as const,

  // Individual link queries
  links: () => [...linkQueryKeys.all, 'link'] as const,
  link: (linkId: string) => [...linkQueryKeys.links(), linkId] as const,

  // Analytics queries
  analytics: (linkId: string) =>
    [...linkQueryKeys.link(linkId), 'analytics'] as const,

  // Upload-related queries
  uploads: () => [...linkQueryKeys.all, 'uploads'] as const,
  linkUploads: (linkId: string) =>
    [...linkQueryKeys.uploads(), linkId] as const,

  // Search and filtering
  search: (query: string) => [...linkQueryKeys.all, 'search', query] as const,
  filtered: (userId: string, filters: Record<string, any>) =>
    [...linkQueryKeys.userLinks(userId), 'filtered', filters] as const,
} as const;

/**
 * Query key utilities for cache management
 */
export const linkQueryUtils = {
  /**
   * Invalidate all user links
   */
  invalidateUserLinks: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({
      queryKey: linkQueryKeys.userLinks(userId),
    });
  },

  /**
   * Invalidate specific link
   */
  invalidateLink: (queryClient: QueryClient, linkId: string) => {
    queryClient.invalidateQueries({
      queryKey: linkQueryKeys.link(linkId),
    });
  },

  /**
   * Remove link from cache (after deletion)
   */
  removeLink: (queryClient: QueryClient, linkId: string) => {
    queryClient.removeQueries({
      queryKey: linkQueryKeys.link(linkId),
    });
  },

  /**
   * Prefetch user links
   */
  prefetchUserLinks: async (queryClient: QueryClient, userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: linkQueryKeys.userLinks(userId),
      queryFn: async () => {
        const result = await fetchUserLinks(userId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  },
};
```

---

## 🎮 **Zustand UI State Management**

### **Feature-Based Store Architecture**

```typescript
// src/features/links/store/ui-store.ts
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LinkSelect } from '@/features/links/types';

interface LinksUIState {
  // Modal management
  modals: {
    create: { isOpen: boolean; data?: Partial<LinkSelect> };
    edit: { isOpen: boolean; linkId?: string };
    delete: { isOpen: boolean; linkId?: string };
    settings: { isOpen: boolean; linkId?: string };
    share: { isOpen: boolean; linkId?: string };
  };

  // View preferences
  view: {
    mode: 'grid' | 'list';
    sortBy: 'created' | 'updated' | 'name' | 'uploads' | 'size';
    sortOrder: 'asc' | 'desc';
    filterBy: 'all' | 'active' | 'inactive' | 'base' | 'custom' | 'generated';
    searchQuery: string;
    pageSize: number;
  };

  // Selection management
  selection: {
    selectedIds: Set<string>;
    isSelectMode: boolean;
    selectAll: boolean;
  };

  // Loading and error states
  ui: {
    isLoading: boolean;
    error: string | null;
    lastAction: string | null;
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'info' | 'warning';
      message: string;
      timestamp: Date;
    }>;
  };
}

interface LinksUIActions {
  // Modal actions
  openModal: (modal: keyof LinksUIState['modals'], data?: any) => void;
  closeModal: (modal: keyof LinksUIState['modals']) => void;
  closeAllModals: () => void;

  // View actions
  setViewMode: (mode: 'grid' | 'list') => void;
  setSorting: (
    sortBy: LinksUIState['view']['sortBy'],
    sortOrder?: 'asc' | 'desc'
  ) => void;
  setFilter: (filter: LinksUIState['view']['filterBy']) => void;
  setSearchQuery: (query: string) => void;
  setPageSize: (size: number) => void;

  // Selection actions
  toggleSelectMode: () => void;
  selectLink: (linkId: string) => void;
  deselectLink: (linkId: string) => void;
  toggleLinkSelection: (linkId: string) => void;
  selectAll: (linkIds: string[]) => void;
  clearSelection: () => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastAction: (action: string) => void;
  addNotification: (
    notification: Omit<
      LinksUIState['ui']['notifications'][0],
      'id' | 'timestamp'
    >
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Bulk actions
  reset: () => void;
}

export const useLinksUIStore = create<LinksUIState & LinksUIActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        modals: {
          create: { isOpen: false },
          edit: { isOpen: false },
          delete: { isOpen: false },
          settings: { isOpen: false },
          share: { isOpen: false },
        },
        view: {
          mode: 'grid',
          sortBy: 'created',
          sortOrder: 'desc',
          filterBy: 'all',
          searchQuery: '',
          pageSize: 12,
        },
        selection: {
          selectedIds: new Set(),
          isSelectMode: false,
          selectAll: false,
        },
        ui: {
          isLoading: false,
          error: null,
          lastAction: null,
          notifications: [],
        },

        // Modal actions
        openModal: (modal, data) =>
          set(state => {
            state.modals[modal].isOpen = true;
            if (data) {
              if (modal === 'create') {
                state.modals.create.data = data;
              } else if ('linkId' in data) {
                (state.modals[modal] as any).linkId = data.linkId;
              }
            }
          }),

        closeModal: modal =>
          set(state => {
            state.modals[modal].isOpen = false;
            if (modal === 'create') {
              state.modals.create.data = undefined;
            } else {
              (state.modals[modal] as any).linkId = undefined;
            }
          }),

        closeAllModals: () =>
          set(state => {
            Object.keys(state.modals).forEach(modal => {
              const modalKey = modal as keyof LinksUIState['modals'];
              state.modals[modalKey].isOpen = false;
              if (modalKey === 'create') {
                state.modals.create.data = undefined;
              } else {
                (state.modals[modalKey] as any).linkId = undefined;
              }
            });
          }),

        // View actions
        setViewMode: mode =>
          set(state => {
            state.view.mode = mode;
          }),

        setSorting: (sortBy, sortOrder) =>
          set(state => {
            state.view.sortBy = sortBy;
            if (sortOrder) {
              state.view.sortOrder = sortOrder;
            } else {
              // Toggle order if same field
              state.view.sortOrder =
                state.view.sortBy === sortBy && state.view.sortOrder === 'asc'
                  ? 'desc'
                  : 'asc';
            }
          }),

        setFilter: filter =>
          set(state => {
            state.view.filterBy = filter;
            // Clear search when changing filter
            state.view.searchQuery = '';
          }),

        setSearchQuery: query =>
          set(state => {
            state.view.searchQuery = query;
            // Clear filter when searching
            if (query) {
              state.view.filterBy = 'all';
            }
          }),

        setPageSize: size =>
          set(state => {
            state.view.pageSize = size;
          }),

        // Selection actions
        toggleSelectMode: () =>
          set(state => {
            state.selection.isSelectMode = !state.selection.isSelectMode;
            if (!state.selection.isSelectMode) {
              state.selection.selectedIds.clear();
              state.selection.selectAll = false;
            }
          }),

        selectLink: linkId =>
          set(state => {
            state.selection.selectedIds.add(linkId);
          }),

        deselectLink: linkId =>
          set(state => {
            state.selection.selectedIds.delete(linkId);
            state.selection.selectAll = false;
          }),

        toggleLinkSelection: linkId =>
          set(state => {
            if (state.selection.selectedIds.has(linkId)) {
              state.selection.selectedIds.delete(linkId);
              state.selection.selectAll = false;
            } else {
              state.selection.selectedIds.add(linkId);
            }
          }),

        selectAll: linkIds =>
          set(state => {
            if (state.selection.selectAll) {
              state.selection.selectedIds.clear();
              state.selection.selectAll = false;
            } else {
              linkIds.forEach(id => state.selection.selectedIds.add(id));
              state.selection.selectAll = true;
            }
          }),

        clearSelection: () =>
          set(state => {
            state.selection.selectedIds.clear();
            state.selection.selectAll = false;
          }),

        // UI state actions
        setLoading: loading =>
          set(state => {
            state.ui.isLoading = loading;
          }),

        setError: error =>
          set(state => {
            state.ui.error = error;
          }),

        setLastAction: action =>
          set(state => {
            state.ui.lastAction = action;
          }),

        addNotification: notification =>
          set(state => {
            const newNotification = {
              ...notification,
              id: `notification-${Date.now()}-${Math.random()}`,
              timestamp: new Date(),
            };
            state.ui.notifications.unshift(newNotification);

            // Limit notifications to 10
            if (state.ui.notifications.length > 10) {
              state.ui.notifications = state.ui.notifications.slice(0, 10);
            }
          }),

        removeNotification: id =>
          set(state => {
            state.ui.notifications = state.ui.notifications.filter(
              n => n.id !== id
            );
          }),

        clearNotifications: () =>
          set(state => {
            state.ui.notifications = [];
          }),

        // Reset everything
        reset: () =>
          set(state => {
            // Reset to initial state
            state.modals = {
              create: { isOpen: false },
              edit: { isOpen: false },
              delete: { isOpen: false },
              settings: { isOpen: false },
              share: { isOpen: false },
            };
            state.view = {
              mode: 'grid',
              sortBy: 'created',
              sortOrder: 'desc',
              filterBy: 'all',
              searchQuery: '',
              pageSize: 12,
            };
            state.selection = {
              selectedIds: new Set(),
              isSelectMode: false,
              selectAll: false,
            };
            state.ui = {
              isLoading: false,
              error: null,
              lastAction: null,
              notifications: [],
            };
          }),
      })),
      {
        name: 'links-ui-store',
        version: 1,
      }
    )
  )
);

// Selector hooks for performance optimization
export const useLinksModals = () => useLinksUIStore(state => state.modals);
export const useLinksView = () => useLinksUIStore(state => state.view);
export const useLinksSelection = () =>
  useLinksUIStore(state => state.selection);
export const useLinksUI = () => useLinksUIStore(state => state.ui);

// Action hooks
export const useLinksUIActions = () =>
  useLinksUIStore(state => ({
    openModal: state.openModal,
    closeModal: state.closeModal,
    closeAllModals: state.closeAllModals,
    setViewMode: state.setViewMode,
    setSorting: state.setSorting,
    setFilter: state.setFilter,
    setSearchQuery: state.setSearchQuery,
    setPageSize: state.setPageSize,
    toggleSelectMode: state.toggleSelectMode,
    selectLink: state.selectLink,
    deselectLink: state.deselectLink,
    toggleLinkSelection: state.toggleLinkSelection,
    selectAll: state.selectAll,
    clearSelection: state.clearSelection,
    setLoading: state.setLoading,
    setError: state.setError,
    setLastAction: state.setLastAction,
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    reset: state.reset,
  }));
```

### **Store Persistence and Hydration**

```typescript
// src/features/links/store/persistent-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

interface LinksPersistentState {
  // User preferences that should persist
  preferences: {
    viewMode: 'grid' | 'list';
    pageSize: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    theme: 'light' | 'dark' | 'system';
  };

  // Recently viewed links
  recentLinks: Array<{
    linkId: string;
    timestamp: Date;
    linkData: {
      title: string;
      fullUrl: string;
      linkType: string;
    };
  }>;

  // User-specific settings
  settings: {
    autoRefresh: boolean;
    refreshInterval: number;
    showNotifications: boolean;
    compactMode: boolean;
  };
}

interface LinksPersistentActions {
  // Preference actions
  setViewMode: (mode: 'grid' | 'list') => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Recent links actions
  addRecentLink: (linkId: string, linkData: any) => void;
  clearRecentLinks: () => void;

  // Settings actions
  updateSettings: (settings: Partial<LinksPersistentState['settings']>) => void;

  // Reset
  resetPreferences: () => void;
}

export const useLinksPersistentStore = create<
  LinksPersistentState & LinksPersistentActions
>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        preferences: {
          viewMode: 'grid',
          pageSize: 12,
          sortBy: 'created',
          sortOrder: 'desc',
          theme: 'system',
        },
        recentLinks: [],
        settings: {
          autoRefresh: true,
          refreshInterval: 30000, // 30 seconds
          showNotifications: true,
          compactMode: false,
        },

        // Actions
        setViewMode: mode =>
          set(state => ({
            preferences: { ...state.preferences, viewMode: mode },
          })),

        setPageSize: size =>
          set(state => ({
            preferences: { ...state.preferences, pageSize: size },
          })),

        setSorting: (sortBy, sortOrder) =>
          set(state => ({
            preferences: { ...state.preferences, sortBy, sortOrder },
          })),

        setTheme: theme =>
          set(state => ({
            preferences: { ...state.preferences, theme },
          })),

        addRecentLink: (linkId, linkData) =>
          set(state => {
            const existingIndex = state.recentLinks.findIndex(
              item => item.linkId === linkId
            );

            const newItem = {
              linkId,
              timestamp: new Date(),
              linkData,
            };

            let newRecentLinks;
            if (existingIndex >= 0) {
              // Update existing item
              newRecentLinks = [...state.recentLinks];
              newRecentLinks[existingIndex] = newItem;
            } else {
              // Add new item
              newRecentLinks = [newItem, ...state.recentLinks];
            }

            // Keep only last 10 items
            return {
              recentLinks: newRecentLinks.slice(0, 10),
            };
          }),

        clearRecentLinks: () => set({ recentLinks: [] }),

        updateSettings: newSettings =>
          set(state => ({
            settings: { ...state.settings, ...newSettings },
          })),

        resetPreferences: () =>
          set({
            preferences: {
              viewMode: 'grid',
              pageSize: 12,
              sortBy: 'created',
              sortOrder: 'desc',
              theme: 'system',
            },
            settings: {
              autoRefresh: true,
              refreshInterval: 30000,
              showNotifications: true,
              compactMode: false,
            },
          }),
      }),
      {
        name: 'links-persistent-store',
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: state => ({
          // Only persist certain parts of the state
          preferences: state.preferences,
          recentLinks: state.recentLinks,
          settings: state.settings,
        }),
        skipHydration: false,
        onRehydrateStorage: () => state => {
          // Handle rehydration
          console.log('Links persistent store rehydrated');
        },
      }
    ),
    { name: 'links-persistent-store' }
  )
);
```

---

## 🔄 **Workspace Tree State Management**

### **Headless Tree Integration with React Query**

```typescript
// src/features/workspace/hooks/use-workspace-tree.ts
import { useMemo } from 'react';
import { useTree } from '@headless-tree/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  syncDataLoaderFeature,
  selectionFeature,
  dragAndDropFeature,
  searchFeature,
  hotkeysFeature,
} from '@headless-tree/react';
import {
  createTreeDataAdapter,
  createFilteredTreeAdapter,
} from '../lib/tree-data-adapter';
import { workspaceQueryKeys } from '../lib/query-keys';
import {
  fetchWorkspaceData,
  moveItemsAction,
  deleteItemsAction,
} from '../lib/actions';
import type { TreeItem, WorkspaceData } from '../types';

export function useWorkspaceTree(workspaceId: string) {
  const queryClient = useQueryClient();

  // Fetch workspace data with React Query
  const {
    data: workspaceData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: workspaceQueryKeys.workspace(workspaceId),
    queryFn: async () => {
      const result = await fetchWorkspaceData(workspaceId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // Create data adapter for tree
  const dataLoader = useMemo(() => {
    if (!workspaceData) return null;

    const baseAdapter = createTreeDataAdapter(
      workspaceData.folders,
      workspaceData.files,
      workspaceData.name
    );

    // Add filtering capabilities
    return createFilteredTreeAdapter(baseAdapter, {
      filterBy: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }, [workspaceData]);

  // Move items mutation
  const moveItemsMutation = useMutation({
    mutationFn: async ({
      itemIds,
      targetParentId,
      targetIndex,
    }: {
      itemIds: string[];
      targetParentId: string | null;
      targetIndex: number;
    }) => {
      const result = await moveItemsAction(
        workspaceId,
        itemIds,
        targetParentId,
        targetIndex
      );
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      // Invalidate workspace data to refetch
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.workspace(workspaceId),
      });
    },
  });

  // Delete items mutation
  const deleteItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const result = await deleteItemsAction(workspaceId, itemIds);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.workspace(workspaceId),
      });
    },
  });

  // Initialize tree with headless-tree
  const tree = useTree<TreeItem>({
    rootItemId: 'root',
    getItemName: item => item.getItemData().name,
    isItemFolder: item => !item.getItemData().isFile,
    dataLoader,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      dragAndDropFeature.with({
        canReorder: true,
        canMove: true,
        onDrop: async ({ dragItems, targetItem, targetIndex }) => {
          try {
            const itemIds = dragItems.map(item => item.getId());
            const targetParentId = targetItem?.getId() || null;

            await moveItemsMutation.mutateAsync({
              itemIds,
              targetParentId,
              targetIndex,
            });
          } catch (error) {
            console.error('Drop operation failed:', error);
            // Tree will automatically revert on error
          }
        },
      }),
      searchFeature,
      hotkeysFeature.with({
        Delete: () => {
          const selectedItems = tree.getSelectedItems();
          if (selectedItems.length > 0) {
            const itemIds = selectedItems.map(item => item.getId());
            deleteItemsMutation.mutate(itemIds);
          }
        },
        'Ctrl+A': () => {
          tree.selectAll();
        },
        Escape: () => {
          tree.clearSelection();
        },
      }),
    ],
  });

  return {
    tree,
    workspaceData,
    isLoading,
    error,
    refetch,
    mutations: {
      moveItems: moveItemsMutation,
      deleteItems: deleteItemsMutation,
    },
  };
}
```

---

## 🧪 **Testing State Management**

### **React Query Testing Utilities**

```typescript
// src/lib/test-utils/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: Infinity, // Keep data forever in tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithQueryClient(
  ui: ReactNode,
  queryClient = createTestQueryClient()
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper }),
    queryClient,
  };
}
```

### **Zustand Store Testing**

```typescript
// src/features/links/store/__tests__/ui-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useLinksUIStore } from '../ui-store';

describe('LinksUIStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLinksUIStore.getState().reset();
  });

  describe('modal management', () => {
    it('should open and close modals correctly', () => {
      const { openModal, closeModal } = useLinksUIStore.getState();

      // Open create modal
      openModal('create', { title: 'Test Link' });
      expect(useLinksUIStore.getState().modals.create.isOpen).toBe(true);
      expect(useLinksUIStore.getState().modals.create.data?.title).toBe(
        'Test Link'
      );

      // Close create modal
      closeModal('create');
      expect(useLinksUIStore.getState().modals.create.isOpen).toBe(false);
      expect(useLinksUIStore.getState().modals.create.data).toBeUndefined();
    });

    it('should close all modals', () => {
      const { openModal, closeAllModals } = useLinksUIStore.getState();

      // Open multiple modals
      openModal('create');
      openModal('edit', { linkId: 'test-id' });

      // Close all
      closeAllModals();

      const modals = useLinksUIStore.getState().modals;
      expect(modals.create.isOpen).toBe(false);
      expect(modals.edit.isOpen).toBe(false);
    });
  });

  describe('selection management', () => {
    it('should handle link selection', () => {
      const { selectLink, deselectLink, toggleLinkSelection } =
        useLinksUIStore.getState();

      // Select link
      selectLink('link-1');
      expect(
        useLinksUIStore.getState().selection.selectedIds.has('link-1')
      ).toBe(true);

      // Toggle selection (should deselect)
      toggleLinkSelection('link-1');
      expect(
        useLinksUIStore.getState().selection.selectedIds.has('link-1')
      ).toBe(false);

      // Toggle again (should select)
      toggleLinkSelection('link-1');
      expect(
        useLinksUIStore.getState().selection.selectedIds.has('link-1')
      ).toBe(true);

      // Deselect
      deselectLink('link-1');
      expect(
        useLinksUIStore.getState().selection.selectedIds.has('link-1')
      ).toBe(false);
    });

    it('should handle select all', () => {
      const { selectAll } = useLinksUIStore.getState();
      const linkIds = ['link-1', 'link-2', 'link-3'];

      // Select all
      selectAll(linkIds);

      const selection = useLinksUIStore.getState().selection;
      expect(selection.selectAll).toBe(true);
      expect(selection.selectedIds.size).toBe(3);
      linkIds.forEach(id => {
        expect(selection.selectedIds.has(id)).toBe(true);
      });

      // Select all again (should deselect all)
      selectAll(linkIds);

      const selectionAfter = useLinksUIStore.getState().selection;
      expect(selectionAfter.selectAll).toBe(false);
      expect(selectionAfter.selectedIds.size).toBe(0);
    });
  });

  describe('view management', () => {
    it('should update view preferences', () => {
      const { setViewMode, setSorting, setFilter, setSearchQuery } =
        useLinksUIStore.getState();

      // Set view mode
      setViewMode('list');
      expect(useLinksUIStore.getState().view.mode).toBe('list');

      // Set sorting
      setSorting('name', 'asc');
      expect(useLinksUIStore.getState().view.sortBy).toBe('name');
      expect(useLinksUIStore.getState().view.sortOrder).toBe('asc');

      // Set filter
      setFilter('active');
      expect(useLinksUIStore.getState().view.filterBy).toBe('active');

      // Set search query (should clear filter)
      setSearchQuery('test');
      expect(useLinksUIStore.getState().view.searchQuery).toBe('test');
      expect(useLinksUIStore.getState().view.filterBy).toBe('all');
    });
  });

  describe('notifications', () => {
    it('should manage notifications', () => {
      const { addNotification, removeNotification, clearNotifications } =
        useLinksUIStore.getState();

      // Add notification
      addNotification({
        type: 'success',
        message: 'Test notification',
      });

      const notifications = useLinksUIStore.getState().ui.notifications;
      expect(notifications).toHaveLength(1);
      expect(notifications[0].message).toBe('Test notification');
      expect(notifications[0].type).toBe('success');

      // Remove notification
      const notificationId = notifications[0].id;
      removeNotification(notificationId);
      expect(useLinksUIStore.getState().ui.notifications).toHaveLength(0);

      // Add multiple and clear all
      addNotification({ type: 'info', message: 'Info 1' });
      addNotification({ type: 'error', message: 'Error 1' });
      expect(useLinksUIStore.getState().ui.notifications).toHaveLength(2);

      clearNotifications();
      expect(useLinksUIStore.getState().ui.notifications).toHaveLength(0);
    });

    it('should limit notifications to 10', () => {
      const { addNotification } = useLinksUIStore.getState();

      // Add 15 notifications
      for (let i = 0; i < 15; i++) {
        addNotification({
          type: 'info',
          message: `Notification ${i}`,
        });
      }

      // Should only keep the last 10
      const notifications = useLinksUIStore.getState().ui.notifications;
      expect(notifications).toHaveLength(10);
      expect(notifications[0].message).toBe('Notification 14'); // Most recent first
    });
  });
});
```

---

## 🚀 **Performance Optimization**

### **Query Optimization Strategies**

```typescript
// src/features/links/hooks/use-optimized-links.ts
import { useMemo } from 'react';
import { useLinksQuery } from './react-query/use-links-query';
import { useLinksView, useLinksSelection } from '../store/ui-store';
import { useLinksPersistentStore } from '../store/persistent-store';
import type { LinkWithStats } from '../types';

/**
 * Optimized hook that combines server state with UI state and applies
 * filtering, sorting, and pagination on the client side for better performance
 */
export function useOptimizedLinks(userId: string) {
  // Fetch data from server
  const linksQuery = useLinksQuery(userId, {
    refetchInterval: useLinksPersistentStore(state =>
      state.settings.autoRefresh ? state.settings.refreshInterval : undefined
    ),
  });

  // Get UI state
  const view = useLinksView();
  const selection = useLinksSelection();

  // Memoized filtering and sorting
  const processedLinks = useMemo(() => {
    if (!linksQuery.data) return [];

    let filteredLinks = linksQuery.data;

    // Apply search filter
    if (view.searchQuery) {
      const query = view.searchQuery.toLowerCase();
      filteredLinks = filteredLinks.filter(
        link =>
          link.title.toLowerCase().includes(query) ||
          link.description?.toLowerCase().includes(query) ||
          link.fullUrl.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (view.filterBy !== 'all') {
      switch (view.filterBy) {
        case 'active':
          filteredLinks = filteredLinks.filter(link => link.isActive);
          break;
        case 'inactive':
          filteredLinks = filteredLinks.filter(link => !link.isActive);
          break;
        case 'base':
        case 'custom':
        case 'generated':
          filteredLinks = filteredLinks.filter(
            link => link.linkType === view.filterBy
          );
          break;
      }
    }

    // Apply sorting
    filteredLinks.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (view.sortBy) {
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'uploads':
          aValue = a.totalUploads;
          bValue = b.totalUploads;
          break;
        case 'size':
          aValue = a.totalSize;
          bValue = b.totalSize;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return view.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return view.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredLinks;
  }, [
    linksQuery.data,
    view.searchQuery,
    view.filterBy,
    view.sortBy,
    view.sortOrder,
  ]);

  // Memoized pagination
  const paginatedLinks = useMemo(() => {
    const startIndex = 0; // For infinite scroll, we show all processed links
    return processedLinks.slice(startIndex);
  }, [processedLinks]);

  // Selection helpers
  const selectionHelpers = useMemo(
    () => ({
      isSelected: (linkId: string) => selection.selectedIds.has(linkId),
      selectedCount: selection.selectedIds.size,
      selectedLinks: paginatedLinks.filter(link =>
        selection.selectedIds.has(link.id)
      ),
      canSelectAll: paginatedLinks.length > 0,
      isAllSelected:
        paginatedLinks.length > 0 &&
        paginatedLinks.every(link => selection.selectedIds.has(link.id)),
    }),
    [selection.selectedIds, paginatedLinks]
  );

  return {
    // Query state
    links: paginatedLinks,
    isLoading: linksQuery.isLoading,
    error: linksQuery.error,
    refetch: linksQuery.refetch,

    // Processed data
    totalCount: processedLinks.length,
    filteredCount: processedLinks.length,

    // Selection helpers
    selection: selectionHelpers,

    // View state
    view,
  };
}
```

### **Store Optimization with Selectors**

```typescript
// src/features/links/store/selectors.ts
import { useLinksUIStore } from './ui-store';
import { shallow } from 'zustand/shallow';

/**
 * Optimized selectors to prevent unnecessary re-renders
 * Use these instead of accessing the store directly in components
 */

// Modal selectors
export const useCreateModal = () =>
  useLinksUIStore(state => state.modals.create, shallow);

export const useEditModal = () =>
  useLinksUIStore(state => state.modals.edit, shallow);

export const useDeleteModal = () =>
  useLinksUIStore(state => state.modals.delete, shallow);

// View selectors
export const useViewMode = () => useLinksUIStore(state => state.view.mode);

export const useSortingState = () =>
  useLinksUIStore(
    state => ({
      sortBy: state.view.sortBy,
      sortOrder: state.view.sortOrder,
    }),
    shallow
  );

export const useFilterState = () =>
  useLinksUIStore(
    state => ({
      filterBy: state.view.filterBy,
      searchQuery: state.view.searchQuery,
    }),
    shallow
  );

// Selection selectors
export const useSelectionCount = () =>
  useLinksUIStore(state => state.selection.selectedIds.size);

export const useIsSelectMode = () =>
  useLinksUIStore(state => state.selection.isSelectMode);

export const useSelectedIds = () =>
  useLinksUIStore(state => Array.from(state.selection.selectedIds));

// UI state selectors
export const useIsLoading = () => useLinksUIStore(state => state.ui.isLoading);

export const useError = () => useLinksUIStore(state => state.ui.error);

export const useNotifications = () =>
  useLinksUIStore(state => state.ui.notifications, shallow);

// Composite selectors for complex UI logic
export const useModalState = () =>
  useLinksUIStore(
    state => ({
      isCreateOpen: state.modals.create.isOpen,
      isEditOpen: state.modals.edit.isOpen,
      isDeleteOpen: state.modals.delete.isOpen,
      isSettingsOpen: state.modals.settings.isOpen,
      isShareOpen: state.modals.share.isOpen,
      hasOpenModal: Object.values(state.modals).some(modal => modal.isOpen),
    }),
    shallow
  );

export const useViewState = () =>
  useLinksUIStore(
    state => ({
      mode: state.view.mode,
      sortBy: state.view.sortBy,
      sortOrder: state.view.sortOrder,
      filterBy: state.view.filterBy,
      searchQuery: state.view.searchQuery,
      pageSize: state.view.pageSize,
    }),
    shallow
  );
```

---

## 📊 **State Management Metrics**

### **Performance Monitoring**

```typescript
// src/lib/monitoring/state-performance.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function StatePerformanceMonitor() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Monitor query cache size
      const cache = queryClient.getQueryCache();
      const interval = setInterval(() => {
        const queries = cache.getAll();
        const cacheSize = queries.length;
        const staleCounts = queries.filter(query => query.isStale()).length;

        console.log(`Query Cache Metrics:`, {
          totalQueries: cacheSize,
          staleQueries: staleCounts,
          freshQueries: cacheSize - staleCounts,
        });
      }, 30000); // Every 30 seconds

      // Monitor mutation performance
      const mutationCache = queryClient.getMutationCache();
      mutationCache.subscribe(event => {
        if (
          event.type === 'updated' &&
          event.mutation.state.status === 'success'
        ) {
          const duration =
            Date.now() - (event.mutation.state.submittedAt || Date.now());
          console.log(`Mutation completed:`, {
            mutationKey: event.mutation.options.mutationKey,
            duration: `${duration}ms`,
            status: event.mutation.state.status,
          });
        }
      });

      return () => clearInterval(interval);
    }
  }, [queryClient]);

  return null;
}
```

---

## 🎯 **Implementation Status**

### **Completed Components (95%)**

- ✅ **React Query v5 Setup**: Complete configuration with optimized defaults
- ✅ **Query Hooks**: Full CRUD operations with optimistic updates and error handling
- ✅ **Zustand Stores**: Feature-based UI state management with persistence
- ✅ **Store Integration**: Hybrid architecture connecting server and client state
- ✅ **Performance Optimization**: Selectors, memoization, and intelligent caching
- ✅ **Testing Infrastructure**: Comprehensive testing utilities for both React Query and Zustand

### **In Progress Components (85%)**

- 🟡 **Advanced Caching**: Background sync and intelligent prefetching strategies
- 🟡 **Error Recovery**: Advanced error boundary integration with state rollback
- 🟡 **Real-time Updates**: WebSocket integration with React Query cache updates
- 🟡 **Offline Support**: Service worker integration with optimistic updates queue

### **Next Implementation Steps**

1. **Complete Real-time Integration**: WebSocket updates with cache synchronization
2. **Advanced Error Handling**: Comprehensive error recovery with user feedback
3. **Performance Monitoring**: Production metrics and optimization insights
4. **Offline Support**: Background sync and queue management for offline operations

---

**State Management Status**: 📋 **95% Complete** - Production ready hybrid architecture  
**React Query Integration**: ✅ Complete with optimistic updates and intelligent caching  
**Zustand Implementation**: ✅ Feature-based stores with persistence and type safety  
**Performance Optimization**: ✅ Selectors, memoization, and monitoring systems operational

**Last Updated**: January 2025 - Comprehensive state management implementation guide
