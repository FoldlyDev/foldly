import { createOnDropHandler, type ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType, TreeFolderItem } from '../types/tree-types';
import { isFolder } from '../types/tree-types';

/**
 * Callbacks for different drop operations
 */
export interface DropOperationCallbacks {
  onReorder?: (parentId: string, itemIds: string[], newOrder: string[], draggedItemIds: string[]) => Promise<void>;
  onMove?: (itemIds: string[], fromParentId: string, toParentId: string) => Promise<void>;
}

// Removed unused function - we now track parent during drag operation

// Track ongoing drag operations to handle the two-phase update
let dragOperationInProgress = false;
let dragOperationTimeout: NodeJS.Timeout | null = null;
let draggedItemsOriginalParent: string | null = null;

/**
 * Creates the onDrop handler for internal drag and drop operations
 * This handles reordering and moving items within the tree
 */
export function createTreeDropHandler(
  data: Record<string, TreeItemType>,
  callbacks?: DropOperationCallbacks
) {
  return createOnDropHandler<TreeItemType>(async (item: ItemInstance<TreeItemType>, newChildren: string[]) => {
    const targetId = item.getId();
    const targetItem = data[targetId];
    
    if (!targetItem || !isFolder(targetItem)) {
      return;
    }
    
    const folderItem = targetItem as TreeFolderItem;
    const oldChildren = folderItem.children || [];
    
    // Clear any existing timeout
    if (dragOperationTimeout) {
      clearTimeout(dragOperationTimeout);
      dragOperationTimeout = null;
    }
    
    // Identify what changed
    const addedItems = newChildren.filter(id => !oldChildren.includes(id));
    const removedItems = oldChildren.filter(id => !newChildren.includes(id));
    
    console.log('📦 Drop operation detected:', {
      targetId: targetId.slice(0, 8),
      oldChildren: oldChildren.map(id => id.slice(0, 8)),
      newChildren: newChildren.map(id => id.slice(0, 8)),
      added: addedItems.map(id => id.slice(0, 8)),
      removed: removedItems.map(id => id.slice(0, 8)),
      hasCallbacks: !!callbacks
    });
    
    // For reordering within the same parent, the library calls the handler twice:
    // 1. First with the item removed (during drag)
    // 2. Then with the item added back in new position
    // We need to detect this pattern
    
    if (removedItems.length > 0 && addedItems.length === 0) {
      // Items were removed but none added - this is the first phase of a reorder OR move
      // Store the parent ID for the removed items
      draggedItemsOriginalParent = targetId;
      
      console.log('⏳ Items removed from parent, tracking for operation detection...', {
        parentId: targetId.slice(0, 8),
        removedItems: removedItems.map(id => id.slice(0, 8))
      });
      dragOperationInProgress = true;
      
      // Set a timeout to reset the flag if no second update comes
      dragOperationTimeout = setTimeout(() => {
        dragOperationInProgress = false;
        draggedItemsOriginalParent = null;
        console.log('⏰ Timeout: treating as items removed from parent');
      }, 100);
      
      // Update local state but don't trigger database update yet
      folderItem.children = newChildren;
      return;
    }
    
    if (addedItems.length > 0) {
      // Items were added
      
      // Check if we have a tracked original parent (from the removal phase)
      const isMove = dragOperationInProgress && draggedItemsOriginalParent && draggedItemsOriginalParent !== targetId;
      const isReorder = dragOperationInProgress && draggedItemsOriginalParent === targetId;
      
      if (isMove) {
        // This is a MOVE operation - items came from a different parent
        const fromParentId = draggedItemsOriginalParent!; // We know it's not null because of isMove check
        dragOperationInProgress = false;
        draggedItemsOriginalParent = null;
        
        console.log('➡️ MOVE operation detected:', {
          items: addedItems.map(id => id.slice(0, 8)),
          from: fromParentId.slice(0, 8),
          to: targetId.slice(0, 8),
          hasCallback: !!callbacks?.onMove
        });
        
        if (callbacks?.onMove) {
          try {
            await callbacks.onMove(addedItems, fromParentId, targetId);
          } catch (error) {
            console.error('Move operation failed:', error);
            // Don't update local state if the operation failed
            return;
          }
        }
      } else if (isReorder) {
        // This is the second phase of a reorder - items coming back to same parent
        dragOperationInProgress = false;
        draggedItemsOriginalParent = null;
        
        // Check if the order actually changed
        const orderChanged = oldChildren.join(',') !== newChildren.join(',');
        
        console.log('🔄 REORDER operation completed:', {
          targetId: targetId.slice(0, 8),
          orderChanged,
          draggedItems: addedItems.map(id => id.slice(0, 8)),
          draggedCount: addedItems.length,
          oldOrder: oldChildren.map(id => id.slice(0, 8)),
          newOrder: newChildren.map(id => id.slice(0, 8)),
          hasCallback: !!callbacks?.onReorder
        });
        
        if (orderChanged && callbacks?.onReorder) {
          try {
            // For reorder, we need to pass ALL children in their new order
            // because all items' sort orders need to be updated
            // Also pass the specific items that were dragged
            await callbacks.onReorder(targetId, oldChildren, newChildren, addedItems);
          } catch (error) {
            console.error('Reorder operation failed:', error);
            // Don't update local state if the operation failed
            return;
          }
        } else if (!orderChanged) {
          console.log('📊 Order unchanged, skipping database update');
        }
      } else {
        // Edge case or direct drop - just update state
        dragOperationInProgress = false;
        draggedItemsOriginalParent = null;
        console.log('📦 Direct add operation, updating state');
      }
    }
    
    // Update local state after successful operation (or if no callbacks provided)
    folderItem.children = newChildren;
  });
}