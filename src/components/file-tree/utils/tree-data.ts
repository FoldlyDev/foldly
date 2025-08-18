import type { TreeItem } from '../types/tree-types';

/**
 * Creates tree data utilities following the exact pattern from headless-tree examples
 * Data is stored outside components and mutated directly for optimistic updates
 */
export function createTreeData<T extends TreeItem = TreeItem>(initialData: Record<string, T> = {}) {
  // Mutable data object - exactly like the example
  const data: Record<string, T> = { ...initialData };

  // Sync data loader - exactly like the example
  const syncDataLoader = {
    getItem: (id: string) => data[id] || ({} as T),
    getChildren: (id: string) => {
      const item = data[id];
      if (item && 'children' in item) {
        return (item as any).children ?? [];
      }
      return [];
    },
  };

  // Async data loader for future use
  const asyncDataLoader = {
    getItem: (itemId: string) => Promise.resolve(data[itemId]),
    getChildren: (itemId: string) => {
      const item = data[itemId];
      if (item && 'children' in item) {
        return Promise.resolve((item as any).children ?? []);
      }
      return Promise.resolve([]);
    },
  };

  return { data, syncDataLoader, asyncDataLoader };
}