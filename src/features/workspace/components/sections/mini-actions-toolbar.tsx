'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { CheckSquare, Square, X, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { batchDeleteItemsAction } from '../../lib/actions';
import { enhancedBatchDeleteItemsAction } from '../../lib/actions/enhanced-batch-actions';
import { useTreeOperationStatus } from '../../hooks/use-tree-operation-status';
import { TreeOperationOverlay } from '../loading/tree-operation-overlay';
import { workspaceQueryKeys } from '../../lib/query-keys';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';

interface MiniActionsToolbarProps {
  isSelectMode: boolean;
  selectedItemsCount: number;
  selectedItems: string[];
  onToggleSelectMode: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function MiniActionsToolbar({
  isSelectMode,
  selectedItemsCount,
  selectedItems,
  onToggleSelectMode,
  onClearSelection,
  className = '',
}: MiniActionsToolbarProps) {
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Operation status management
  const {
    operationState,
    startOperation,
    updateProgress,
    setCompleting,
    completeOperation,
    failOperation,
    resetOperation,
    isOperationInProgress,
    canInteract,
  } = useTreeOperationStatus();

  // Enhanced batch delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      // Start operation tracking
      startOperation(
        'batch_delete',
        itemIds.length,
        'Preparing batch deletion...'
      );

      try {
        setCompleting('Finalizing batch deletion...');

        const result = await enhancedBatchDeleteItemsAction(itemIds);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete items');
        }

        completeOperation();
        return result.data;
      } catch (error) {
        failOperation(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    onSuccess: (data, itemIds) => {
      // Close dialog
      setIsDeleteDialogOpen(false);

      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success message
      const itemCount = itemIds.length;
      const itemText = itemCount === 1 ? 'item' : 'items';
      toast.success(`${itemCount} ${itemText} deleted successfully`);

      // Clear selection and exit select mode
      onClearSelection();
    },
    onError: (error, itemIds) => {
      // Close dialog
      setIsDeleteDialogOpen(false);

      // Show error message
      const itemCount = itemIds.length;
      const itemText = itemCount === 1 ? 'item' : 'items';
      toast.error(
        `Failed to delete ${itemCount} ${itemText}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    },
  });

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    batchDeleteMutation.mutate(selectedItems);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={`px-4 py-2 bg-gray-50 border-b border-gray-200 relative ${className}`}
      >
        {/* Loading Overlay for Operations */}
        <TreeOperationOverlay
          operationState={operationState}
          onCancel={resetOperation}
        />
        <div className='flex items-center justify-between'>
          {/* Left side - Select mode toggle and selection info */}
          <div className='flex items-center gap-3'>
            <Button
              onClick={onToggleSelectMode}
              size='sm'
              variant={isSelectMode ? 'default' : 'outline'}
              className='flex items-center gap-2'
              disabled={!canInteract}
            >
              {isSelectMode ? (
                <>
                  <CheckSquare className='w-4 h-4' />
                  Select Mode
                </>
              ) : (
                <>
                  <Square className='w-4 h-4' />
                  Select
                </>
              )}
            </Button>

            {isSelectMode && selectedItemsCount > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className='text-sm text-gray-600'
              >
                {selectedItemsCount}{' '}
                {selectedItemsCount === 1 ? 'item' : 'items'} selected
              </motion.span>
            )}
          </div>

          {/* Right side - Actions */}
          <AnimatePresence>
            {isSelectMode && selectedItemsCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className='flex items-center gap-2'
              >
                {/* Remove Selection Button */}
                <Button
                  onClick={onClearSelection}
                  size='sm'
                  variant='ghost'
                  className='flex items-center gap-2 text-gray-600 hover:text-gray-800'
                  disabled={!canInteract}
                >
                  <X className='w-4 h-4' />
                  Remove Selection
                </Button>

                {/* Delete Selection Button */}
                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      size='sm'
                      variant='destructive'
                      className='flex items-center gap-2'
                      disabled={batchDeleteMutation.isPending || !canInteract}
                    >
                      <Trash2 className='w-4 h-4' />
                      Delete {selectedItemsCount === 1 ? 'Item' : 'Items'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedItemsCount}{' '}
                        {selectedItemsCount === 1 ? 'item' : 'items'}? This
                        action cannot be undone and will permanently remove the
                        selected files and folders.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        disabled={batchDeleteMutation.isPending || !canInteract}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSelected}
                        disabled={batchDeleteMutation.isPending || !canInteract}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50'
                      >
                        {batchDeleteMutation.isPending ? (
                          <>
                            <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                            Deleting...
                          </>
                        ) : (
                          `Delete ${selectedItemsCount === 1 ? 'Item' : 'Items'}`
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
