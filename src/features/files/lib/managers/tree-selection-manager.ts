'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ExtendedTreeInstance } from './tree-instance-manager';

/**
 * Tree Selection Manager Hook
 * Manages selection state and modes for tree instances
 * 
 * Responsibilities:
 * - Track selected items
 * - Manage selection mode (single vs multi)
 * - Synchronize selection with tree instance
 * - Provide selection utilities
 */

interface UseTreeSelectionManagerProps {
  treeInstance: ExtendedTreeInstance | null;
  multiSelectEnabled?: boolean;
  onSelectionChange?: (selectedItems: string[]) => void;
}

interface TreeSelectionManager {
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  selectionMode: boolean;
  setSelectionMode: (mode: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  toggleItemSelection: (itemId: string) => void;
  isItemSelected: (itemId: string) => boolean;
}

export function useTreeSelectionManager({
  treeInstance,
  multiSelectEnabled = true,
  onSelectionChange,
}: UseTreeSelectionManagerProps): TreeSelectionManager {
  const [selectedItems, setSelectedItemsState] = useState<string[]>([]);
  const [selectionMode, setSelectionModeState] = useState(false);
  
  /**
   * Set selected items and sync with tree
   * Matches exact logic from workspace selection-manager
   */
  const setSelectedItems = useCallback(
    (items: string[]) => {
      // Update local state
      setSelectedItemsState(items);
      
      // Sync with tree instance if available
      if (treeInstance?.setSelectedItems) {
        treeInstance.setSelectedItems(items);
      }
      
      // Notify parent if callback provided
      onSelectionChange?.(items);
    },
    [treeInstance, onSelectionChange]
  );
  
  /**
   * Clear all selections
   * Matches exact logic from workspace selection-manager
   */
  const clearSelection = useCallback(() => {
    // Clear tree instance selection first
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    // Clear local state
    setSelectedItemsState([]);
    // Exit selection mode when clearing
    setSelectionModeState(false);
  }, [treeInstance]);
  
  /**
   * Select all items in the tree
   */
  const selectAll = useCallback(() => {
    if (!treeInstance || !multiSelectEnabled) return;
    
    const allItems = treeInstance.getAllItems();
    const allItemIds = allItems.map(item => item.id);
    
    // Update state directly
    setSelectedItemsState(allItemIds);
    
    // Sync with tree since this is a programmatic change
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems(allItemIds);
    }
    
    // Notify parent
    onSelectionChange?.(allItemIds);
  }, [treeInstance, multiSelectEnabled, onSelectionChange]);
  
  /**
   * Toggle selection of a single item (programmatic change)
   */
  const toggleItemSelection = useCallback(
    (itemId: string) => {
      setSelectedItemsState(prev => {
        const isSelected = prev.includes(itemId);
        
        let newSelection: string[];
        if (isSelected) {
          // Remove from selection
          newSelection = prev.filter(id => id !== itemId);
        } else {
          // Add to selection
          if (multiSelectEnabled) {
            newSelection = [...prev, itemId];
          } else {
            // Single select mode - replace selection
            newSelection = [itemId];
          }
        }
        
        // Sync with tree since this is a programmatic change
        if (treeInstance?.setSelectedItems) {
          treeInstance.setSelectedItems(newSelection);
        }
        onSelectionChange?.(newSelection);
        
        return newSelection;
      });
    },
    [treeInstance, onSelectionChange, multiSelectEnabled]
  );
  
  /**
   * Check if an item is selected
   */
  const isItemSelected = useCallback(
    (itemId: string): boolean => {
      return selectedItems.includes(itemId);
    },
    [selectedItems]
  );
  
  /**
   * Set selection mode
   */
  const setSelectionMode = useCallback(
    (mode: boolean) => {
      if (!multiSelectEnabled && mode) {
        console.warn('Multi-select is disabled for this tree');
        return;
      }
      setSelectionModeState(mode);
    },
    [multiSelectEnabled]
  );
  
  /**
   * Sync selection state to tree instance when tree instance changes
   * (e.g., when tree is re-initialized)
   */
  useEffect(() => {
    if (treeInstance?.setSelectedItems && selectedItems.length > 0) {
      treeInstance.setSelectedItems(selectedItems);
    }
  }, [treeInstance, selectedItems]);
  
  return {
    selectedItems,
    setSelectedItems,
    selectionMode,
    setSelectionMode,
    clearSelection,
    selectAll,
    toggleItemSelection,
    isItemSelected,
  };
}