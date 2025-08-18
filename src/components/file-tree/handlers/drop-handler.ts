import { createOnDropHandler, type ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Creates the onDrop handler for internal drag and drop operations
 * This handles reordering and moving items within the tree
 */
export function createTreeDropHandler(data: Record<string, TreeItemType>) {
  return createOnDropHandler<TreeItemType>((item: ItemInstance<TreeItemType>, newChildren: string[]) => {
    // Exactly like the example - direct assignment
    const targetItem = data[item.getId()];
    if (targetItem) {
      (targetItem as any).children = newChildren;
    }
  });
}