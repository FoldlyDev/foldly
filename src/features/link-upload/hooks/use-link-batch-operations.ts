'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TreeInstance } from '@headless-tree/core';
import { moveLinkItemsAction } from '../lib/actions/link-folder-actions';
import { linkQueryKeys } from '../lib/query-keys';
import { setDragOperationActive, type LinkTreeItem } from '../lib/tree-data';
import { toast } from 'sonner';
import type { BatchOperationItem, BatchOperationProgress } from '../components/modals/batch-operation-modal';

interface UseLinkBatchOperationsProps {
  rootId?: string;
  linkId: string;
  onSelectionChange?: (selectedItems: string[]) => void;
  tree: TreeInstance<LinkTreeItem>;
}

interface BatchMoveModalState {
  isOpen: boolean;
  items: BatchOperationItem[];
  targetFolder?: string;
  progress?: BatchOperationProgress;
  isProcessing: boolean;
}

export function useLinkBatchOperations({
  rootId,
  linkId,
  onSelectionChange,
  tree,
}: UseLinkBatchOperationsProps) {
  const [batchMoveModal, setBatchMoveModal] = useState<BatchMoveModalState>({
    isOpen: false,
    items: [],
    isProcessing: false,
  });

  const queryClient = useQueryClient();

  // Batch move mutation
  const batchMoveMutation = useMutation({
    mutationFn: async ({ itemIds, targetFolderId }: { itemIds: string[]; targetFolderId: string }) => {
      setDragOperationActive(true);

      try {
        const result = await moveLinkItemsAction(linkId, itemIds, targetFolderId);
        if (!result.success) {
          throw new Error(result.error || 'Failed to move items');
        }
        return result.data;
      } finally {
        setDragOperationActive(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: linkQueryKeys.tree(linkId),
        refetchType: 'none',
      });
      onSelectionChange?.([]);
      toast.success('Items moved successfully');
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: linkQueryKeys.tree(linkId) });
      toast.error(error instanceof Error ? error.message : 'Failed to move items');
    },
  });

  const handleModalClose = useCallback(() => {
    setBatchMoveModal({
      isOpen: false,
      items: [],
      isProcessing: false,
    });
  }, []);

  const executeBatchMove = useCallback(() => {
    if (!batchMoveModal.targetFolder) return;

    const itemIds = batchMoveModal.items.map(item => item.id);
    setBatchMoveModal(prev => ({ ...prev, isProcessing: true }));

    batchMoveMutation.mutate({
      itemIds,
      targetFolderId: batchMoveModal.targetFolder!,
    });
  }, [batchMoveModal.items, batchMoveModal.targetFolder, batchMoveMutation]);

  const openBatchMoveModal = useCallback((
    items: BatchOperationItem[],
    targetFolder: string
  ) => {
    setBatchMoveModal({
      isOpen: true,
      items,
      targetFolder,
      isProcessing: false,
    });
  }, []);

  return {
    batchMoveModal,
    handleModalClose,
    executeBatchMove,
    openBatchMoveModal,
  };
}