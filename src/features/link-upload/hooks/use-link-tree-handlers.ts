'use client';

import { useCallback } from 'react';
import type { TreeInstance } from '@headless-tree/core';
import { addItemToTree, removeItemFromTree, type LinkTreeItem } from '../lib/tree-data';

interface UseLinkTreeHandlersProps {
  tree: TreeInstance<LinkTreeItem>;
  rootId?: string;
  linkId: string;
}

export function useLinkTreeHandlers({ tree, rootId, linkId }: UseLinkTreeHandlersProps) {
  const addItem = useCallback((
    name: string,
    parentId?: string,
    isFile: boolean = false
  ): string | null => {
    try {
      const itemId = `${isFile ? 'file' : 'folder'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const effectiveParentId = parentId || rootId || linkId;

      const newItem: LinkTreeItem = {
        id: itemId,
        name,
        isFile,
        parentId: effectiveParentId,
        linkId,
        createdAt: new Date().toISOString(),
      };

      // Add to tree data
      addItemToTree(newItem, effectiveParentId);

      // Trigger tree rebuild
      tree.rebuildTree();

      // Expand parent if it's a folder
      if (effectiveParentId && effectiveParentId !== linkId) {
        const parentInstance = tree.getItemInstance(effectiveParentId);
        if (parentInstance && !parentInstance.isExpanded()) {
          parentInstance.expand();
        }
      }

      return itemId;
    } catch (error) {
      console.error('Error adding item to tree:', error);
      return null;
    }
  }, [tree, rootId, linkId]);

  const deleteItems = useCallback((itemIds: string[]): void => {
    try {
      // Remove items from tree data
      itemIds.forEach(itemId => {
        removeItemFromTree(itemId);
      });

      // Trigger tree rebuild
      tree.rebuildTree();
    } catch (error) {
      console.error('Error deleting items from tree:', error);
    }
  }, [tree]);

  return {
    addItem,
    deleteItems,
  };
}