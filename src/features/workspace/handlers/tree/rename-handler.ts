import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';
import { renameFileAction, renameFolderAction } from '../../lib/actions';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { data, type WorkspaceTreeItem } from '../../lib/tree-data';
import type { ItemInstance } from '@headless-tree/core';

export type RenameHandlerParams = {
  item: ItemInstance<WorkspaceTreeItem>;
  value: string;
};

export type RenameHandlerDependencies = {
  queryClient: QueryClient;
};

/**
 * Pure rename handler function that handles both files and folders
 * Updates local data immediately and persists to database
 */
export async function handleRename(
  { item, value }: RenameHandlerParams,
  { queryClient }: RenameHandlerDependencies
): Promise<void> {
  const itemData = data[item.getId()];
  if (!itemData) {
    console.warn('Item data not found for rename:', item.getId());
    return;
  }

  const originalName = itemData.name;

  // Update data immediately (optimistic update)
  itemData.name = value;

  try {
    // Persist to database
    const itemId = item.getId();
    const isFile = item.getItemData().isFile;
    const action = isFile ? renameFileAction : renameFolderAction;

    const result = await action(itemId, value);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      toast.success(`Renamed to ${value}`);
    } else {
      throw new Error(result.error || 'Failed to rename');
    }
  } catch (error) {
    // Revert on error
    itemData.name = originalName;
    toast.error(error instanceof Error ? error.message : 'Failed to rename');
    // Revert by invalidating queries to refetch original data
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
  }
}
