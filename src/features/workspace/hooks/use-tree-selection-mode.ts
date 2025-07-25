'use client';

import { useState, useCallback } from 'react';

export function useTreeSelectionMode() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const enableSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const disableSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }, []);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isItemSelected = useCallback(
    (itemId: string) => {
      return selectedItems.has(itemId);
    },
    [selectedItems]
  );

  return {
    isSelectionMode,
    selectedItems: Array.from(selectedItems),
    selectedItemsCount: selectedItems.size,
    enableSelectionMode,
    disableSelectionMode,
    toggleItemSelection,
    clearSelection,
    isItemSelected,
  };
}
