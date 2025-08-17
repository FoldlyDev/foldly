import type { DragTarget, ItemInstance } from '@headless-tree/core';
import { insertItemsAtTarget, removeItemsFromParents } from '@headless-tree/core';
import type { TreeItem, TreeFileItem } from '../types/tree-types';
import type { ItemsUpdater } from '../types/handler-types';
import { isFolder } from '../types/tree-types';

/**
 * Configuration for foreign drag and drop operations
 */
export interface ForeignDropConfig<T extends TreeItem = TreeItem> {
  /**
   * Called when creating a new item from foreign drop data
   * Returns the new item to be inserted
   */
  createItemFromDrop: (dataTransfer: DataTransfer) => T | null;
  
  /**
   * Optional: Determines if a foreign object can be dropped at target
   * Defaults to allowing drops only on folders
   */
  canDropAt?: (dataTransfer: DataTransfer, target: DragTarget<T>) => boolean;
  
  /**
   * Optional: Format for dragging items out of the tree
   * Defaults to 'text/plain' with comma-separated IDs
   */
  dragFormat?: string;
}

/**
 * Creates handlers for foreign drag and drop operations
 */
export function createForeignDropHandlers<T extends TreeItem = TreeItem>(
  setItems: ItemsUpdater<T>,
  config: ForeignDropConfig<T>
) {
  const {
    createItemFromDrop,
    canDropAt = (_, target) => isFolder(target.item.getItemData()),
    dragFormat = 'text/plain'
  } = config;

  return {
    /**
     * Handle dropping external items into the tree
     */
    onDropForeignDragObject: (dataTransfer: DataTransfer, target: DragTarget<T>) => {
      const newItem = createItemFromDrop(dataTransfer);
      if (!newItem) return;

      // Insert the new item at the drop target
      insertItemsAtTarget([newItem.id], target, (item, newChildrenIds) => {
        setItems(prevItems => {
          const targetItem = prevItems[item.getId()];
          if (!targetItem || !isFolder(targetItem)) return prevItems;
          
          return {
            ...prevItems,
            [newItem.id]: newItem,
            [item.getId()]: {
              ...targetItem,
              children: newChildrenIds
            } as T
          };
        });
      });
    },

    /**
     * Clean up after dragging items out of the tree
     */
    onCompleteForeignDrop: (items: ItemInstance<T>[]) => {
      removeItemsFromParents(items, (item, newChildrenIds) => {
        setItems(prevItems => {
          const parentItem = prevItems[item.getId()];
          if (!parentItem || !isFolder(parentItem)) return prevItems;
          
          return {
            ...prevItems,
            [item.getId()]: {
              ...parentItem,
              children: newChildrenIds
            } as T
          };
        });
      });
    },

    /**
     * Create data when dragging items out of the tree
     */
    createForeignDragObject: (items: ItemInstance<T>[]) => ({
      format: dragFormat,
      data: items.map(item => item.getId()).join(',')
    }),

    /**
     * Determine if foreign items can be dropped at location
     */
    canDropForeignDragObject: canDropAt
  };
}

/**
 * Helper to create a file item from a dropped file
 */
export function createFileItemFromDrop(
  file: File,
  parentId?: string | null
): TreeFileItem {
  const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const extension = file.name.split('.').pop() || null;
  
  return {
    id,
    name: file.name,
    type: 'file',
    parentId: parentId ?? null,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    extension,
    processingStatus: 'pending'
  };
}

/**
 * Helper to extract files from DataTransfer
 */
export function getFilesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const files: File[] = [];
  
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    Array.from(dataTransfer.files).forEach(file => files.push(file));
  }
  
  return files;
}