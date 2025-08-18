import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem } from '../types/tree-types';
import type { RenameHandler, ItemsUpdater } from '../types/handler-types';
import { isFolder } from '../types/tree-types';

/**
 * Creates a rename handler for tree items
 * Updates the item's name in the state
 */
export function createRenameHandler<T extends TreeItem = TreeItem>(
  setItems: ItemsUpdater<T>
): RenameHandler<T> {
  return (item: ItemInstance<T>, newName: string) => {
    const itemId = item.getId();
    
    setItems(prevItems => {
      const newItems = { ...prevItems };
      const currentItem = newItems[itemId];
      if (!currentItem) return prevItems;

      // Update the item's name directly
      newItems[itemId] = {
        ...currentItem,
        name: newName,
      };
      
      // If it's a folder, also update its path
      if (isFolder(newItems[itemId])) {
        const folder = newItems[itemId] as any;
        const oldPath = folder.path || '/';
        const pathSegments = oldPath.split('/').filter((s: string) => s);
        if (pathSegments.length > 0) {
          pathSegments[pathSegments.length - 1] = newName;
          folder.path = pathSegments.length > 0 ? '/' + pathSegments.join('/') : '/';
        }
      }

      return newItems;
    });
  };
}