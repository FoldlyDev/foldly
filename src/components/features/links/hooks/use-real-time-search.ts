'use client';

import {
  useState,
  useTransition,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useDeferredValue,
} from 'react';

/**
 * Real-time search hook using 2025 React best practices
 *
 * Features:
 * - Instant client-side highlighting with useTransition
 * - Debounced server-side search operations
 * - Progressive enhancement pattern
 * - Performance optimized for large datasets
 * - Separates UI updates from API calls
 *
 * Based on: https://dev.to/fpaghar/mastering-usetransition-in-react-building-a-high-performance-search-for-50k-record-case-study-1bdn
 */

interface UseRealTimeSearchOptions {
  serverSearchDelay?: number; // Debounce for server calls
  enableServerSearch?: boolean; // Enable server-side search
  caseSensitive?: boolean;
  wholeWord?: boolean;
  maxResults?: number;
}

interface UseRealTimeSearchReturn<T> {
  // Search state
  query: string;
  deferredQuery: string; // For heavy operations
  isSearching: boolean;
  isPending: boolean;

  // Actions
  setQuery: (query: string) => void;
  clearSearch: () => void;

  // Client-side filtering (instant)
  filterItems: (
    items: T[],
    searchFn: (item: T, query: string) => boolean
  ) => T[];

  // Highlighting (instant)
  highlightText: (text: string) => string | React.ReactNode;

  // Server search (debounced)
  serverSearch: (searchFn: (query: string) => Promise<void>) => void;
}

export function useRealTimeSearch<T = any>(
  options: UseRealTimeSearchOptions = {}
): UseRealTimeSearchReturn<T> {
  const {
    serverSearchDelay = 300,
    enableServerSearch = false,
    caseSensitive = false,
    wholeWord = false,
    maxResults = 100,
  } = options;

  // Core search state
  const [query, setQueryState] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Deferred value for heavy operations (like server search)
  const deferredQuery = useDeferredValue(query);

  // Refs for debouncing
  const serverSearchTimeoutRef = useRef<number | null>(null);
  const lastServerQueryRef = useRef<string>('');

  // Instant client-side query setter with useTransition
  const setQuery = useCallback((newQuery: string) => {
    startTransition(() => {
      setQueryState(newQuery);
    });
  }, []);

  // Clear search function
  const clearSearch = useCallback(() => {
    setQueryState('');
    setIsSearching(false);
    if (serverSearchTimeoutRef.current) {
      clearTimeout(serverSearchTimeoutRef.current);
    }
  }, []);

  // Instant client-side filtering (no debouncing)
  const filterItems = useCallback(
    (items: T[], searchFn: (item: T, query: string) => boolean): T[] => {
      if (!query.trim()) return items;

      // Use transition for non-blocking filtering
      return items.filter(item => searchFn(item, query)).slice(0, maxResults);
    },
    [query, maxResults]
  );

  // Instant text highlighting (no debouncing)
  const highlightText = useCallback(
    (text: string): string | React.ReactNode => {
      if (!query.trim() || !text) return text;

      try {
        const flags = caseSensitive ? 'g' : 'gi';
        const searchPattern = wholeWord
          ? new RegExp(`\\b${escapeRegExp(query)}\\b`, flags)
          : new RegExp(escapeRegExp(query), flags);

        if (!searchPattern.test(text)) return text;

        const parts = text.split(searchPattern);
        const matches = text.match(searchPattern) || [];

        return parts.reduce(
          (acc, part, index) => {
            acc.push(part);
            if (index < matches.length) {
              acc.push(
                React.createElement(
                  'mark',
                  {
                    key: `highlight-${index}`,
                    className:
                      'bg-yellow-200 text-yellow-900 font-medium px-0.5 rounded',
                  },
                  matches[index]
                )
              );
            }
            return acc;
          },
          [] as (string | React.ReactElement)[]
        );
      } catch (error) {
        console.warn('Error in highlightText:', error);
        return text;
      }
    },
    [query, caseSensitive, wholeWord]
  );

  // Debounced server search
  const serverSearch = useCallback(
    (searchFn: (query: string) => Promise<void>) => {
      if (!enableServerSearch) return;

      // Clear existing timeout
      if (serverSearchTimeoutRef.current) {
        clearTimeout(serverSearchTimeoutRef.current);
      }

      // Don't search if query hasn't changed
      if (deferredQuery === lastServerQueryRef.current) return;

      // Set loading state immediately for empty queries
      if (!deferredQuery.trim()) {
        setIsSearching(false);
        lastServerQueryRef.current = deferredQuery;
        return;
      }

      setIsSearching(true);

      // Debounce server calls
      serverSearchTimeoutRef.current = window.setTimeout(async () => {
        try {
          await searchFn(deferredQuery);
          lastServerQueryRef.current = deferredQuery;
        } catch (error) {
          console.error('Server search error:', error);
        } finally {
          setIsSearching(false);
        }
      }, serverSearchDelay);
    },
    [deferredQuery, enableServerSearch, serverSearchDelay]
  );

  // Server search effect when deferredQuery changes
  useEffect(() => {
    if (enableServerSearch && serverSearch) {
      // This effect will be used by consumers to trigger server search
      // when deferredQuery changes
    }
  }, [deferredQuery, enableServerSearch, serverSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (serverSearchTimeoutRef.current) {
        clearTimeout(serverSearchTimeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    deferredQuery,
    isSearching,
    isPending,
    setQuery,
    clearSearch,
    filterItems,
    highlightText,
    serverSearch,
  };
}

// Utility function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Export for external use
export { escapeRegExp };
