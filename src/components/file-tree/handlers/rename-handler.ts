import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

/**
 * Callback for rename operations
 */
export interface RenameOperationCallback {
  (itemId: string, newName: string, itemType: 'file' | 'folder'): Promise<void>;
}

/**
 * Creates the rename handler for tree items
 */
export function createRenameHandler(
  data: Record<string, TreeItemType>,
  callback?: RenameOperationCallback,
  onUpdate?: () => void
) {
  return async (item: ItemInstance<TreeItemType>, value: string) => {
    const itemId = item.getId();
    const itemData = data[itemId];
    
    if (!itemData) return;
    
    const oldName = itemData.name;
    const itemType = itemData.type;
    
    // If callback is provided, call it and wait for success
    if (callback) {
      try {
        await callback(itemId, value, itemType);
        // Only update local state if callback succeeds
        itemData.name = value;
        // Trigger re-render
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Rename operation failed:', error);
        // Don't update local state, keep old name
        // The tree will automatically revert the UI
      }
    } else {
      // No callback, just update local state
      itemData.name = value;
      // Trigger re-render
      if (onUpdate) onUpdate();
    }
  };
}