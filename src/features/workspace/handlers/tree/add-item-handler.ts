import { insertItemsAtTarget, type DragTarget } from '@headless-tree/core';
import { data, insertNewItem } from '../../lib/tree-data';
import type { WorkspaceTreeItem } from '../../lib/tree-data';

export type AddItemHandlerParams = {
  name: string;
  parentId?: string;
  isFile?: boolean;
};

export type AddItemHandlerDependencies = {
  tree: any; // Tree instance
  rootId: string | undefined;
};

/**
 * Pure handler function for adding new items (files or folders) to the tree
 * Handles the business logic of item creation and tree updates
 */
export function handleAddItem(
  { name, parentId, isFile = false }: AddItemHandlerParams,
  { tree, rootId }: AddItemHandlerDependencies
): string | null {
  if (!rootId) {
    console.warn('Cannot add item: no root ID provided');
    return null;
  }

  const targetId = parentId || rootId;
  const targetItem = tree.getItemInstance(targetId);

  if (!targetItem) {
    console.warn('Cannot add item: target item not found:', targetId);
    return null;
  }

  console.log('➕ Adding new item:', {
    name,
    isFile,
    targetId: targetId.slice(-8),
  });

  // Create new item in tree data
  const newId = insertNewItem(name, isFile);
  const target: DragTarget<WorkspaceTreeItem> = {
    item: targetItem,
  };

  // Insert item into tree structure
  insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
    const itemData = data[item.getId()];
    if (itemData) {
      itemData.children = newChildrenIds;
    }
  });

  // Expand parent folder if it's not the workspace root
  if (targetId !== rootId) {
    targetItem.expand();
  }

  console.log('✅ Item added successfully:', newId);
  return newId;
}
