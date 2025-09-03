'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Selection Manager Hook for Link Upload
 * Manages selection state for tree items during upload session
 */

interface UseSelectionManagerProps {
  treeInstance?: any;
  onSelectionChange?: (items: string[]) => void;
}

interface SelectionManager {
  selectedItems: string[];
  selectionMode: boolean;
  setSelectedItems: (items: string[]) => void;
  clearSelection: () => void;
  setSelectionMode: (mode: boolean) => void;
  toggleSelection: (itemId: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  selectAll: () => void;
}

export function useSelectionManager({
  treeInstance,
  onSelectionChange,
}: UseSelectionManagerProps): SelectionManager {
  const [selectedItems, setSelectedItemsState] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Update selected items
  const setSelectedItems = useCallback((items: string[]) => {
    setSelectedItemsState(items);
    onSelectionChange?.(items);
  }, [onSelectionChange]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    if (treeInstance?.clearSelection) {
      treeInstance.clearSelection();
    }
  }, [treeInstance, setSelectedItems]);

  // Toggle selection for a single item
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItemsState(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
    onSelectionChange?.(
      selectedItems.includes(itemId)
        ? selectedItems.filter(id => id !== itemId)
        : [...selectedItems, itemId]
    );
  }, [selectedItems, onSelectionChange]);

  // Select a range of items (for shift+click)
  const selectRange = useCallback((fromId: string, toId: string) => {
    if (!treeInstance?.getItemsBetween) return;
    
    const itemsBetween = treeInstance.getItemsBetween(fromId, toId);
    setSelectedItemsState(prev => {
      const newSelection = new Set(prev);
      itemsBetween.forEach((id: string) => newSelection.add(id));
      return Array.from(newSelection);
    });
  }, [treeInstance]);

  // Select all items in the tree
  const selectAll = useCallback(() => {
    if (!treeInstance?.getAllItems) return;
    
    const allItems = treeInstance.getAllItems();
    setSelectedItems(allItems);
  }, [treeInstance, setSelectedItems]);

  // Sync selection mode with tree instance
  useEffect(() => {
    if (treeInstance?.setSelectionMode) {
      treeInstance.setSelectionMode(selectionMode);
    }
  }, [treeInstance, selectionMode]);

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!selectionMode) {
      clearSelection();
    }
  }, [selectionMode, clearSelection]);

  return {
    selectedItems,
    selectionMode,
    setSelectedItems,
    clearSelection,
    setSelectionMode,
    toggleSelection,
    selectRange,
    selectAll,
  };
}