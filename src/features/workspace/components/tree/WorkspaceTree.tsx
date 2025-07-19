'use client';

import React, { Fragment } from 'react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  insertItemsAtTarget,
  keyboardDragAndDropFeature,
  removeItemsFromParents,
  renamingFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  expandAllFeature,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useWorkspaceTree } from '../../hooks/use-workspace-tree';
import { workspaceQueryKeys } from '../../lib/query-keys';
import {
  updateItemOrderAction,
  moveItemAction,
  renameFileAction,
  renameFolderAction,
  batchMoveItemsAction,
} from '../../lib/actions';
import {
  data,
  dataLoader,
  populateFromDatabase,
  insertNewItem,
  deleteItemsFromTree,
  type WorkspaceTreeItem,
} from '../../lib/tree-data';
import { ContentLoader } from '@/components/ui';
import { BatchOperationModal } from '../modals/batch-operation-modal';
import type {
  BatchOperationItem,
  BatchOperationProgress,
} from '../modals/batch-operation-modal';
import '../../styles/workspace-tree.css';

// Import tree UI components
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import type {
  DragTarget,
  ItemInstance,
  FeatureImplementation,
} from '@headless-tree/core';

// Custom click behavior - only allow expand/collapse via chevron clicks
const customClickBehavior: FeatureImplementation = {
  itemInstance: {
    getProps: ({ tree, item, prev }) => ({
      ...prev?.(),
      onClick: (e: MouseEvent) => {
        // Handle selection only - no expand/collapse
        if (e.shiftKey) {
          item.selectUpTo(e.ctrlKey || e.metaKey);
        } else if (e.ctrlKey || e.metaKey) {
          item.toggleSelect();
        } else {
          tree.setSelectedItems([item.getItemMeta().itemId]);
        }

        item.setFocused();
      },
    }),
  },
};

// Remove hardcoded virtual root - use actual workspace ID

interface WorkspaceTreeProps {
  onTreeReady?: (tree: any) => void;
  searchQuery?: string;
  onRootClick?: () => void;
  onRootDrop?: (dataTransfer: DataTransfer) => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedItems: string[]) => void;
}

// Simple approach - directly use exported data and loader

export default function WorkspaceTree({
  onTreeReady,
  searchQuery = '',
  onRootClick,
  onRootDrop,
  selectedItems = [],
  onSelectionChange,
}: WorkspaceTreeProps) {
  const { data: workspaceData, isLoading, error } = useWorkspaceTree();
  const queryClient = useQueryClient();

  // Get the actual workspace root ID
  const rootId = workspaceData?.workspace?.id;

  // Track search state and preserve expanded items
  const [isSearching, setIsSearching] = React.useState(false);
  const [preSearchExpandedItems, setPreSearchExpandedItems] = React.useState<
    string[]
  >([]);

  // Force re-render state
  const [forceRender, setForceRender] = React.useState(0);

  // Batch operation modal state
  const [batchMoveModal, setBatchMoveModal] = React.useState({
    isOpen: false,
    items: [] as BatchOperationItem[],
    targetFolder: undefined as string | undefined,
    targetParentId: undefined as string | undefined,
    progress: undefined as BatchOperationProgress | undefined,
    isProcessing: false,
    // Store pending tree state changes for revert on cancel
    pendingMove: undefined as
      | {
          parentId: string;
          oldChildren: string[];
          newChildren: string[];
        }
      | undefined,
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
        const result = await batchMoveItemsAction(movedItems, parentId);
        if (result.success) {
          await queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
          toast.success('Item moved successfully');
          // Clear selection after successful move
          onSelectionChange?.([]);
        } else {
          toast.error(result.error || 'Failed to move item');
          await queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
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

  // Function to handle single item moves
  const handleSingleMove = React.useCallback(
    async (
      itemId: string,
      parentId: string,
      oldChildren: string[],
      newChildren: string[]
    ) => {
      try {
        const result = await batchMoveItemsAction([itemId], parentId);
        if (result.success) {
          console.log('✅ Single item move completed successfully');
          toast.success('Item moved successfully');
          onSelectionChange?.([]);
          // Also clear tree internal selection state
          tree.setSelectedItems([]);

          // Don't rebuild tree immediately - wait for database sync to complete
          console.log(
            '📡 Letting realtime subscription handle single move database updates and tree rebuild'
          );
        } else {
          // Revert on failure
          const parentData = data[parentId];
          if (parentData) {
            parentData.children = oldChildren;
          }
          tree.rebuildTree(); // Trigger tree re-render
          toast.error(result.error || 'Failed to move item');
          await queryClient.invalidateQueries({
            queryKey: workspaceQueryKeys.tree(),
          });
        }
      } catch (error) {
        // Revert on error
        const parentData = data[parentId];
        if (parentData) {
          parentData.children = oldChildren;
        }
        tree.rebuildTree(); // Trigger tree re-render
        toast.error('Failed to move item');
        await queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.tree(),
        });
      }
    },
    [queryClient, onSelectionChange]
  );

  // Function to execute the batch move operation
  const executeBatchMove = React.useCallback(async () => {
    if (!batchMoveModal.items.length) return;

    setBatchMoveModal(prev => ({ ...prev, isProcessing: true }));

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
        batchMoveModal.targetParentId || rootId
      );

      if (result.success) {
        // UI already updated optimistically, just mark as complete

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

        console.log(
          '✅ Batch move completed successfully, waiting for database sync'
        );

        // Don't rebuild tree immediately - wait for database sync to complete
        // The tree will rebuild automatically when populateFromDatabase runs
        console.log(
          '📡 Letting realtime subscription handle database updates and tree rebuild'
        );

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
        // Also clear tree internal selection state
        tree.setSelectedItems([]);
      } else {
        // Revert UI changes on database failure
        if (batchMoveModal.pendingMove) {
          const parentData = data[batchMoveModal.pendingMove.parentId];
          if (parentData) {
            parentData.children = batchMoveModal.pendingMove.oldChildren;
          }
        }
        tree.rebuildTree(); // Trigger tree re-render
        setBatchMoveModal(prev => ({
          ...prev,
          progress: prev.progress
            ? {
                ...prev.progress,
                failed: [result.error || 'Failed to move items'],
              }
            : undefined,
        }));
        throw new Error(result.error || 'Failed to move items');
      }
    } catch (error) {
      // Revert UI changes on error
      if (batchMoveModal.pendingMove) {
        const parentData = data[batchMoveModal.pendingMove.parentId];
        if (parentData) {
          parentData.children = batchMoveModal.pendingMove.oldChildren;
        }
      }
      tree.rebuildTree(); // Trigger tree re-render
      toast.error(
        error instanceof Error ? error.message : 'Failed to move items'
      );
      await queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
      });
    } finally {
      // Stop processing but keep modal open for user to see results
      setBatchMoveModal(prev => ({
        ...prev,
        isProcessing: false,
      }));
    }
  }, [
    batchMoveModal.items,
    batchMoveModal.targetParentId,
    queryClient,
    rootId,
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
  ]);

  // Handler for dropping foreign drag objects (like adding new folders)
  const onDropForeignDragObject = (
    dataTransfer: DataTransfer,
    target: DragTarget<WorkspaceTreeItem>
  ) => {
    const newId = insertNewItem(dataTransfer.getData('text/plain'));
    insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
      const itemData = data[item.getId()];
      if (itemData) {
        itemData.children = newChildrenIds;
      }
    });
  };

  // Handler for completing foreign drop
  const onCompleteForeignDrop = (items: ItemInstance<WorkspaceTreeItem>[]) =>
    removeItemsFromParents(items, (item, newChildren) => {
      item.getItemData().children = newChildren;
    });

  // Rename handler - exactly like library example
  const onRename = (item: ItemInstance<WorkspaceTreeItem>, value: string) => {
    const itemData = data[item.getId()];
    if (itemData) {
      itemData.name = value;
    }

    // Persist to database
    const itemId = item.getId();
    const isFile = item.getItemData().isFile;
    const action = isFile ? renameFileAction : renameFolderAction;

    action(itemId, value).then(result => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
        toast.success(`Renamed to ${value}`);
      } else {
        toast.error(result.error || 'Failed to rename');
        // Revert on error
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      }
    });
  };

  // Get CSS class for items - exactly like library example
  const getCssClass = (item: ItemInstance<WorkspaceTreeItem>) =>
    cn('treeitem', {
      focused: item.isFocused(),
      expanded: item.isExpanded(),
      selected: item.isSelected(),
      folder: item.isFolder(),
      drop: item.isDragTarget(),
      searchmatch: item.isMatchingSearch(),
    });

  // Initialize tree - using actual workspace ID as root
  const tree = useTree<WorkspaceTreeItem>({
    initialState: {
      expandedItems: rootId ? [rootId] : [],
      selectedItems: [],
    },
    rootItemId: rootId || '',
    getItemName: item => item.getItemData()?.name || 'Unknown',
    isItemFolder: item => !item.getItemData()?.isFile,
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildren) => {
      const parentId = parentItem.getId();
      const parentData = data[parentId];

      if (parentData) {
        const oldChildren = [...(parentData.children || [])];

        // Apply the change immediately (optimistic update)
        parentData.children = newChildren;

        // Find items that are new to this parent (moved from elsewhere)
        const movedItems = newChildren.filter(
          childId => !oldChildren.includes(childId)
        );

        if (movedItems.length > 0) {
          console.log('🚀 Detected item move:', {
            movedItems,
            parentId,
            oldChildren,
            newChildren,
            isMultiple: movedItems.length > 1,
          });

          // Handle moves
          if (movedItems.length > 1) {
            console.log('📦 Handling batch move for multiple items');
            // Multiple items - show confirmation modal and handle async operation
            handleBatchMove(movedItems, parentId, oldChildren, newChildren);
          } else if (movedItems[0]) {
            console.log('📄 Handling single item move');
            // Single item - handle async operation directly
            handleSingleMove(movedItems[0], parentId, oldChildren, newChildren);
          }
        } else {
          // Handle reordering within same parent
          updateItemOrderAction(parentId, newChildren).then(result => {
            if (!result.success) {
              // Revert on failure
              parentData.children = oldChildren;
              tree.rebuildTree(); // Trigger tree re-render
              toast.error(result.error || 'Failed to update order');
              queryClient.invalidateQueries({
                queryKey: workspaceQueryKeys.tree(),
              });
            }
          });
        }
      }
    }),
    onRename,
    onDropForeignDragObject,
    onCompleteForeignDrop,
    createForeignDragObject: items => ({
      format: 'text/plain',
      data: items.map(item => item.getId()).join(','),
    }),
    canDropForeignDragObject: (_, target) => target.item.isFolder(),
    indent: 20,
    dataLoader,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      renamingFeature,
      searchFeature,
      expandAllFeature,
      customClickBehavior,
    ],
  });

  // Sync database data to tree data store
  React.useEffect(() => {
    console.log('🔄 Database sync effect triggered:', {
      hasWorkspaceData: !!workspaceData,
      folderCount: workspaceData?.folders?.length || 0,
      fileCount: workspaceData?.files?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (!workspaceData) return;

    console.log(
      '📊 Before populateFromDatabase - current tree data keys:',
      Object.keys(data)
    );

    const dataUpdated = populateFromDatabase(
      workspaceData.workspace,
      workspaceData.folders || [],
      workspaceData.files || []
    );

    console.log(
      '📊 After populateFromDatabase - new tree data keys:',
      Object.keys(data)
    );
    console.log('📊 Full tree data structure:', JSON.stringify(data, null, 2));

    // Rebuild tree after database sync to ensure UI reflects latest data
    if (dataUpdated && tree) {
      console.log('🔄 Triggering tree rebuild after database sync');
      tree.rebuildTree();
    }
  }, [workspaceData, tree]);

  // Handle search - let tree manage its own state
  React.useEffect(() => {
    if (!tree) return;

    const hasSearchQuery = searchQuery.trim().length > 0;

    // Apply the search to the tree's internal state
    const searchProps = tree.getSearchInputElementProps();
    if (searchProps?.onChange) {
      const syntheticEvent = {
        target: { value: searchQuery },
      } as React.ChangeEvent<HTMLInputElement>;
      searchProps.onChange(syntheticEvent);
    }

    // Handle expand/collapse based on search state
    if (hasSearchQuery && !isSearching) {
      // Starting search - save current state and expand all
      const currentExpanded = tree.getState()?.expandedItems || [];
      setPreSearchExpandedItems(currentExpanded);
      setIsSearching(true);
      tree.expandAll();
    } else if (!hasSearchQuery && isSearching) {
      // Ending search - restore previous expanded state
      setIsSearching(false);
      // tree.setState(prevState => ({
      //   ...prevState,
      //   expandedItems: preSearchExpandedItems,
      // }));
      tree.collapseAll();
    }
  }, [searchQuery, tree, isSearching]);

  // Track selection changes and notify parent
  React.useEffect(() => {
    if (tree && onSelectionChange) {
      const currentSelection = tree
        .getSelectedItems()
        .map(item => item.getId());
      onSelectionChange(currentSelection);
    }
  }, [tree?.getState?.()?.selectedItems, onSelectionChange]);

  // Notify parent when tree is ready
  React.useEffect(() => {
    if (tree && onTreeReady) {
      // Add custom method for adding folders programmatically
      const addFolder = (name: string, parentId?: string) => {
        const targetId = parentId || rootId;
        const targetItem = tree.getItemInstance(targetId);
        if (targetItem && rootId) {
          const newId = insertNewItem(name, false);
          const target: DragTarget<WorkspaceTreeItem> = {
            item: targetItem,
          };

          insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
            const itemData = data[item.getId()];
            if (itemData) {
              itemData.children = newChildrenIds;
            }
          });

          // Expand parent folder if it's not the workspace root
          if (targetId !== rootId) {
            targetItem.expand();
          }

          return newId;
        }
        return null;
      };

      // Add custom method for deleting items from tree
      const deleteItems = (itemIds: string[]) => {
        deleteItemsFromTree(itemIds);
        tree.rebuildTree();
      };

      const extendedTree = Object.assign(tree, { addFolder, deleteItems });
      onTreeReady(extendedTree);
    }
  }, [tree, onTreeReady, rootId]);

  // Loading state
  if (isLoading || !workspaceData) {
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
          Failed to load workspace
        </span>
      </div>
    );
  }

  // Empty state
  if (!workspaceData.folders?.length && !workspaceData.files?.length) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-sm text-muted-foreground'>
          No files or folders found. Create some to get started.
        </span>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      <div
        {...tree.getContainerProps()}
        className='tree flex-1 overflow-auto relative'
        onClick={e => {
          // Handle click on empty space - clear selection
          if (e.target === e.currentTarget) {
            tree.setSelectedItems([]);
            if (onRootClick) {
              onRootClick();
            }
          }
        }}
      >
        <AssistiveTreeDescription tree={tree} />

        {tree.getItems().map(item => {
          const itemId = item.getId();

          // Include all items - let the tree handle root normally

          return (
            <Fragment key={itemId}>
              {item.isRenaming() ? (
                <div
                  className='renaming-item'
                  style={{ marginLeft: `${item.getItemMeta().level * 20}px` }}
                >
                  <input
                    {...item.getRenameInputProps()}
                    className='px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary'
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  {...item.getProps()}
                  style={{ paddingLeft: `${item.getItemMeta().level * 20}px` }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5 flex-1 min-w-0',
                      getCssClass(item)
                    )}
                  >
                    {/* Expand/Collapse icon for folders */}
                    {item.isFolder() ? (
                      <span
                        className='flex-shrink-0 w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-muted/80 rounded'
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (item.isExpanded()) {
                            item.collapse();
                          } else {
                            item.expand();
                          }
                        }}
                      >
                        {item.isExpanded() ? (
                          <ChevronDown className='size-4 text-muted-foreground' />
                        ) : (
                          <ChevronRight className='size-4 text-muted-foreground' />
                        )}
                      </span>
                    ) : (
                      <span className='w-5' />
                    )}

                    {/* Folder/File icon */}
                    {item.isFolder() ? (
                      item.isExpanded() ? (
                        <FolderOpenIcon className='text-muted-foreground size-4 flex-shrink-0' />
                      ) : (
                        <FolderIcon className='text-muted-foreground size-4 flex-shrink-0' />
                      )
                    ) : (
                      <FileIcon className='text-muted-foreground size-4 flex-shrink-0' />
                    )}

                    {/* Item name */}
                    <span className='truncate'>{item.getItemName()}</span>
                  </div>
                </button>
              )}
            </Fragment>
          );
        })}

        <div style={tree.getDragLineStyle()} className='dragline' />
      </div>

      {/* Batch Move Modal */}
      <BatchOperationModal
        isOpen={batchMoveModal.isOpen}
        onClose={handleModalClose}
        operation='move'
        items={batchMoveModal.items}
        targetFolder={batchMoveModal.targetFolder || 'Unknown'}
        onConfirm={executeBatchMove}
        progress={batchMoveModal.progress}
        isProcessing={batchMoveModal.isProcessing}
      />
    </div>
  );
}
