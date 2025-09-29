import type { DragTarget } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem as TreeItemType, TreeFolderItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';
import { sortChildren } from './sort-children';

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
  console.log('🟤 [tree-manipulation] addTreeItem called:', {
    parentId,
    itemId: item.id,
    itemName: item.name,
    treeId
  });
  
  const { data } = getTreeData(treeId);
  console.log('🟤 [tree-manipulation] Current data keys before add:', Object.keys(data));
  
  // Check if item already exists to prevent duplicates
  if (data[item.id]) {
    console.log('⚠️ [tree-manipulation] Item already exists in tree, skipping:', {
      itemId: item.id,
      itemName: item.name,
      existingName: data[item.id].name
    });
    return; // Don't add duplicates
  }
  
  // Add the item to data
  data[item.id] = item;
  console.log('🟤 [tree-manipulation] Added item to data object');

  // Now use insertItemsAtTarget just like drag drop does!
  const parentItem = treeInstance.getItemInstance(parentId);
  console.log('🟤 [tree-manipulation] Parent item found:', {
    parentId,
    parentExists: !!parentItem,
    parentName: parentItem?.getItemName?.()
  });
  
  if (parentItem) {
    // Simple target - just the item (will drop inside it)
    const target: DragTarget<TreeItemType> = {
      item: parentItem,
    };

    console.log('🟤 [tree-manipulation] Calling insertItemsAtTarget');
    // Use the same function that drag drop uses!
    insertItemsAtTarget([item.id], target, (parentItem, newChildrenIds) => {
      const parentData = data[parentItem.getId()];
      console.log('🟤 [tree-manipulation] insertItemsAtTarget callback:', {
        itemId: parentItem.getId(),
        newChildrenIds,
        hasItemData: !!parentData
      });
      if (parentData && isFolder(parentData)) {
        const folderItem = parentData as TreeFolderItem;
        
        // Remove duplicates from newChildrenIds (defensive programming)
        const uniqueChildrenIds = [...new Set(newChildrenIds)];
        
        // Use centralized sorting to maintain consistent order
        // This ensures new items (negative sortOrder) appear at top
        folderItem.children = sortChildren(uniqueChildrenIds, data);
        console.log('🟤 [tree-manipulation] Updated folder children with centralized sorting:', folderItem.children);
      }
    });
    console.log('🟤 [tree-manipulation] insertItemsAtTarget completed');
  } else {
    console.log('⚠️ [tree-manipulation] Parent item not found!', { parentId });
  }
  
  console.log('🟤 [tree-manipulation] Final data keys:', Object.keys(data));
  console.log('🟤 [tree-manipulation] addTreeItem completed');
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
    if (itemData && isFolder(itemData)) {
      const folderItem = itemData as TreeFolderItem;
      folderItem.children = newChildren;
    }
  });

  // Delete the items from data
  itemIds.forEach(id => {
    delete data[id];
  });
};