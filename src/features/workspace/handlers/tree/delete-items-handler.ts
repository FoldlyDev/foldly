import { deleteItemsFromTree } from '../../lib/tree-data';

export type DeleteItemsHandlerParams = {
  itemIds: string[];
};

export type DeleteItemsHandlerDependencies = {
  tree: any; // Tree instance for rebuilding
};

/**
 * Pure handler function for deleting items from the tree
 * Handles the business logic of item removal and tree updates
 */
export function handleDeleteItems(
  { itemIds }: DeleteItemsHandlerParams,
  { tree }: DeleteItemsHandlerDependencies
): void {
  if (itemIds.length === 0) {
    // No items to delete - exit early
    return;
  }

  // Remove items from tree data structure
  deleteItemsFromTree(itemIds);

  // Rebuild tree to reflect changes
  tree.rebuildTree();
}
