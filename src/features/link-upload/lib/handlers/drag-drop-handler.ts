'use client';

import { useMemo } from 'react';
import type { DropOperationCallbacks } from '@/components/file-tree/handlers/drop-handler';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import { useLinkUploadStagingStore } from '../../stores/staging-store';

/**
 * Drag-Drop Handler Hook for Link Upload
 * Manages drag and drop operations for tree items during upload session
 * 
 * Responsibilities:
 * - Handle item reordering within same parent
 * - Handle moving items between folders
 * - Update local tree state (no database persistence for upload sessions)
 * - Emit notifications for operation status
 * 
 * Note: All operations are local to the upload session
 */

interface UseDragDropHandlerProps {
  treeInstance: any;
}

interface DragDropHandler {
  dropCallbacks: DropOperationCallbacks;
}

export function useDragDropHandler({ treeInstance }: UseDragDropHandlerProps): DragDropHandler {
  
  /**
   * Create drop operation callbacks for local tree updates
   * These callbacks handle both reorder and move operations locally
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
        // Show loading notification for reorder
        const reorderBatchId = `reorder-${Date.now()}`;
        eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_START, {
          batchId: reorderBatchId,
          totalItems: draggedItemIds.length,
          completedItems: 0,
          items: draggedItemIds.map(id => ({ id, name: '', type: 'file' as const })),
        }, {
          priority: NotificationPriority.LOW,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0,
        });

        try {
          // For link upload, reordering is handled locally by the tree
          // The tree component will update its internal state
          // We just need to emit success notification
          
          // Simulate a small delay for better UX
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Emit success notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS, {
            batchId: reorderBatchId,
            totalItems: draggedItemIds.length,
            completedItems: draggedItemIds.length,
            items: draggedItemIds.map(id => ({ id, name: '', type: 'file' as const })),
          }, {
            priority: NotificationPriority.LOW,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 2000,
          });
        } catch (error) {
          console.error('❌ [LinkUpload] REORDER failed:', error);
          
          // Emit error notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR, {
            batchId: reorderBatchId,
            totalItems: draggedItemIds.length,
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
          duration: 0,
        });

        try {
          // For link upload, we need to update the staging store
          const { moveStagedFile } = useLinkUploadStagingStore.getState();
          
          // Update the parentId for each moved item in the staging store
          itemIds.forEach(itemId => {
            if (itemId.startsWith('staged-file-')) {
              moveStagedFile(itemId, toParentId);
              console.log('Updated staged file parent:', { itemId, toParentId });
            }
            // Note: We don't support moving folders yet in staging
          });
          
          // Simulate a small delay for better UX
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
          console.error('❌ [LinkUpload] MOVE failed:', error);
          
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
    [treeInstance]
  );

  return {
    dropCallbacks,
  };
}