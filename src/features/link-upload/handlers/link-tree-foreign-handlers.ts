import type { ItemInstance, DragTarget } from '@headless-tree/core';
import type { LinkTreeItem } from '../lib/tree-data';

/**
 * Handle foreign drag objects (e.g., files from file system or other apps)
 */
export function handleLinkDropForeignDragObject(
  dataTransfer: DataTransfer,
  target: DragTarget<LinkTreeItem>
): void {
  console.log('🎯 handleLinkDropForeignDragObject:', { dataTransfer, target });
  // Handle file drops from file system
  const files = dataTransfer.files;
  if (files && files.length > 0) {
    console.log('📁 Files dropped from system:', files);
    // TODO: Implement file upload through drag and drop
    // For now, files are uploaded through the upload modal
  }
}

/**
 * Complete foreign drop operation
 */
export function handleLinkCompleteForeignDrop(
  items: ItemInstance<LinkTreeItem>[],
  target: DragTarget<LinkTreeItem>
): void {
  console.log('✅ handleLinkCompleteForeignDrop:', { items, target });
  // Remove items from their original parents after successful drop
  items.forEach(item => {
    const parentData = item.getParent()?.getItemData();
    if (parentData && parentData.children) {
      parentData.children = parentData.children.filter(id => id !== item.getId());
    }
  });
}

/**
 * Create foreign drag object for dragging items outside the tree
 */
export function createLinkForeignDragObject(
  items: ItemInstance<LinkTreeItem>[]
): { format: string; data: string } {
  console.log('🎨 createLinkForeignDragObject:', items);
  // Return proper drag object format for compatibility
  return {
    format: 'text/plain',
    data: items.map(item => item.getId()).join(','),
  };
}

/**
 * Check if foreign drag object can be dropped
 */
export function canLinkDropForeignDragObject(
  dataTransfer: DataTransfer,
  target: DragTarget<LinkTreeItem>
): boolean {
  console.log('🤔 canLinkDropForeignDragObject:', { dataTransfer, target });
  
  // Allow dropping files from file system onto folders
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    // Can only drop on folders, not files
    return target.item?.isFolder() || target.targetType === 'between-items';
  }
  
  // Allow dropping text data (for internal drag and drop)
  if (dataTransfer.types.includes('text/plain')) {
    return target.item?.isFolder() || target.targetType === 'between-items';
  }
  
  return false;
}