'use client';

import { useCallback, useMemo } from 'react';

/**
 * Hook for accessing tree state and metadata
 * Provides methods to query tree state and configuration
 */
export function useTreeState(tree: any) {
  /**
   * Get the full tree state
   */
  const getState = useCallback(() => {
    if (!tree || typeof tree.getState !== 'function') {
      return null;
    }
    return tree.getState();
  }, [tree]);

  /**
   * Get all items in the tree
   */
  const getAllItems = useCallback(() => {
    if (!tree || typeof tree.getItems !== 'function') {
      return [];
    }
    return tree.getItems();
  }, [tree]);

  /**
   * Get a specific item instance by ID
   */
  const getItemInstance = useCallback((itemId: string) => {
    if (!tree || typeof tree.getItemInstance !== 'function') {
      return null;
    }
    return tree.getItemInstance(itemId);
  }, [tree]);

  /**
   * Get total count of items in the tree
   */
  const itemCount = useMemo(() => {
    return getAllItems().length;
  }, [getAllItems]);

  /**
   * Get count of folders in the tree
   */
  const folderCount = useMemo(() => {
    return getAllItems().filter((item: any) => item.isFolder?.()).length;
  }, [getAllItems]);

  /**
   * Get count of files in the tree
   */
  const fileCount = useMemo(() => {
    return getAllItems().filter((item: any) => !item.isFolder?.()).length;
  }, [getAllItems]);

  /**
   * Check if tree is currently in drag operation
   */
  const isDragging = useCallback((): boolean => {
    const state = getState();
    return !!(state?.dnd?.draggedItems && state.dnd.draggedItems.length > 0);
  }, [getState]);

  /**
   * Get currently dragged items
   */
  const getDraggedItems = useCallback(() => {
    const state = getState();
    return state?.dnd?.draggedItems || [];
  }, [getState]);

  /**
   * Check if tree has any search active
   */
  const hasActiveSearch = useCallback((): boolean => {
    const state = getState();
    return !!(state?.search?.searchQuery);
  }, [getState]);

  /**
   * Get current search query
   */
  const getSearchQuery = useCallback((): string => {
    const state = getState();
    return state?.search?.searchQuery || '';
  }, [getState]);

  /**
   * Get items matching current search
   */
  const getSearchMatches = useCallback(() => {
    if (!hasActiveSearch()) return [];
    
    return getAllItems().filter((item: any) => 
      item.isMatchingSearch?.()
    );
  }, [getAllItems, hasActiveSearch]);

  /**
   * Check if tree is in selection mode
   */
  const isSelectionMode = useCallback((): boolean => {
    const state = getState();
    // This depends on how selection mode is tracked in your tree
    return state?.selection?.mode === 'multiple' || false;
  }, [getState]);

  /**
   * Get tree configuration
   */
  const getTreeConfig = useCallback(() => {
    // Access tree configuration if available
    return {
      canReorder: tree?.canReorder || false,
      indent: tree?.indent || 20,
      rootItemId: tree?.rootItemId || null,
    };
  }, [tree]);

  /**
   * Check if a specific feature is enabled
   */
  const hasFeature = useCallback((featureName: string): boolean => {
    // This would need to check the features array
    // For now, we'll check common methods as proxy
    switch (featureName) {
      case 'selection':
        return typeof tree?.getItems?.()?.[0]?.isSelected === 'function';
      case 'checkbox':
        return typeof tree?.getItems?.()?.[0]?.getCheckedState === 'function';
      case 'dragAndDrop':
        return tree?.canReorder || false;
      case 'rename':
        return typeof tree?.getItems?.()?.[0]?.startRenaming === 'function';
      default:
        return false;
    }
  }, [tree]);

  return {
    // State access
    getState,
    getAllItems,
    getItemInstance,
    
    // Counts
    itemCount,
    folderCount,
    fileCount,
    
    // Drag state
    isDragging,
    getDraggedItems,
    
    // Search state
    hasActiveSearch,
    getSearchQuery,
    getSearchMatches,
    
    // Selection state
    isSelectionMode,
    
    // Configuration
    getTreeConfig,
    hasFeature,
  };
}