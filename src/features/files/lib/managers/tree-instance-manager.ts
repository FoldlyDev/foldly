'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  addTreeItem as addTreeItemToCore, 
  removeTreeItem as removeTreeItemFromCore 
} from '@/components/file-tree/core/tree';
import type { TreeItem } from '@/components/file-tree/types';

/**
 * Tree Instance Manager Hook
 * Manages the lifecycle and operations of a tree instance
 * 
 * Responsibilities:
 * - Store and manage tree instance reference
 * - Provide methods to manipulate tree (add, remove, update items)
 * - Handle tree state synchronization
 * - Extend tree with domain-specific methods
 */

export interface ExtendedTreeInstance {
  // Core tree methods (from headless-tree)
  getSelectedItems: () => string[];
  setSelectedItems: (items: string[]) => void;
  getExpandedItems: () => string[];
  setExpandedItems: (items: string[]) => void;
  getCheckedItems?: () => string[];
  setCheckedItems?: (items: string[]) => void;
  rebuildTree?: () => void;
  
  // Extended methods for files feature
  addItem: (parentId: string, item: TreeItem) => void;
  removeItems: (itemIds: string[]) => void;
  updateItem: (itemId: string, updates: Partial<TreeItem>) => void;
  getItem: (itemId: string) => TreeItem | undefined;
  getAllItems: () => TreeItem[];
}

interface UseTreeInstanceManagerProps {
  treeId: string;
  onTreeReady?: (tree: ExtendedTreeInstance) => void;
}

interface TreeInstanceManager {
  treeInstance: ExtendedTreeInstance | null;
  setTreeInstance: (tree: any) => void;
  isTreeReady: boolean;
}

export function useTreeInstanceManager({
  treeId,
  onTreeReady,
}: UseTreeInstanceManagerProps): TreeInstanceManager {
  const [treeInstance, setTreeInstanceState] = useState<ExtendedTreeInstance | null>(null);
  const [isTreeReady, setIsTreeReady] = useState(false);
  const treeRef = useRef<any>(null);
  
  /**
   * Set tree instance and extend it with additional methods
   * NOTE: Dependencies are intentionally limited to prevent infinite re-renders (like workspace)
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setTreeInstance = useCallback(
    (tree: any) => {
      if (!tree) {
        setTreeInstanceState(null);
        setIsTreeReady(false);
        return;
      }
      
      // Store raw tree reference
      treeRef.current = tree;
      
      // Create extended tree instance
      const extendedTree: ExtendedTreeInstance = {
        // Core methods from headless-tree
        getSelectedItems: () => tree.getSelectedItems?.() || [],
        setSelectedItems: (items: string[]) => tree.setSelectedItems?.(items),
        getExpandedItems: () => tree.getExpandedItems?.() || [],
        setExpandedItems: (items: string[]) => tree.setExpandedItems?.(items),
        ...(tree.getCheckedItems && { getCheckedItems: () => tree.getCheckedItems() }),
        ...(tree.setCheckedItems && { setCheckedItems: (items: string[]) => tree.setCheckedItems(items) }),
        ...(tree.rebuildTree && { rebuildTree: tree.rebuildTree }),
        
        // Extended methods for files feature
        addItem: (parentId: string, item: TreeItem) => {
          addTreeItemToCore(tree, parentId, item, treeId);
        },
        
        removeItems: (itemIds: string[]) => {
          removeTreeItemFromCore(tree, itemIds, treeId);
        },
        
        updateItem: (itemId: string, updates: Partial<TreeItem>) => {
          // This would need implementation in the tree data layer
          console.warn('updateItem not yet implemented', { itemId, updates });
          // In real implementation, update the data and rebuild tree
          tree.rebuildTree?.();
        },
        
        getItem: (itemId: string): TreeItem | undefined => {
          // This would need to access the tree data store
          const items = tree.getItems?.() || [];
          return items.find((item: any) => item.id === itemId);
        },
        
        getAllItems: (): TreeItem[] => {
          return tree.getItems?.() || [];
        },
      };
      
      setTreeInstanceState(extendedTree);
      setIsTreeReady(true);
      
      // Notify parent that tree is ready
      onTreeReady?.(extendedTree);
    },
    [] // Empty deps like workspace to prevent re-initialization
  );
  
  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      treeRef.current = null;
      setTreeInstanceState(null);
      setIsTreeReady(false);
    };
  }, []);
  
  return {
    treeInstance,
    setTreeInstance,
    isTreeReady,
  };
}