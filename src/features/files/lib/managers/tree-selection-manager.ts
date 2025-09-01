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
   */
  const setSelectedItems = useCallback(
    (items: string[]) => {
      setSelectedItemsState(items);
      
      // Sync with tree instance
      if (treeInstance?.setSelectedItems) {
        treeInstance.setSelectedItems(items);
      }
      
      // Notify parent
      onSelectionChange?.(items);
      
      // Update selection mode based on selection
      if (items.length > 1 && multiSelectEnabled) {
        setSelectionModeState(true);
      } else if (items.length === 0) {
        setSelectionModeState(false);
      }
    },
    [treeInstance, onSelectionChange, multiSelectEnabled]
  );
  
  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, [setSelectedItems]);
  
  /**
   * Select all items in the tree
   */
  const selectAll = useCallback(() => {
    if (!treeInstance || !multiSelectEnabled) return;
    
    const allItems = treeInstance.getAllItems();
    const allItemIds = allItems.map(item => item.id);
    setSelectedItems(allItemIds);
  }, [treeInstance, multiSelectEnabled, setSelectedItems]);
  
  /**
   * Toggle selection of a single item
   */
  const toggleItemSelection = useCallback(
    (itemId: string) => {
      const isSelected = selectedItems.includes(itemId);
      
      if (isSelected) {
        // Remove from selection
        setSelectedItems(selectedItems.filter(id => id !== itemId));
      } else {
        // Add to selection
        if (multiSelectEnabled) {
          setSelectedItems([...selectedItems, itemId]);
        } else {
          // Single select mode - replace selection
          setSelectedItems([itemId]);
        }
      }
    },
    [selectedItems, setSelectedItems, multiSelectEnabled]
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
   * Sync selection from tree instance on change
   */
  useEffect(() => {
    if (!treeInstance) return;
    
    // Get current selection from tree
    const treeSelection = treeInstance.getSelectedItems();
    if (JSON.stringify(treeSelection) !== JSON.stringify(selectedItems)) {
      setSelectedItemsState(treeSelection);
      onSelectionChange?.(treeSelection);
    }
  }, [treeInstance]); // Only sync on instance change, not selectedItems
  
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