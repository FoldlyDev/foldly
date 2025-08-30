'use client';

import { useMemo } from 'react';
import type { DropOperationCallbacks } from '@/components/file-tree/handlers/drop-handler';
import { updateItemOrderAction, moveItemAction } from '../actions';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';

/**
 * Drag-Drop Handler Hook
 * Manages drag and drop operations for tree items
 * 
 * Responsibilities:
 * - Handle item reordering within same parent
 * - Handle moving items between folders
 * - Process batch operations with progress tracking
 * - Emit notifications for operation status
 * - Return callbacks for drop operations
 */

interface UseDragDropHandlerProps {
  // No props needed for this handler as it's stateless
}

interface DragDropHandler {
  dropCallbacks: DropOperationCallbacks;
}

export function useDragDropHandler(_props?: UseDragDropHandlerProps): DragDropHandler {
  
  /**
   * Create drop operation callbacks for database persistence
   * These callbacks handle both reorder and move operations
   */
  const dropCallbacks: DropOperationCallbacks = useMemo(
    () => ({
      /**
       * Handle reordering items within the same parent
       */
      onReorder: async (
        parentId: string,
        _itemIds: string[],
        newOrder: string[],
        draggedItemIds: string[]
      ) => {

        // Show loading notification for reorder - use dragged items count
        const reorderBatchId = `reorder-${Date.now()}`;
        eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_START, {
          batchId: reorderBatchId,
          totalItems: draggedItemIds.length, // Use actual dragged items count
          completedItems: 0,
          items: draggedItemIds.map(id => ({ id, name: '', type: 'file' as const })),
        }, {
          priority: NotificationPriority.LOW,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0, // Keep showing until complete
        });

        try {
          const result = await updateItemOrderAction(parentId, newOrder);
          if (result.success) {
            
            // Emit success notification with correct count
            eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS, {
              batchId: reorderBatchId,
              totalItems: draggedItemIds.length, // Use actual dragged items count
              completedItems: draggedItemIds.length,
              items: draggedItemIds.map(id => ({ id, name: '', type: 'file' as const })),
            }, {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            });
          } else {
            throw new Error(result.error || 'Failed to update order');
          }
        } catch (error) {
          console.error('❌ [WorkspaceContainer] REORDER failed:', error);
          
          // Emit error notification with correct count
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR, {
            batchId: reorderBatchId,
            totalItems: draggedItemIds.length, // Use actual dragged items count
            completedItems: 0,
            failedItems: draggedItemIds.length,
            items: draggedItemIds.map(id => ({ id, name: '', type: 'file' as const })),
            error: error instanceof Error ? error.message : 'Failed to update order',
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          });
          
          throw error; // Re-throw to prevent local state update
        }
      },
      
      /**
       * Handle moving items between folders
       */
      onMove: async (
        itemIds: string[],
        _fromParentId: string,
        toParentId: string
      ) => {

        // Show loading notification for move
        const moveBatchId = `move-${Date.now()}`;
        eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_START, {
          batchId: moveBatchId,
          totalItems: itemIds.length,
          completedItems: 0,
          items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
        }, {
          priority: NotificationPriority.MEDIUM,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0, // Keep showing until complete
        });

        try {
          const results = await Promise.all(
            itemIds.map(itemId => moveItemAction(itemId, toParentId))
          );

          const failed = results.filter(r => !r.success);
          if (failed.length > 0) {
            throw new Error(
              `Failed to move ${failed.length} of ${itemIds.length} items`
            );
          }

          
          // Emit success notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_SUCCESS, {
            batchId: moveBatchId,
            totalItems: itemIds.length,
            completedItems: itemIds.length,
            items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
          }, {
            priority: NotificationPriority.LOW,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 2000,
          });
        } catch (error) {
          console.error('❌ [WorkspaceContainer] MOVE failed:', error);
          
          // Emit error notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_ERROR, {
            batchId: moveBatchId,
            totalItems: itemIds.length,
            completedItems: 0,
            failedItems: itemIds.length,
            items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
            error: error instanceof Error ? error.message : 'Failed to move items',
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          });
          
          throw error; // Re-throw to prevent local state update
        }
      },
    }),
    []
  );

  return {
    dropCallbacks,
  };
}