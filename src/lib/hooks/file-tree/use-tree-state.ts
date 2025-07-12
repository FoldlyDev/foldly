// =============================================================================
// TREE STATE MANAGEMENT - Zustand store for file tree state
// =============================================================================
// 🎯 Centralized state management for tree interactions

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DatabaseId, TreeNode, TreeState } from '@/types/file-tree';

// =============================================================================
// TREE STORE - Main Zustand store for tree state
// =============================================================================

export const useTreeStore = create<TreeState>()(
  subscribeWithSelector((set, get) => ({
    // =============================================================================
    // STATE PROPERTIES
    // =============================================================================

    // Selection state
    expandedNodes: new Set<DatabaseId>(),
    selectedNodes: new Set<DatabaseId>(),

    // Drag and drop state
    draggedItems: [],
    dragOverNode: null,
    isDragging: false,

    // Context menu state
    contextMenuNode: null,
    contextMenuPosition: null,

    // Loading state
    loadingNodes: new Set<DatabaseId>(),

    // =============================================================================
    // NODE EXPANSION ACTIONS
    // =============================================================================

    toggleNode: (nodeId: DatabaseId) => {
      set(state => {
        const newExpanded = new Set(state.expandedNodes);
        if (newExpanded.has(nodeId)) {
          newExpanded.delete(nodeId);
        } else {
          newExpanded.add(nodeId);
        }
        return { expandedNodes: newExpanded };
      });
    },

    expandNode: (nodeId: DatabaseId) => {
      set(state => {
        const newExpanded = new Set(state.expandedNodes);
        newExpanded.add(nodeId);
        return { expandedNodes: newExpanded };
      });
    },

    collapseNode: (nodeId: DatabaseId) => {
      set(state => {
        const newExpanded = new Set(state.expandedNodes);
        newExpanded.delete(nodeId);
        return { expandedNodes: newExpanded };
      });
    },

    // =============================================================================
    // SELECTION ACTIONS
    // =============================================================================

    selectNode: (nodeId: DatabaseId, multiSelect = false) => {
      set(state => {
        const newSelected = new Set(multiSelect ? state.selectedNodes : []);

        if (newSelected.has(nodeId)) {
          newSelected.delete(nodeId);
        } else {
          newSelected.add(nodeId);
        }

        return { selectedNodes: newSelected };
      });
    },

    clearSelection: () => {
      set({ selectedNodes: new Set() });
    },

    // =============================================================================
    // DRAG AND DROP ACTIONS
    // =============================================================================

    setDraggedItems: (items: TreeNode[]) => {
      set({ draggedItems: items });
    },

    setDragOverNode: (nodeId: DatabaseId | null) => {
      set({ dragOverNode: nodeId });
    },

    setIsDragging: (isDragging: boolean) => {
      set({ isDragging });
    },

    // =============================================================================
    // CONTEXT MENU ACTIONS
    // =============================================================================

    showContextMenu: (
      nodeId: DatabaseId,
      position: { x: number; y: number }
    ) => {
      set({
        contextMenuNode: nodeId,
        contextMenuPosition: position,
      });
    },

    hideContextMenu: () => {
      set({
        contextMenuNode: null,
        contextMenuPosition: null,
      });
    },

    // =============================================================================
    // LOADING ACTIONS
    // =============================================================================

    setNodeLoading: (nodeId: DatabaseId, loading: boolean) => {
      set(state => {
        const newLoading = new Set(state.loadingNodes);

        if (loading) {
          newLoading.add(nodeId);
        } else {
          newLoading.delete(nodeId);
        }

        return { loadingNodes: newLoading };
      });
    },

    // =============================================================================
    // UTILITY ACTIONS
    // =============================================================================

    reset: () => {
      set({
        expandedNodes: new Set(),
        selectedNodes: new Set(),
        draggedItems: [],
        dragOverNode: null,
        isDragging: false,
        contextMenuNode: null,
        contextMenuPosition: null,
        loadingNodes: new Set(),
      });
    },
  }))
);

// =============================================================================
// TREE STATE SELECTORS - Optimized selectors for specific state pieces
// =============================================================================

/**
 * Get expanded state for a specific node
 */
export const useIsNodeExpanded = (nodeId: DatabaseId): boolean => {
  return useTreeStore(state => state.expandedNodes.has(nodeId));
};

/**
 * Get selected state for a specific node
 */
export const useIsNodeSelected = (nodeId: DatabaseId): boolean => {
  return useTreeStore(state => state.selectedNodes.has(nodeId));
};

/**
 * Get loading state for a specific node
 */
export const useIsNodeLoading = (nodeId: DatabaseId): boolean => {
  return useTreeStore(state => state.loadingNodes.has(nodeId));
};

/**
 * Get all selected nodes
 */
export const useSelectedNodes = (): Set<DatabaseId> => {
  return useTreeStore(state => state.selectedNodes);
};

/**
 * Get all expanded nodes
 */
export const useExpandedNodes = (): Set<DatabaseId> => {
  return useTreeStore(state => state.expandedNodes);
};

/**
 * Get drag state
 */
export const useDragState = () => {
  return useTreeStore(state => ({
    draggedItems: state.draggedItems,
    dragOverNode: state.dragOverNode,
    isDragging: state.isDragging,
  }));
};

/**
 * Get context menu state
 */
export const useContextMenuState = () => {
  return useTreeStore(state => ({
    contextMenuNode: state.contextMenuNode,
    contextMenuPosition: state.contextMenuPosition,
  }));
};

// =============================================================================
// TREE STATE ACTIONS - Action hooks for tree operations
// =============================================================================

/**
 * Get tree actions
 */
export const useTreeActions = () => {
  return useTreeStore(state => ({
    toggleNode: state.toggleNode,
    expandNode: state.expandNode,
    collapseNode: state.collapseNode,
    selectNode: state.selectNode,
    clearSelection: state.clearSelection,
    setDraggedItems: state.setDraggedItems,
    setDragOverNode: state.setDragOverNode,
    setIsDragging: state.setIsDragging,
    showContextMenu: state.showContextMenu,
    hideContextMenu: state.hideContextMenu,
    setNodeLoading: state.setNodeLoading,
    reset: state.reset,
  }));
};

// =============================================================================
// TREE STATE UTILITIES - Utility functions for tree state
// =============================================================================

/**
 * Get tree statistics
 */
export const useTreeStats = () => {
  return useTreeStore(state => ({
    totalExpanded: state.expandedNodes.size,
    totalSelected: state.selectedNodes.size,
    totalLoading: state.loadingNodes.size,
    isDragging: state.isDragging,
    hasContextMenu: state.contextMenuNode !== null,
  }));
};

/**
 * Check if any nodes are selected
 */
export const useHasSelection = (): boolean => {
  return useTreeStore(state => state.selectedNodes.size > 0);
};

/**
 * Check if multiple nodes are selected
 */
export const useHasMultipleSelection = (): boolean => {
  return useTreeStore(state => state.selectedNodes.size > 1);
};

/**
 * Get drag over node
 */
export const useDragOverNode = (): DatabaseId | null => {
  return useTreeStore(state => state.dragOverNode);
};

/**
 * Check if node is drag over target
 */
export const useIsNodeDragOver = (nodeId: DatabaseId): boolean => {
  return useTreeStore(state => state.dragOverNode === nodeId);
};

// =============================================================================
// TREE STATE PERSISTENCE - Local storage persistence
// =============================================================================

/**
 * Save tree state to localStorage
 */
export const saveTreeState = (key: string) => {
  const state = useTreeStore.getState();
  const serializedState = {
    expandedNodes: Array.from(state.expandedNodes),
    selectedNodes: Array.from(state.selectedNodes),
  };
  localStorage.setItem(`tree-state-${key}`, JSON.stringify(serializedState));
};

/**
 * Load tree state from localStorage
 */
export const loadTreeState = (key: string) => {
  try {
    const saved = localStorage.getItem(`tree-state-${key}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      useTreeStore.setState({
        expandedNodes: new Set(parsed.expandedNodes || []),
        selectedNodes: new Set(parsed.selectedNodes || []),
      });
    }
  } catch (error) {
    console.warn('Failed to load tree state:', error);
  }
};

/**
 * Clear tree state from localStorage
 */
export const clearTreeState = (key: string) => {
  localStorage.removeItem(`tree-state-${key}`);
};
