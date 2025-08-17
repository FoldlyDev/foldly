import type { ItemInstance } from '@headless-tree/core';
import { createOnDropHandler } from '@headless-tree/core';
import type { TreeItem } from '../types/tree-types';
import type { ItemsUpdater } from '../types/handler-types';
import { isFolder } from '../types/tree-types';

/**
 * Creates a drop handler for tree items
 * Updates the parent folder's children when items are dropped
 */
export function createTreeDropHandler<T extends TreeItem = TreeItem>(
  setItems: ItemsUpdater<T>
) {
  return createOnDropHandler((
    parentItem: ItemInstance<T>,
    newChildrenIds: string[]
  ) => {
    setItems(prevItems => {
      const parentId = parentItem.getId();
      const parent = prevItems[parentId];
      
      if (!parent || !isFolder(parent)) return prevItems;

      return {
        ...prevItems,
        [parentId]: {
          ...parent,
          children: newChildrenIds,
        },
      };
    });
  });
}