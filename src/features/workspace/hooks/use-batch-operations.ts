'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { batchMoveItemsAction } from '../lib/actions';
import { workspaceQueryKeys } from '../lib/query-keys';
import type {
  BatchOperationItem,
  BatchOperationProgress,
} from '../components/modals/batch-operation-modal';
import { data, setDragOperationActive } from '../lib/tree-data';

export type BatchMoveModalState = {
  isOpen: boolean;
  items: BatchOperationItem[];
  targetFolder: string | undefined;
  targetParentId: string | undefined;
  progress: BatchOperationProgress | undefined;
  isProcessing: boolean;
  pendingMove: {
    parentId: string;
    oldChildren: string[];
    newChildren: string[];
  } | undefined;
};

export type UseBatchOperationsParams = {
  rootId: string | undefined;
  onSelectionChange?: ((selectedItems: string[]) => void) | undefined;
  tree: any;
};

/**
 * Hook that manages batch operation modal state and execution
 * Handles batch move operations with progress tracking
 */
export function useBatchOperations({ 
  rootId, 
  onSelectionChange, 
  tree 
}: UseBatchOperationsParams) {
  const queryClient = useQueryClient();
  
  // Batch operation modal state
  const [batchMoveModal, setBatchMoveModal] = React.useState<BatchMoveModalState>({
    isOpen: false,
    items: [],
    targetFolder: undefined,
    targetParentId: undefined,
    progress: undefined,
    isProcessing: false,
    pendingMove: undefined,
  });

  // Function to handle batch move with modal integration
  const handleBatchMove = React.useCallback(
    async (
      movedItems: string[],
      parentId: string,
      oldChildren?: string[],
      newChildren?: string[]
    ) => {
      if (movedItems.length === 0) return;

      // For single items, move immediately without modal
      if (movedItems.length === 1) {
        // Set operation active to prevent data rebuilds during batch operation
        setDragOperationActive(true);
        
        try {
          const result = await batchMoveItemsAction(movedItems, parentId);
          if (result.success) {
            // Mark cache as stale but don't refetch immediately
            queryClient.invalidateQueries({
              queryKey: workspaceQueryKeys.tree(),
              refetchType: 'none'
            });
            toast.success('Item moved successfully');
            onSelectionChange?.([]);
          } else {
            toast.error(result.error || 'Failed to move item');
            // Force refetch on error to ensure consistency
            queryClient.invalidateQueries({
              queryKey: workspaceQueryKeys.tree(),
            });
          }
        } finally {
          setDragOperationActive(false);
        }
        return;
      }

      // For multiple items, show modal first
      const batchItems: BatchOperationItem[] = movedItems.map(itemId => {
        const itemData = data[itemId];
        return {
          id: itemId,
          name: itemData?.name || 'Unknown',
          type: itemData?.isFile ? 'file' : 'folder',
        };
      });

      // Get target folder name
      const targetFolderName =
        parentId === rootId
          ? 'workspace root'
          : data[parentId]?.name || 'Unknown';

      setBatchMoveModal({
        isOpen: true,
        items: batchItems,
        targetFolder: targetFolderName,
        targetParentId: parentId,
        progress: undefined,
        isProcessing: false,
        pendingMove:
          oldChildren && newChildren
            ? {
                parentId,
                oldChildren,
                newChildren,
              }
            : undefined,
      });
    },
    [queryClient, rootId, onSelectionChange]
  );

  // Function to execute the batch move operation
  const executeBatchMove = React.useCallback(async () => {
    if (!batchMoveModal.items.length || !batchMoveModal.targetParentId) return;

    setBatchMoveModal(prev => ({ ...prev, isProcessing: true }));
    
    // Set operation active to prevent data rebuilds during batch operation
    setDragOperationActive(true);

    // Initialize progress
    const totalItems = batchMoveModal.items.length;
    setBatchMoveModal(prev => ({
      ...prev,
      progress: {
        completed: 0,
        total: totalItems,
        currentItem: batchMoveModal.items[0]?.name || 'Unknown',
        failed: [],
      },
    }));

    try {
      const movedItemIds = batchMoveModal.items.map(item => item.id);
      const result = await batchMoveItemsAction(
        movedItemIds,
        batchMoveModal.targetParentId
      );

      if (result.success) {
        // Mark as complete
        setBatchMoveModal(prev => {
          if (!prev.progress) return prev;
          const { currentItem, ...rest } = prev.progress;
          return {
            ...prev,
            progress: {
              ...rest,
              completed: totalItems,
            },
          };
        });

        console.log('✅ Batch move completed successfully');

        const { movedItems: actualMoved, totalItems: actualTotal } =
          result.data || {};
        if (actualMoved && actualTotal && actualMoved < actualTotal) {
          toast.success(
            `Moved ${actualMoved} items (${actualTotal - actualMoved} were children of moved folders)`
          );
        } else {
          toast.success(
            `Moved ${movedItemIds.length} item${movedItemIds.length === 1 ? '' : 's'}`
          );
        }

        // Clear selection after successful batch move
        onSelectionChange?.([]);
        tree.setSelectedItems([]);

        // Mark cache as stale but don't refetch immediately
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.tree(),
          refetchType: 'none'
        });
      } else {
        setBatchMoveModal(prev => ({
          ...prev,
          progress: prev.progress
            ? {
                ...prev.progress,
                failed: [result.error || 'Failed to move items'],
              }
            : undefined,
        }));
        toast.error(result.error || 'Failed to move items');
        
        // Force refetch on error to ensure consistency
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.tree(),
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to move items'
      );
      // Force refetch on error to ensure consistency
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    } finally {
      setBatchMoveModal(prev => ({
        ...prev,
        isProcessing: false,
      }));
      // Always clear operation state
      setDragOperationActive(false);
    }
  }, [
    batchMoveModal.items,
    batchMoveModal.targetParentId,
    queryClient,
    onSelectionChange,
    tree,
  ]);

  // Function to handle modal close
  const handleModalClose = React.useCallback(() => {
    console.log('🚪 Modal close triggered:', {
      hasPendingMove: !!batchMoveModal.pendingMove,
      isProcessing: batchMoveModal.isProcessing,
      hasProgress: !!batchMoveModal.progress,
      operationCompleted:
        batchMoveModal.progress?.completed === batchMoveModal.progress?.total,
      pendingMove: batchMoveModal.pendingMove,
    });

    // Only allow revert if operation hasn't completed successfully
    const operationCompleted =
      batchMoveModal.progress?.completed === batchMoveModal.progress?.total;
    const canRevert =
      batchMoveModal.pendingMove &&
      !batchMoveModal.isProcessing &&
      !operationCompleted;

    if (canRevert && batchMoveModal.pendingMove) {
      console.log(
        '⏪ Reverting UI changes due to user cancel (operation not completed)'
      );
      const parentData = data[batchMoveModal.pendingMove.parentId];
      if (parentData) {
        console.log(
          '📋 Reverting parent children from:',
          parentData.children,
          'to:',
          batchMoveModal.pendingMove.oldChildren
        );
        parentData.children = batchMoveModal.pendingMove.oldChildren;
      }
      tree.rebuildTree(); // Trigger tree re-render
      console.log('🔄 Tree rebuilt after revert');
    } else if (operationCompleted) {
      console.log('✅ Operation completed successfully - no revert needed');
    } else if (batchMoveModal.isProcessing) {
      console.log('⚠️ Operation in progress - no revert allowed');
    } else {
      console.log('🤷 No pending move to revert');
    }

    setBatchMoveModal({
      isOpen: false,
      items: [],
      targetFolder: undefined,
      targetParentId: undefined,
      progress: undefined,
      isProcessing: false,
      pendingMove: undefined,
    });
    console.log('✅ Modal state reset');
  }, [
    batchMoveModal.pendingMove,
    batchMoveModal.isProcessing,
    batchMoveModal.progress,
    tree,
  ]);

  return {
    batchMoveModal,
    handleBatchMove,
    executeBatchMove,
    handleModalClose,
  };
}