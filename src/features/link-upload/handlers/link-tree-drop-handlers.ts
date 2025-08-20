import type { ItemInstance, DragTarget, TreeInstance } from '@headless-tree/core';
import type { QueryClient } from '@tanstack/react-query';
import { moveLinkItemsAction, updateLinkItemOrderAction } from '../lib/actions/link-folder-actions';
import { linkQueryKeys } from '../lib/query-keys';
import { 
  data,
  setDragOperationActive,
  type LinkTreeItem 
} from '../lib/tree-data';
import { eventBus, NotificationEventType } from '@/features/notifications/core';

interface DropHandlerProps {
  items: ItemInstance<LinkTreeItem>[];
  target: DragTarget<LinkTreeItem>;
}

interface HandlerContext {
  tree: TreeInstance<LinkTreeItem>;
  queryClient: QueryClient;
  linkId: string;
}

// Operation lock to prevent concurrent drag operations
let operationInProgress = false;
const operationQueue: Array<() => Promise<void>> = [];

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
 * Handle drop operations in the link tree (mirroring workspace tree logic)
 */
export async function handleLinkDrop(
  { items, target }: DropHandlerProps,
  { tree, queryClient, linkId }: HandlerContext
): Promise<void> {
  // If operation is in progress, queue this operation
  if (operationInProgress) {
    console.log('🔒 Operation in progress, queueing drop operation');
    return new Promise<void>((resolve, reject) => {
      operationQueue.push(async () => {
        try {
          await handleDropInternal({ items, target }, { tree, queryClient, linkId });
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
    await handleDropInternal({ items, target }, { tree, queryClient, linkId });
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
  { items, target }: DropHandlerProps,
  { tree, queryClient, linkId }: HandlerContext
): Promise<void> {
  const itemIds = items.map(item => item.getId());
  const targetItemId = target.item.getId();
  const targetItemData = data[targetItemId];

  if (!targetItemData) {
    console.warn('Target item data not found for ID:', targetItemId);
    return;
  }

  // Check if target is a folder or the root
  const isTargetFolder = !targetItemData.isFile;
  if (!isTargetFolder) {
    console.warn('Cannot drop items on a file, only folders allowed');
    eventBus.emitNotification(NotificationEventType.SYSTEM_ERROR_PERMISSION, {
      message: 'Can only drop items into folders',
      error: 'Invalid drop target',
    });
    return;
  }

  // Determine if this is actually a reorder (same parent) or move (different parent)
  const firstItemId = itemIds[0];
  if (!firstItemId) {
    console.warn('No items to process');
    return;
  }

  // Find the current parent by looking at the item's parentId
  const firstItem = data[firstItemId];
  const currentParentId = firstItem?.parentId;

  const isReorderOperation = currentParentId === targetItemId;
  const hasChildIndex = 'childIndex' in target;

  console.log('🔄 Drop operation started:', {
    itemIds: itemIds.map(
      id => `${data[id]?.name || 'Unknown'} (${id.slice(-8)})`
    ),
    targetId: `${targetItemData.name} (${targetItemId.slice(-8)})`,
    currentParentId: currentParentId?.slice(-8),
    hasChildIndex,
    isReorderOperation,
    operationType: isReorderOperation ? 'REORDER' : 'MOVE',
    isTargetStaged: targetItemData.isStaged,
  });

  // Set drag operation active to prevent data rebuilds
  setDragOperationActive(true);

  try {
    if (isReorderOperation && hasChildIndex) {
      // REORDERING: Items stay in same parent, just change order
      console.log('🔄 Handling REORDER operation within same parent');
      await handleReorderOperation({ items, target }, { tree, queryClient, linkId });
    } else {
      // MOVING: Items move to new parent
      console.log('🔄 Handling MOVE operation to different parent');
      await handleMoveOperation({ items, target }, { tree, queryClient, linkId });
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
  { items, target }: DropHandlerProps,
  { tree, queryClient, linkId }: HandlerContext
): Promise<void> {
  const parentId = target.item.getId();
  const parentData = data[parentId];

  if (!parentData) {
    console.warn('Parent data not found for ID:', parentId);
    return;
  }

  // Get all children of this parent
  const oldChildren = Object.values(data)
    .filter(item => item.parentId === parentId)
    .map(item => item.id);

  const itemIds = items.map(item => item.getId());

  // Handle insertion index
  let insertionIndex = 0;
  if ('childIndex' in target && 'insertionIndex' in target) {
    const targetWithIndex = target as DragTarget<LinkTreeItem> & {
      childIndex: number;
      insertionIndex: number;
    };
    insertionIndex = targetWithIndex.insertionIndex;
  } else {
    // No specific insertion point - append to end
    insertionIndex = oldChildren.length;
  }

  // Remove dragged items from their current positions
  const filteredChildren = oldChildren.filter(
    childId => !itemIds.includes(childId)
  );

  // Insert items at the new position
  const newChildren = [
    ...filteredChildren.slice(0, insertionIndex),
    ...itemIds,
    ...filteredChildren.slice(insertionIndex),
  ];

  // Check if this is actually a change
  if (JSON.stringify(oldChildren) === JSON.stringify(newChildren)) {
    console.log('🔄 No changes detected in reorder operation, skipping');
    return;
  }

  // Update children order in data store optimistically
  // This is a simplified version - in reality we'd need to update sort order
  tree.rebuildTree();

  // For staging items, we don't persist to database
  if (parentData.isStaged) {
    console.log('✅ Reorder operation successful (staging folder)');
    eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS, {
      items: newChildren.map(id => ({
        id,
        name: data[id]?.name || 'Item',
        type: data[id]?.isFile ? 'file' as const : 'folder' as const,
      })),
      batchId: `reorder-${Date.now()}`,
      totalItems: newChildren.length,
      completedItems: newChildren.length,
    });
    return;
  }

  try {
    // Persist to database if not staging
    const result = await updateLinkItemOrderAction(linkId, parentId, newChildren);

    if (result.success) {
      console.log('✅ Reorder operation successful');
      // Mark React Query cache as stale but don't refetch immediately
      if (queryClient) {
        queryClient.invalidateQueries({
          queryKey: linkQueryKeys.tree(linkId),
          refetchType: 'none',
        });
      }
      eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS, {
      items: newChildren.map(id => ({
        id,
        name: data[id]?.name || 'Item',
        type: data[id]?.isFile ? 'file' as const : 'folder' as const,
      })),
      batchId: `reorder-${Date.now()}`,
      totalItems: newChildren.length,
      completedItems: newChildren.length,
    });
    } else {
      throw new Error(result.error || 'Failed to update order');
    }
  } catch (error) {
    // Revert on failure
    console.log('⏪ Reverting reorder changes due to error');
    tree.rebuildTree();
    
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.tree(linkId),
      });
    }
    
    eventBus.emitNotification(NotificationEventType.WORKSPACE_BATCH_DELETE_ERROR, {
      items: newChildren.map(id => ({
        id,
        name: data[id]?.name || 'Item',
        type: data[id]?.isFile ? 'file' as const : 'folder' as const,
      })),
      batchId: `reorder-${Date.now()}`,
      totalItems: newChildren.length,
      completedItems: 0,
      failedItems: newChildren.length,
      error: error instanceof Error ? error.message : 'Failed to update order',
    });
  }
}

/**
 * Handle moving items to a different parent
 */
async function handleMoveOperation(
  { items, target }: DropHandlerProps,
  { tree, queryClient, linkId }: HandlerContext
): Promise<void> {
  const targetParentId = target.item.getId();
  const targetParentData = data[targetParentId];
  const itemIds = items.map(item => item.getId());

  console.log('🚚 Move operation:', {
    itemIds: itemIds.map(
      id => `${data[id]?.name || 'Unknown'} (${id.slice(-8)})`
    ),
    targetParentId: `${targetParentData?.name || 'Unknown'} (${targetParentId.slice(-8)})`,
    isTargetStaged: targetParentData?.isStaged,
  });

  // Store original parent information for rollback
  const originalParents = new Map<string, string | undefined>();
  
  try {
    // Update tree data optimistically first
    for (const itemId of itemIds) {
      const item = data[itemId];
      if (item) {
        const oldParentId = item.parentId;
        originalParents.set(itemId, oldParentId);
        
        // Remove from old parent's children array
        if (oldParentId && data[oldParentId]) {
          const oldParent = data[oldParentId];
          if (oldParent.children) {
            oldParent.children = oldParent.children.filter(id => id !== itemId);
          }
        }
        
        // Update item's parent
        data[itemId] = {
          ...item,
          parentId: targetParentId,
        };
        
        // Add to new parent's children array
        if (targetParentId && data[targetParentId]) {
          const newParent = data[targetParentId];
          if (!newParent.children) {
            newParent.children = [];
          }
          if (!newParent.children.includes(itemId)) {
            newParent.children.push(itemId);
          }
        }
      }
    }

    // If moving staged items, update the staging store as well
    const stagingStore = (await import('../stores/staging-store')).useStagingStore.getState();
    const isAnyItemStaged = itemIds.some(id => data[id]?.isStaged);
    
    if (isAnyItemStaged) {
      // Update staged items in the staging store
      for (const itemId of itemIds) {
        if (data[itemId]?.isStaged) {
          stagingStore.moveStagedItem(itemId, targetParentId);
        }
      }
    }

    // Rebuild tree after optimistic updates
    tree.rebuildTree();

    // For staging folders or mixed staging/non-staging moves, handle specially
    const isTargetStaged = targetParentData?.isStaged;
    const hasAnyStaged = itemIds.some(id => data[id]?.isStaged);
    
    if (isTargetStaged || hasAnyStaged) {
      console.log('✅ Move operation successful (involves staging items)');
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_MOVE_SUCCESS, {
        fileId: itemIds[0] || '',
        fileName: `${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`,
      });
      return;
    }

    // Execute database moves for non-staging items
    const result = await moveLinkItemsAction(linkId, itemIds, targetParentId);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to move items');
    }

    console.log('✅ Move operation successful');

    // Mark React Query cache as stale but don't refetch immediately
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.tree(linkId),
        refetchType: 'none',
      });
    }

    eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_MOVE_SUCCESS, {
      fileId: itemIds[0] || '',
      fileName: `${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`,
    });
  } catch (error) {
    // Revert all changes on failure
    console.log('⏪ Reverting move changes due to error');
    
    // Restore original parent relationships and children arrays
    for (const itemId of itemIds) {
      const originalParentId = originalParents.get(itemId);
      
      if (data[itemId]) {
        // Remove from current parent's children
        const currentParentId = data[itemId].parentId;
        if (currentParentId && data[currentParentId]) {
          const currentParent = data[currentParentId];
          if (currentParent.children) {
            currentParent.children = currentParent.children.filter(id => id !== itemId);
          }
        }
        
        // Restore original parent
        data[itemId].parentId = originalParentId;
        
        // Add back to original parent's children
        if (originalParentId && data[originalParentId]) {
          const originalParent = data[originalParentId];
          if (!originalParent.children) {
            originalParent.children = [];
          }
          if (!originalParent.children.includes(itemId)) {
            originalParent.children.push(itemId);
          }
        }
      }
    }
    
    tree.rebuildTree();
    
    if (queryClient) {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.tree(linkId),
      });
    }
    
    eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
      fileId: itemIds[0] || '',
      fileName: `${itemIds.length} item${itemIds.length === 1 ? '' : 's'}`,
      error: error instanceof Error ? error.message : 'Failed to move items',
    });
  }
}