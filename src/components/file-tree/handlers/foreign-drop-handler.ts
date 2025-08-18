import type { DragTarget, ItemInstance } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem as TreeItemType, TreeFolderItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';

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
      if (itemData && isFolder(itemData)) {
        const folderItem = itemData as TreeFolderItem;
        folderItem.children = newChildrenIds;
      }
    });
  };

  const onCompleteForeignDrop = (items: ItemInstance<TreeItemType>[]) =>
    removeItemsFromParents(items, (item, newChildren) => {
      const itemData = item.getItemData();
      if (isFolder(itemData)) {
        const folderItem = itemData as TreeFolderItem;
        folderItem.children = newChildren;
      }
    });

  return { onDropForeignDragObject, onCompleteForeignDrop };
}