'use client';

import { useCallback } from 'react';
import type { DragTarget, ItemInstance, TreeInstance } from '@headless-tree/core';
import type { LinkTreeItem } from '../lib/tree-data';

interface UseTreeDndOptions {
  tree?: TreeInstance<LinkTreeItem> | null;
  onDrop?: (target: DragTarget<LinkTreeItem>, dataTransfer: DataTransfer) => void;
  onRename?: (itemId: string, newName: string) => void;
  onForeignDrop?: (dataTransfer: DataTransfer) => void;
}

export function useTreeDnd({
  tree,
  onDrop,
  onRename,
  onForeignDrop,
}: UseTreeDndOptions) {
  // Handle drag start
  const handleDragStart = useCallback((item: ItemInstance<LinkTreeItem>, dataTransfer: DataTransfer) => {
    const itemData = item.getItemData();
    if (!itemData) return;

    // Set drag data
    dataTransfer.effectAllowed = 'move';
    dataTransfer.setData('text/plain', itemData.name);
    
    // Add custom data for internal drops
    dataTransfer.setData('application/x-tree-item', JSON.stringify({
      id: item.getId(),
      type: itemData.isFile ? 'file' : 'folder',
      name: itemData.name,
    }));
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }, []);

  // Handle drop
  const handleDrop = useCallback((target: DragTarget<LinkTreeItem>, dataTransfer: DataTransfer) => {
    // Check if this is an internal tree item drop
    const treeItemData = dataTransfer.getData('application/x-tree-item');
    
    if (treeItemData) {
      // Internal drop - let the tree handle it
      if (onDrop) {
        onDrop(target, dataTransfer);
      }
    } else {
      // Foreign drop (files from outside)
      if (onForeignDrop) {
        onForeignDrop(dataTransfer);
      }
    }
  }, [onDrop, onForeignDrop]);

  // Handle rename
  const handleRename = useCallback((itemId: string, newName: string) => {
    if (onRename) {
      onRename(itemId, newName);
    }
  }, [onRename]);

  // Check if drop is allowed
  const canDrop = useCallback((target: DragTarget<LinkTreeItem>, dataTransfer: DataTransfer): boolean => {
    // Check if dropping on a folder
    if (target.targetType === 'item') {
      const targetData = target.targetItem?.getItemData();
      if (targetData?.isFile) {
        return false; // Can't drop on files
      }
    }
    
    return true;
  }, []);

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleRename,
    canDrop,
  };
}