'use client';

import { useState, useCallback } from 'react';

export function useSelectMode() {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => {
      if (prev) {
        // Exiting select mode - clear selections
        setSelectedItems(new Set());
      }
      return !prev;
    });
  }, []);

  const enableSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  const disableSelectMode = useCallback(() => {
    setIsSelectMode(false);
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

  const selectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => new Set(prev).add(itemId));
  }, []);

  const deselectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  }, []);

  const isItemSelected = useCallback(
    (itemId: string) => {
      return selectedItems.has(itemId);
    },
    [selectedItems]
  );

  return {
    isSelectMode,
    selectedItems: Array.from(selectedItems),
    selectedItemsCount: selectedItems.size,
    toggleSelectMode,
    enableSelectMode,
    disableSelectMode,
    toggleItemSelection,
    clearSelection,
    selectItem,
    deselectItem,
    isItemSelected,
  };
}
