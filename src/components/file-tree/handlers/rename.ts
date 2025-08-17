import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem } from '../types/tree-types';
import type { RenameHandler, ItemsUpdater } from '../types/handler-types';

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
      const currentItem = prevItems[itemId];
      if (!currentItem) return prevItems;

      return {
        ...prevItems,
        [itemId]: {
          ...currentItem,
          name: newName,
        },
      };
    });
  };
}