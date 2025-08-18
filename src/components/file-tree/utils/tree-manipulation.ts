import type { DragTarget } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Helper function to add items to the tree programmatically
 * Use insertItemsAtTarget just like the drag handler does!
 */
export const addTreeItem = (
  treeInstance: any,
  parentId: string,
  item: TreeItemType,
  treeId: string,  // Add treeId parameter
  getTreeData: (treeId: string) => { data: Record<string, TreeItemType> }
) => {
  const { data } = getTreeData(treeId);
  
  // First add the item to data
  data[item.id] = item;

  // Now use insertItemsAtTarget just like drag drop does!
  const parentItem = treeInstance.getItemInstance(parentId);
  if (parentItem) {
    // Simple target - just the item (will drop inside it)
    const target: DragTarget<TreeItemType> = {
      item: parentItem,
    };

    // Use the same function that drag drop uses!
    insertItemsAtTarget([item.id], target, (item, newChildrenIds) => {
      const itemData = data[item.getId()];
      if (itemData && 'children' in itemData) {
        (itemData as any).children = newChildrenIds;
      }
    });
  }
};

/**
 * Helper function to remove items from the tree programmatically
 */
export const removeTreeItem = (
  treeInstance: any,
  itemIds: string[],
  treeId: string,
  getTreeData: (treeId: string) => { data: Record<string, TreeItemType> }
) => {
  const { data } = getTreeData(treeId);
  
  // Get item instances from the tree
  const itemInstances = itemIds
    .map(id => treeInstance.getItemInstance(id))
    .filter(Boolean);

  if (itemInstances.length === 0) {
    console.warn('No valid items to remove');
    return;
  }

  // Use removeItemsFromParents just like the drag drop example!
  removeItemsFromParents(itemInstances, (item, newChildren) => {
    const itemData = data[item.getId()];
    if (itemData && 'children' in itemData) {
      (itemData as any).children = newChildren;
    }
  });

  // Delete the items from data
  itemIds.forEach(id => {
    delete data[id];
  });
};