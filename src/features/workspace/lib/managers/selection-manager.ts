'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Selection Manager Hook
 * Manages workspace item selection state and synchronization with tree instance
 * 
 * Responsibilities:
 * - Maintain selected items state
 * - Manage selection mode (single/multi)
 * - Sync selection with tree instance
 * - Provide selection manipulation methods
 */

interface UseSelectionManagerProps {
  treeInstance?: any; // Tree instance for synchronization
  onSelectionChange?: (items: string[]) => void; // Optional callback for selection changes
}

interface SelectionManager {
  // State
  selectedItems: string[];
  selectionMode: boolean;
  
  // Methods
  setSelectedItems: (items: string[]) => void;
  clearSelection: () => void;
  setSelectionMode: (mode: boolean) => void;
  toggleSelection: (itemId: string) => void;
  selectAll: (itemIds: string[]) => void;
  isSelected: (itemId: string) => boolean;
}

export function useSelectionManager({
  treeInstance,
  onSelectionChange,
}: UseSelectionManagerProps = {}): SelectionManager {
  // Selection state
  const [selectedItems, setSelectedItemsState] = useState<string[]>([]);
  const [selectionMode, setSelectionModeState] = useState(false);

  /**
   * Clear all selections
   * Matches exact logic from workspace-container: 
   * 1. Clear tree instance selection
   * 2. Clear local state  
   * 3. Exit selection mode
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
   * Set selected items and sync with tree
   * Matches exact logic from workspace-container
   */
  const setSelectedItems = useCallback((items: string[]) => {
    // Update local state
    setSelectedItemsState(items);
    
    // Sync with tree instance if available
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems(items);
    }
    
    // Notify parent if callback provided
    onSelectionChange?.(items);
  }, [treeInstance, onSelectionChange]);

  /**
   * Set selection mode
   * Just sets the mode - clearing is handled separately to match original logic
   */
  const setSelectionMode = useCallback((mode: boolean) => {
    setSelectionModeState(mode);
  }, []);

  /**
   * Toggle selection of a single item
   */
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItemsState(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Sync with tree and notify
      if (treeInstance?.setSelectedItems) {
        treeInstance.setSelectedItems(newSelection);
      }
      onSelectionChange?.(newSelection);
      
      return newSelection;
    });
  }, [treeInstance, onSelectionChange]);

  /**
   * Select all provided items
   */
  const selectAll = useCallback((itemIds: string[]) => {
    setSelectedItems(itemIds);
    // Automatically enter selection mode when selecting multiple items
    if (itemIds.length > 1) {
      setSelectionModeState(true);
    }
  }, [setSelectedItems]);

  /**
   * Check if an item is selected
   */
  const isSelected = useCallback((itemId: string) => {
    return selectedItems.includes(itemId);
  }, [selectedItems]);

  /**
   * Sync with tree instance when it changes
   * This ensures selection state stays in sync if tree instance is replaced
   */
  useEffect(() => {
    if (treeInstance?.setSelectedItems && selectedItems.length > 0) {
      treeInstance.setSelectedItems(selectedItems);
    }
  }, [treeInstance, selectedItems]);

  return {
    // State
    selectedItems,
    selectionMode,
    
    // Methods
    setSelectedItems,
    clearSelection,
    setSelectionMode,
    toggleSelection,
    selectAll,
    isSelected,
  };
}