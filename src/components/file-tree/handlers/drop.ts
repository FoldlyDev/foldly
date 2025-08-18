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
      const newItems = { ...prevItems };
      const parentId = parentItem.getId();
      const parent = newItems[parentId];
      
      if (!parent || !isFolder(parent)) return prevItems;

      // First, remove items from their old parents
      const movedItemIds = new Set(newChildrenIds);
      Object.values(newItems).forEach(item => {
        if (isFolder(item) && item.children) {
          // Remove moved items from their old parent
          const filteredChildren = item.children.filter(
            childId => !movedItemIds.has(childId) || item.id === parentId
          );
          if (filteredChildren.length !== item.children.length) {
            (item as any).children = filteredChildren;
          }
        }
      });

      // Then update the new parent with the reordered children
      (parent as any).children = newChildrenIds;

      // Update parentId for all moved items
      newChildrenIds.forEach(childId => {
        const child = newItems[childId];
        if (child && child.parentId !== parentId) {
          child.parentId = parentId;
        }
      });

      return newItems;
    });
  });
}