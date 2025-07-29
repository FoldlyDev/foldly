import {
  insertItemsAtTarget,
  removeItemsFromParents,
  type DragTarget,
  type ItemInstance,
} from '@headless-tree/core';
import { data, insertNewItem } from '../../lib/tree-data';
import type { WorkspaceTreeItem } from '../../lib/tree-data';

/**
 * Handler for dropping foreign drag objects (like adding new folders)
 */
export function handleDropForeignDragObject(
  dataTransfer: DataTransfer,
  target: DragTarget<WorkspaceTreeItem>
): void {
  const newId = insertNewItem(dataTransfer.getData('text/plain'));
  insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
    const itemData = data[item.getId()];
    if (itemData) {
      itemData.children = newChildrenIds;
    }
  });
}

/**
 * Handler for completing foreign drop operations
 */
export function handleCompleteForeignDrop(
  items: ItemInstance<WorkspaceTreeItem>[]
): void {
  removeItemsFromParents(items, (item, newChildren) => {
    item.getItemData().children = newChildren;
  });
}

/**
 * Creates foreign drag object data for dragging items
 */
export function createForeignDragObject(
  items: ItemInstance<WorkspaceTreeItem>[]
): { format: string; data: string } {
  return {
    format: 'text/plain',
    data: items.map(item => item.getId()).join(','),
  };
}

/**
 * Determines if a foreign drag object can be dropped on a target
 */
export function canDropForeignDragObject(
  _: DataTransfer,
  target: DragTarget<WorkspaceTreeItem>
): boolean {
  return (target.item as any).isFolder();
}
