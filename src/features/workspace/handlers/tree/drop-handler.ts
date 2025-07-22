import { toast } from 'sonner';
import { updateItemOrderAction, moveItemAction } from '../../lib/actions';
import { data, type WorkspaceTreeItem, setDragOperationActive } from '../../lib/tree-data';
import { workspaceQueryKeys } from '../../lib/query-keys';
import type { ItemInstance, DragTarget, TreeInstance } from '@headless-tree/core';
import type { QueryClient } from '@tanstack/react-query';

export type DropHandlerParams = {
  items: ItemInstance<WorkspaceTreeItem>[];
  target: DragTarget<WorkspaceTreeItem>;
};

export type DropHandlerDependencies = {
  tree: TreeInstance<WorkspaceTreeItem>; // Tree instance for rebuilding
  queryClient?: QueryClient | undefined; // Optional for optimistic updates
};

// Operation lock to prevent concurrent drag operations
let operationInProgress = false;
let operationQueue: Array<() => Promise<void>> = [];

/**
 * Process queued operations sequentially to prevent race conditions
 */
async function processOperationQueue() {
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('Queued operation failed:', error);
      }
    }
  }
}

/**
 * Pure drop handler function that handles both moving to different parent and reordering within same parent
 * Following headless-tree best practices with proper operation detection
 */
export async function handleDrop(
  { items, target }: DropHandlerParams,
  { tree, queryClient }: DropHandlerDependencies
): Promise<void> {
  // If operation is in progress, queue this operation
  if (operationInProgress) {
    console.log('🔒 Operation in progress, queueing drop operation');
    return new Promise<void>((resolve, reject) => {
      operationQueue.push(async () => {
        try {
          await handleDropInternal({ items, target }, { tree, queryClient });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Set lock and process operation
  operationInProgress = true;
  try {
    await handleDropInternal({ items, target }, { tree, queryClient });
  } finally {
    operationInProgress = false;
    // Process any queued operations
    if (operationQueue.length > 0) {
      setTimeout(processOperationQueue, 10); // Small delay to avoid stack overflow
    }
  }
}

/**
 * Internal drop handler that performs the actual operation
 * Distinguishes between moving to different parent vs reordering within same parent
 */
async function handleDropInternal(
  { items, target }: DropHandlerParams,
  { tree, queryClient }: DropHandlerDependencies
): Promise<void> {
  const itemIds = items.map(item => item.getId());
  const targetItemId = target.item.getId();
  const targetItemData = data[targetItemId];

  if (!targetItemData) {
    console.warn('Target item data not found for ID:', targetItemId);
    return;
  }

  console.log('🔄 Drop operation started:', {
    itemIds: itemIds.map(id => `${data[id]?.name || 'Unknown'} (${id.slice(-8)})`),
    targetId: `${targetItemData.name} (${targetItemId.slice(-8)})`,
    hasChildIndex: 'childIndex' in target,
    operationType: 'childIndex' in target ? 'REORDER' : 'MOVE',
  });

  // Set drag operation active to prevent data rebuilds
  setDragOperationActive(true);

  try {
    if ('childIndex' in target) {
      // REORDERING: Items stay in same parent, just change sortOrder
      console.log('🔄 Handling REORDER operation within same parent');
      await handleReorderOperation({ items, target }, { tree, queryClient });
    } else {
      // MOVING: Items move to new parent
      console.log('🔄 Handling MOVE operation to different parent');
      await handleMoveOperation({ items, target }, { tree, queryClient });
    }
  } finally {
    // Always clear drag operation state
    setDragOperationActive(false);
  }
}

/**
 * Handle reordering items within the same parent
 */
async function handleReorderOperation(
  { items, target }: DropHandlerParams,
  { tree, queryClient }: DropHandlerDependencies
): Promise<void> {
  // This should use the existing logic from createOnDropHandler
  const targetWithChildIndex = target as DragTarget<WorkspaceTreeItem> & {
    childIndex: number;
    insertionIndex: number;
  };

  const parentId = target.item.getId();
  const parentData = data[parentId];
  
  if (!parentData) {
    console.warn('Parent data not found for ID:', parentId);
    return;
  }
  
  const oldChildren = [...(parentData.children || [])];
  
  // Calculate new children order based on insertion index
  const itemIds = items.map(item => item.getId());
  const insertionIndex = targetWithChildIndex.insertionIndex;
  
  // Remove dragged items from their current positions
  const filteredChildren = oldChildren.filter(childId => !itemIds.includes(childId));
  
  // Insert items at the new position
  const newChildren = [
    ...filteredChildren.slice(0, insertionIndex),
    ...itemIds,
    ...filteredChildren.slice(insertionIndex),
  ];
  
  // Check if this is actually a change to avoid unnecessary operations
  if (JSON.stringify(oldChildren) === JSON.stringify(newChildren)) {
    console.log('🔄 No changes detected in reorder operation, skipping');
    return;
  }

  console.log('🔄 Reorder operation:', {
    parentId: parentId.slice(-8),
    oldChildren: oldChildren.map(id => data[id]?.name || id.slice(-8)),
    newChildren: newChildren.map(id => data[id]?.name || id.slice(-8)),
  });

  // Update data immediately (optimistic update)
  parentData.children = newChildren;

  try {
    // Persist to database
    const result = await updateItemOrderAction(parentId, newChildren);
    
    if (result.success) {
      console.log('✅ Reorder operation successful');
      
      // Mark React Query cache as stale but don't refetch immediately
      if (queryClient) {
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.tree(),
          refetchType: 'none'
        });
      }
      
      toast.success('Items reordered', { duration: 1500 });
    } else {
      console.error('❌ Reorder operation failed:', result.error);
      throw new Error(result.error || 'Failed to update order');
    }
  } catch (error) {
    // Revert on failure
    console.log('⏪ Reverting reorder changes due to error');
    parentData.children = oldChildren;
    tree.rebuildTree();
    
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    }
    
    toast.error(error instanceof Error ? error.message : 'Failed to update order');
  }
}

/**
 * Handle moving items to a different parent
 */
async function handleMoveOperation(
  { items, target }: DropHandlerParams,
  { tree, queryClient }: DropHandlerDependencies
): Promise<void> {
  const targetParentId = target.item.getId();
  const itemIds = items.map(item => item.getId());
  
  console.log('🚚 Move operation:', {
    itemIds: itemIds.map(id => `${data[id]?.name || 'Unknown'} (${id.slice(-8)})`),
    targetParentId: `${data[targetParentId]?.name || 'Unknown'} (${targetParentId.slice(-8)})`,
  });

  // Store original parent information for rollback
  const originalParents: Array<{ itemId: string; originalParentId: string | null; originalChildren: string[] }> = [];

  try {
    // Update tree data optimistically first
    for (const itemId of itemIds) {
      // Find and remove from current parent
      let originalParentId: string | null = null;
      let originalChildren: string[] = [];
      
      for (const [parentId, parentData] of Object.entries(data)) {
        if (parentData.children?.includes(itemId)) {
          originalParentId = parentId;
          originalChildren = [...parentData.children];
          parentData.children = parentData.children.filter(id => id !== itemId);
          break;
        }
      }
      
      originalParents.push({ itemId, originalParentId, originalChildren });
      
      // Add to new parent
      const targetParentData = data[targetParentId];
      if (!targetParentData) {
        throw new Error(`Target parent data not found for ID: ${targetParentId}`);
      }
      
      if (targetParentData.children) {
        targetParentData.children.push(itemId);
      } else {
        targetParentData.children = [itemId];
      }
    }

    // Execute database moves
    const results = await Promise.all(
      itemIds.map(itemId => moveItemAction(itemId, targetParentId))
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.error('❌ Some move operations failed:', failed);
      throw new Error(`Failed to move ${failed.length} of ${itemIds.length} items`);
    }

    console.log('✅ Move operation successful');
    
    // Mark React Query cache as stale but don't refetch immediately
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
        refetchType: 'none'
      });
    }
    
    toast.success(`Moved ${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`, { duration: 1500 });
    
  } catch (error) {
    // Revert all changes on failure
    console.log('⏪ Reverting move changes due to error');
    
    for (const { originalParentId, originalChildren } of originalParents) {
      if (originalParentId && data[originalParentId]) {
        data[originalParentId].children = originalChildren;
      }
    }
    
    // Remove from target parent
    const targetParentData = data[targetParentId];
    if (targetParentData && targetParentData.children) {
      targetParentData.children = targetParentData.children.filter(id => !itemIds.includes(id));
    }
    
    tree.rebuildTree();
    
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    }
    
    toast.error(error instanceof Error ? error.message : 'Failed to move items');
  }
}