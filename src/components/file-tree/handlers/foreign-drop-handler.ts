import type { DragTarget, ItemInstance } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Creates handlers for foreign drag and drop operations
 */
export function createForeignDropHandlers(
  data: Record<string, TreeItemType>,
  insertNewItem: (dataTransfer: DataTransfer) => string
) {
  const onDropForeignDragObject = (
    dataTransfer: DataTransfer,
    target: DragTarget<TreeItemType>
  ) => {
    const newId = insertNewItem(dataTransfer);
    insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
      const itemData = data[item.getId()];
      if (itemData && 'children' in itemData) {
        (itemData as any).children = newChildrenIds;
      }
    });
  };

  const onCompleteForeignDrop = (items: ItemInstance<TreeItemType>[]) =>
    removeItemsFromParents(items, (item, newChildren) => {
      const itemData = item.getItemData();
      if ('children' in itemData) {
        (itemData as any).children = newChildren;
      }
    });

  return { onDropForeignDragObject, onCompleteForeignDrop };
}