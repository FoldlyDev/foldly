'use client';

import { useCallback } from 'react';
import type { TreeItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';

/**
 * Hook for managing tree expansion state
 * Provides methods to expand/collapse folders in the tree
 */
export function useTreeExpansion(tree: any, items?: Record<string, TreeItem>) {
  /**
   * Expand all folders in the tree
   */
  const expandAll = useCallback(() => {
    if (!tree || typeof tree.expandAll !== 'function') {
      console.error('Tree instance does not support expandAll');
      return;
    }
    
    tree.expandAll();
  }, [tree]);

  /**
   * Collapse all folders in the tree
   */
  const collapseAll = useCallback(() => {
    if (!tree || typeof tree.collapseAll !== 'function') {
      console.error('Tree instance does not support collapseAll');
      return;
    }
    
    tree.collapseAll();
  }, [tree]);

  /**
   * Expand a specific item
   */
  const expandItem = useCallback((itemId: string) => {
    if (!tree || typeof tree.getItemInstance !== 'function') {
      console.error('Tree instance does not support getItemInstance');
      return;
    }
    
    const itemInstance = tree.getItemInstance(itemId);
    if (itemInstance && typeof itemInstance.expand === 'function') {
      itemInstance.expand();
    }
  }, [tree]);

  /**
   * Collapse a specific item
   */
  const collapseItem = useCallback((itemId: string) => {
    if (!tree || typeof tree.getItemInstance !== 'function') {
      console.error('Tree instance does not support getItemInstance');
      return;
    }
    
    const itemInstance = tree.getItemInstance(itemId);
    if (itemInstance && typeof itemInstance.collapse === 'function') {
      itemInstance.collapse();
    }
  }, [tree]);

  /**
   * Toggle expansion state of an item
   */
  const toggleItem = useCallback((itemId: string) => {
    if (!tree || typeof tree.getItemInstance !== 'function') {
      console.error('Tree instance does not support getItemInstance');
      return;
    }
    
    const itemInstance = tree.getItemInstance(itemId);
    if (!itemInstance) return;
    
    if (itemInstance.isExpanded?.()) {
      itemInstance.collapse?.();
    } else {
      itemInstance.expand?.();
    }
  }, [tree]);

  /**
   * Get currently expanded item IDs
   */
  const getExpandedItemIds = useCallback((): string[] => {
    if (!tree || typeof tree.getItems !== 'function') {
      return [];
    }
    
    return tree.getItems()
      .filter((item: any) => item.isFolder?.() && item.isExpanded?.())
      .map((item: any) => item.getId());
  }, [tree]);

  /**
   * Check if a specific item is expanded
   */
  const isItemExpanded = useCallback((itemId: string): boolean => {
    if (!tree || typeof tree.getItemInstance !== 'function') {
      return false;
    }
    
    const itemInstance = tree.getItemInstance(itemId);
    return itemInstance?.isExpanded?.() || false;
  }, [tree]);

  /**
   * Expand items to reveal a specific item (expand all parents)
   */
  const revealItem = useCallback((itemId: string) => {
    if (!items || !tree) return;
    
    // Find all parent IDs
    const parentIds: string[] = [];
    let currentItem = items[itemId];
    
    while (currentItem?.parentId) {
      parentIds.push(currentItem.parentId);
      currentItem = items[currentItem.parentId];
    }
    
    // Expand parents from root to target
    parentIds.reverse().forEach(id => {
      expandItem(id);
    });
  }, [items, tree, expandItem]);

  /**
   * Expand only folders at a specific depth level
   */
  const expandToLevel = useCallback((level: number) => {
    if (!items || !tree) return;
    
    Object.entries(items).forEach(([id, item]) => {
      if (isFolder(item) && item.depth <= level) {
        expandItem(id);
      } else if (isFolder(item) && item.depth > level) {
        collapseItem(id);
      }
    });
  }, [items, tree, expandItem, collapseItem]);

  return {
    // Core expansion methods
    expandAll,
    collapseAll,
    expandItem,
    collapseItem,
    toggleItem,
    
    // State query methods
    getExpandedItemIds,
    isItemExpanded,
    
    // Advanced methods
    revealItem,
    expandToLevel,
  };
}