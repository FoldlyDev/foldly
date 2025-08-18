import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Creates the rename handler for tree items
 */
export function createRenameHandler(data: Record<string, TreeItemType>) {
  return (item: ItemInstance<TreeItemType>, value: string) => {
    const itemData = data[item.getId()];
    if (itemData) {
      itemData.name = value;
    }
  };
}