'use client';

import { useCallback, useMemo } from 'react';
import type { TreeItem } from '../types/tree-types';

/**
 * Hook for managing tree selection state
 * Provides methods to work with selected items in the tree
 */
export function useTreeSelection(tree: any) {
  /**
   * Get currently selected item IDs
   */
  const getSelectedItemIds = useCallback((): string[] => {
    if (!tree || typeof tree.getItems !== 'function') {
      return [];
    }
    
    return tree.getItems()
      .filter((item: any) => item.isSelected?.())
      .map((item: any) => item.getId());
  }, [tree]);

  /**
   * Get selected items with full data
   */
  const getSelectedItems = useCallback(() => {
    if (!tree || typeof tree.getItems !== 'function') {
      return [];
    }
    
    return tree.getItems()
      .filter((item: any) => item.isSelected?.())
      .map((item: any) => ({
        getId: () => item.getId(),
        getItemName: () => item.getItemName(),
        getItemData: () => item.getItemData(),
        isFolder: () => item.isFolder(),
        isExpanded: () => item.isExpanded(),
      }));
  }, [tree]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    if (!tree || !tree.getState) return;
    
    // Get current state and clear selected items
    const state = tree.getState();
    if (state?.selection) {
      // This would need to be implemented based on the tree's API
      // For now, we'll need to track selection externally
      console.warn('Clear selection needs external state management');
    }
  }, [tree]);

  /**
   * Select specific items
   */
  const selectItems = useCallback((itemIds: string[]) => {
    if (!tree) return;
    
    // This would need tree instance to support programmatic selection
    // For now, this serves as a placeholder
    console.warn('Programmatic selection needs tree API support');
  }, [tree]);

  /**
   * Get count of selected items
   */
  const selectedCount = useMemo(() => {
    return getSelectedItemIds().length;
  }, [getSelectedItemIds]);

  /**
   * Check if any items are selected
   */
  const hasSelection = useMemo(() => {
    return selectedCount > 0;
  }, [selectedCount]);

  /**
   * Get first selected item (useful for single selection operations)
   */
  const getFirstSelectedItem = useCallback(() => {
    const selected = getSelectedItems();
    return selected.length > 0 ? selected[0] : null;
  }, [getSelectedItems]);

  /**
   * Get selected folders only
   */
  const getSelectedFolders = useCallback(() => {
    return getSelectedItems().filter(item => item.isFolder());
  }, [getSelectedItems]);

  /**
   * Get selected files only
   */
  const getSelectedFiles = useCallback(() => {
    return getSelectedItems().filter(item => !item.isFolder());
  }, [getSelectedItems]);

  return {
    // Core selection methods
    getSelectedItemIds,
    getSelectedItems,
    clearSelection,
    selectItems,
    
    // Convenience methods
    selectedCount,
    hasSelection,
    getFirstSelectedItem,
    getSelectedFolders,
    getSelectedFiles,
  };
}