import { QueryClient } from '@tanstack/react-query';
import { renameFileAction, renameFolderAction } from '../../lib/actions';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { data, type WorkspaceTreeItem } from '../../lib/tree-data';
import type { ItemInstance } from '@headless-tree/core';
import { eventBus, NotificationEventType } from '@/features/notifications/core';

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
  const itemId = item.getId();
  const isFile = item.getItemData().isFile;

  // Update data immediately (optimistic update)
  itemData.name = value;

  try {
    // Persist to database
    const action = isFile ? renameFileAction : renameFolderAction;

    const result = await action(itemId, value);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      
      // Emit appropriate success event based on item type
      if (isFile) {
        eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS, {
          fileId: itemId,
          fileName: value,
        });
      } else {
        eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS, {
          folderId: itemId,
          folderName: value,
        });
      }
    } else {
      throw new Error(result.error || 'Failed to rename');
    }
  } catch (error) {
    // Revert on error
    itemData.name = originalName;
    
    // Emit generic error event for rename failures
    if (isFile) {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR, {
        fileId: itemId,
        fileName: originalName,
        error: error instanceof Error ? error.message : 'Failed to rename file',
      });
    } else {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: itemId,
        folderName: originalName,
        error: error instanceof Error ? error.message : 'Failed to rename folder',
      });
    }
    // Revert by invalidating queries to refetch original data
    queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
  }
}
