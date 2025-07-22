'use client';

import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { batchDeleteItemsAction } from '../../lib/actions';
import { setDragOperationActive } from '../../lib/tree-data';
import { toast } from 'sonner';

interface MiniActionsToolbarProps {
  selectMode: {
    isSelectMode: boolean;
    selectedItems: string[];
    selectedItemsCount: number;
    clearSelection: () => void;
  };
  selectedCount: number;
}

export function MiniActionsToolbar({
  selectMode,
  selectedCount,
}: MiniActionsToolbarProps) {
  const queryClient = useQueryClient();

  // Batch delete mutation with drag operation state protection
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      if (selectMode.selectedItems.length === 0) {
        throw new Error('No items selected');
      }

      // Set operation active to prevent data rebuilds during batch operation
      setDragOperationActive(true);
      
      try {
        const result = await batchDeleteItemsAction(selectMode.selectedItems);
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete items');
        }
        return result.data;
      } finally {
        // Always clear operation state
        setDragOperationActive(false);
      }
    },
    onSuccess: () => {
      // Mark cache as stale but don't refetch immediately
      queryClient.invalidateQueries({ 
        queryKey: workspaceQueryKeys.tree(),
        refetchType: 'none'
      });
      toast.success(`${selectedCount} item${selectedCount > 1 ? 's' : ''} deleted`);
      selectMode.clearSelection();
    },
    onError: (error) => {
      // Force refetch on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete items'
      );
    },
  });

  const handleDelete = () => {
    if (selectedCount === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCount} item${selectedCount > 1 ? 's' : ''}?`)) {
      batchDeleteMutation.mutate();
    }
  };

  if (!selectMode.isSelectMode || selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-md">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} selected
      </span>
      
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={handleDelete}
          disabled={batchDeleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={selectMode.clearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}