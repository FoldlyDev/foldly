import { createOnDropHandler, type ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType, TreeFolderItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';

/**
 * Creates the onDrop handler for internal drag and drop operations
 * This handles reordering and moving items within the tree
 */
export function createTreeDropHandler(data: Record<string, TreeItemType>) {
  return createOnDropHandler<TreeItemType>((item: ItemInstance<TreeItemType>, newChildren: string[]) => {
    const targetItem = data[item.getId()];
    if (targetItem && isFolder(targetItem)) {
      const folderItem = targetItem as TreeFolderItem;
      folderItem.children = newChildren;
    }
  });
}