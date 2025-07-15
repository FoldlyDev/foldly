'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import { FolderIcon, FolderOpenIcon, FileIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
} from '@/components/file-tree/tree';
import { useWorkspaceTree } from '../../hooks/use-workspace-tree';
import {
  createWorkspaceTreeData,
  VIRTUAL_ROOT_ID,
} from '@/lib/utils/workspace-tree-utils';
import { ContentLoader } from '@/components/ui';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { updateItemOrderAction, moveItemAction } from '../../lib/actions';
import {
  showWorkspaceNotification,
  showWorkspaceError,
} from '@/features/notifications';
import { WorkspaceTreeSelectionProvider } from '../providers/workspace-tree-selection-provider';

interface Item {
  name: string;
  children?: string[];
  isFile?: boolean;
}

const indent = 20;

function TreeContent({ workspaceData }: { workspaceData: any }) {
  const queryClient = useQueryClient();

  // Convert database data to tree format
  const treeData = useMemo(() => {
    console.log('🔄 TreeContent: Creating treeData from workspaceData:', {
      folders: workspaceData.folders?.length || 0,
      files: workspaceData.files?.length || 0,
      workspaceName: workspaceData.workspace?.name,
    });

    return createWorkspaceTreeData(
      workspaceData.folders || [],
      workspaceData.files || [],
      workspaceData.workspace?.name || 'Workspace'
    );
  }, [workspaceData]);

  // State for items that can be updated by drag and drop
  const [items, setItems] = useState<Record<string, Item>>(treeData);

  // Update items when treeData changes
  useEffect(() => {
    console.log('🔄 TreeContent: treeData changed, updating items:', {
      oldItemsCount: Object.keys(items).length,
      newTreeDataCount: Object.keys(treeData).length,
      newTreeData: treeData,
    });
    setItems(treeData);
  }, [treeData]);

  // Mutation for updating item order (reordering within same parent)
  const updateOrderMutation = useMutation({
    mutationFn: async ({
      parentId,
      newChildrenIds,
    }: {
      parentId: string;
      newChildrenIds: string[];
    }) => {
      const result = await updateItemOrderAction(parentId, newChildrenIds);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update item order');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success notification
      const parentItem = items[variables.parentId];
      showWorkspaceNotification('items_reordered', {
        itemName: 'Items',
        itemType: 'folder',
        targetLocation: parentItem?.name || 'workspace',
      });
    },
    onError: (error, variables) => {
      // Revert optimistic update
      setItems(treeData);

      // Show error notification
      const parentItem = items[variables.parentId];
      showWorkspaceError(
        'items_reordered',
        {
          itemName: 'Items',
          itemType: 'folder',
          targetLocation: parentItem?.name || 'workspace',
        },
        error instanceof Error ? error.message : 'Unknown error'
      );
    },
  });

  // Mutation for moving items (moving to different parent)
  const moveItemMutation = useMutation({
    mutationFn: async ({
      nodeId,
      targetId,
    }: {
      nodeId: string;
      targetId: string;
    }) => {
      const result = await moveItemAction(
        nodeId,
        targetId === VIRTUAL_ROOT_ID ? 'root' : targetId
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to move item');
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success notification
      const movedItem = items[variables.nodeId];
      const targetItem = items[variables.targetId];
      const isFile = movedItem?.isFile;
      const targetName =
        variables.targetId === VIRTUAL_ROOT_ID
          ? 'workspace root'
          : targetItem?.name;

      showWorkspaceNotification(isFile ? 'file_moved' : 'folder_moved', {
        itemName: movedItem?.name || 'Item',
        itemType: isFile ? 'file' : 'folder',
        ...(targetName && { targetLocation: targetName }),
      });
    },
    onError: (error, variables) => {
      // Revert optimistic update
      setItems(treeData);

      // Show error notification
      const movedItem = items[variables.nodeId];
      const targetItem = items[variables.targetId];
      const isFile = movedItem?.isFile;
      const targetName =
        variables.targetId === VIRTUAL_ROOT_ID
          ? 'workspace root'
          : targetItem?.name;

      showWorkspaceError(
        isFile ? 'file_moved' : 'folder_moved',
        {
          itemName: movedItem?.name || 'Item',
          itemType: isFile ? 'file' : 'folder',
          ...(targetName && { targetLocation: targetName }),
        },
        error instanceof Error ? error.message : 'Unknown error'
      );
    },
  });

  // Memoize dataLoader to ensure it updates when items change
  const dataLoader = useMemo(
    () => ({
      getItem: (itemId: string) => {
        const item = items[itemId];
        if (!item) {
          console.warn(`Item with id "${itemId}" not found`);
          return { name: 'Unknown', children: [], isFile: true };
        }
        return item;
      },
      getChildren: (itemId: string) => {
        const item = items[itemId];
        return item?.children ?? [];
      },
    }),
    [items]
  );

  // Only initialize tree after we have data
  const tree = useTree<Item>({
    initialState: {
      expandedItems: [VIRTUAL_ROOT_ID],
      selectedItems: [],
    },
    indent,
    rootItemId: VIRTUAL_ROOT_ID,
    getItemName: item => item.getItemData().name,
    isItemFolder: item => {
      const itemData = item.getItemData();
      return !itemData.isFile && (itemData.children?.length ?? 0) >= 0;
    },
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      const parentId = parentItem.getId();
      const parentItemData = items[parentId];

      if (!parentItemData) return;

      // Optimistically update the UI first
      setItems(prevItems => {
        return {
          ...prevItems,
          [parentId]: {
            ...parentItemData,
            children: newChildrenIds,
          },
        };
      });

      // Determine if this is a reorder or move operation
      const originalChildren = treeData[parentId]?.children || [];
      const isReorder =
        originalChildren.length === newChildrenIds.length &&
        originalChildren.every(id => newChildrenIds.includes(id));

      if (isReorder) {
        // This is a reorder operation within the same parent
        updateOrderMutation.mutate({ parentId, newChildrenIds });
      } else {
        // This is a move operation - find the moved item
        const movedItemId = newChildrenIds.find(
          id => !originalChildren.includes(id)
        );
        if (movedItemId) {
          moveItemMutation.mutate({ nodeId: movedItemId, targetId: parentId });
        }
      }
    }),
    dataLoader,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });

  console.log('🌲 TreeContent: Tree initialized with items:', {
    itemsCount: Object.keys(items).length,
    treeItemsCount: tree.getItems().length,
  });

  return (
    <WorkspaceTreeSelectionProvider tree={tree} items={items}>
      <div className='flex h-full flex-col gap-2 *:first:grow'>
        <Tree indent={indent} tree={tree}>
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map(item => {
            const itemData = item.getItemData();
            const isFolder = !itemData.isFile;

            return (
              <TreeItem key={item.getId()} item={item}>
                <TreeItemLabel>
                  <span className='flex items-center gap-2'>
                    {isFolder ? (
                      item.isExpanded() ? (
                        <FolderOpenIcon className='text-muted-foreground pointer-events-none size-4' />
                      ) : (
                        <FolderIcon className='text-muted-foreground pointer-events-none size-4' />
                      )
                    ) : (
                      <FileIcon className='text-muted-foreground pointer-events-none size-4' />
                    )}
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            );
          })}
          <TreeDragLine />
        </Tree>

        <p
          aria-live='polite'
          role='region'
          className='text-muted-foreground mt-2 text-xs'
        >
          Tree with multi-select and drag and drop ∙{' '}
          <a
            href='https://headless-tree.lukasbach.com'
            className='hover:text-foreground underline'
            target='_blank'
            rel='noopener noreferrer'
          >
            API
          </a>
          {(updateOrderMutation.isPending || moveItemMutation.isPending) && (
            <span className='ml-2 text-blue-600'>Updating...</span>
          )}
        </p>
      </div>
    </WorkspaceTreeSelectionProvider>
  );
}

export default function WorkspaceTree() {
  const {
    data: workspaceData,
    isLoading,
    error,
    dataUpdatedAt,
    isFetching,
  } = useWorkspaceTree();

  // Add debugging for query state
  console.log('🌳 WorkspaceTree: Query state:', {
    isLoading,
    isFetching,
    hasData: !!workspaceData,
    dataUpdatedAt: new Date(dataUpdatedAt || 0).toISOString(),
    foldersCount: workspaceData?.folders?.length || 0,
    filesCount: workspaceData?.files?.length || 0,
  });

  // Create a stable key for TreeContent to force remount when data changes significantly
  const treeContentKey = useMemo(() => {
    if (!workspaceData) return 'empty';

    const foldersCount = workspaceData.folders?.length || 0;
    const filesCount = workspaceData.files?.length || 0;
    const workspaceId = workspaceData.workspace?.id || 'unknown';

    return `tree-${workspaceId}-${foldersCount}-${filesCount}`;
  }, [workspaceData]);

  // Loading state
  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <ContentLoader className='w-6 h-6' />
        <span className='ml-2 text-sm text-muted-foreground'>
          Loading workspace...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-sm text-destructive'>
          Failed to load workspace:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </span>
      </div>
    );
  }

  // Empty state
  if (
    !workspaceData ||
    (workspaceData.folders.length === 0 && workspaceData.files.length === 0)
  ) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-sm text-muted-foreground'>
          No files or folders found. Create some to get started.
        </span>
      </div>
    );
  }

  console.log('🔑 WorkspaceTree: Using treeContentKey:', treeContentKey);

  // Force TreeContent remount with key when data changes significantly
  return <TreeContent key={treeContentKey} workspaceData={workspaceData} />;
}
