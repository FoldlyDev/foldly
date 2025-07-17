'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  expandAllFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
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
import { enhancedBatchMoveItemsAction } from '../../lib/actions/enhanced-batch-actions';
import { useTreeOperationStatus } from '../../hooks/use-tree-operation-status';
import { TreeOperationOverlay } from '../loading/tree-operation-overlay';
import {
  showWorkspaceNotification,
  showWorkspaceError,
} from '@/features/notifications';

interface Item {
  name: string;
  children?: string[];
  isFile?: boolean;
}

const indent = 20;

function TreeContent({
  workspaceData,
  selectMode,
  onTreeReady,
  searchQuery,
  filterBy = 'all',
  sortBy = 'name',
  sortOrder = 'asc',
}: {
  workspaceData: any;
  selectMode: {
    isSelectMode: boolean;
    selectedItems: string[];
    selectedItemsCount: number;
    toggleSelectMode: () => void;
    enableSelectMode: () => void;
    disableSelectMode: () => void;
    toggleItemSelection: (itemId: string) => void;
    clearSelection: () => void;
    selectItem: (itemId: string) => void;
    deselectItem: (itemId: string) => void;
    isItemSelected: (itemId: string) => boolean;
  };
  onTreeReady?: (tree: any) => void;
  searchQuery?: string;
  filterBy?: FilterBy;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}) {
  const queryClient = useQueryClient();

  // Operation status management
  const {
    operationState,
    startOperation,
    setCompleting,
    completeOperation,
    failOperation,
    resetOperation,
    canInteract,
  } = useTreeOperationStatus();

  // Convert database data to tree format
  const treeData = useMemo(() => {
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
    setItems(treeData);
  }, [treeData]);

  // Create filtered items based on filterBy
  const filteredItems = useMemo(() => {
    if (filterBy === 'all') return items;

    const filtered: Record<string, Item> = {};

    // First pass: collect items that match the filter
    Object.entries(items).forEach(([id, item]) => {
      const shouldInclude = filterBy === 'files' ? item.isFile : !item.isFile;
      if (shouldInclude) {
        filtered[id] = { ...item };
      }
    });

    // Second pass: ensure parent folders are included for files
    if (filterBy === 'files') {
      Object.keys(filtered).forEach(id => {
        let currentId = id;
        while (currentId && currentId !== VIRTUAL_ROOT_ID) {
          // Find parent
          const parent = Object.entries(items).find(([_, item]) =>
            item.children?.includes(currentId)
          );
          if (parent) {
            const [parentId, parentItem] = parent;
            if (!filtered[parentId]) {
              filtered[parentId] = { ...parentItem, children: [] };
            }
            // Add this child to parent's filtered children
            const parentFiltered = filtered[parentId];
            if (
              parentFiltered &&
              !parentFiltered.children?.includes(currentId)
            ) {
              parentFiltered.children = [
                ...(parentFiltered.children || []),
                currentId,
              ];
            }
            currentId = parentId;
          } else {
            break;
          }
        }
      });
    }

    // Third pass: for folders filter, update children arrays
    if (filterBy === 'folders') {
      Object.entries(filtered).forEach(([id, item]) => {
        if (item?.children) {
          const filteredItem = filtered[id];
          if (filteredItem) {
            filteredItem.children = item.children.filter(
              childId => childId in filtered
            );
          }
        }
      });
    }

    // Always include the root
    if (!filtered[VIRTUAL_ROOT_ID] && items[VIRTUAL_ROOT_ID]) {
      filtered[VIRTUAL_ROOT_ID] = {
        ...items[VIRTUAL_ROOT_ID],
        children:
          items[VIRTUAL_ROOT_ID].children?.filter(id => id in filtered) || [],
      };
    }

    // Apply sorting to children arrays
    const sortChildren = (children: string[]): string[] => {
      return children.sort((a, b) => {
        const aItem = filtered[a];
        const bItem = filtered[b];

        if (!aItem || !bItem) return 0;

        // Folders first, then files
        if (aItem.isFile !== bItem.isFile) {
          return aItem.isFile ? 1 : -1;
        }

        let comparison = 0;

        switch (sortBy) {
          case 'name':
            comparison = aItem.name.localeCompare(bItem.name);
            break;
          case 'date':
            // TODO: Add date field to items
            comparison = 0;
            break;
          case 'size':
            // TODO: Add size field to items
            comparison = 0;
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    };

    // Apply sorting to all children arrays
    Object.values(filtered).forEach(item => {
      if (item?.children && item.children.length > 0) {
        item.children = sortChildren(item.children);
      }
    });

    return filtered;
  }, [items, filterBy, sortBy, sortOrder]);

  // Store initial expanded items to reset when search is cleared
  const initialExpandedItems = [VIRTUAL_ROOT_ID];

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
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success notification
      const parentItem = filteredItems[variables.parentId];
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
      const parentItem = filteredItems[variables.parentId];
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
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success notification
      const movedItem = filteredItems[variables.nodeId];
      const targetItem = filteredItems[variables.targetId];
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
      const movedItem = filteredItems[variables.nodeId];
      const targetItem = filteredItems[variables.targetId];
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

  // Enhanced mutation for batch moving multiple items
  const batchMoveItemsMutation = useMutation({
    mutationFn: async ({
      nodeIds,
      targetId,
    }: {
      nodeIds: string[];
      targetId: string;
    }) => {
      // Start operation tracking
      startOperation('batch_move', nodeIds.length, 'Preparing batch move...');

      try {
        setCompleting('Finalizing batch move...');

        const result = await enhancedBatchMoveItemsAction(
          nodeIds,
          targetId === VIRTUAL_ROOT_ID ? 'root' : targetId
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to batch move items');
        }

        completeOperation();
        return result.data;
      } catch (error) {
        failOperation(error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the workspace tree
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });

      // Show success notification
      const targetItem = filteredItems[variables.targetId];
      const targetName =
        variables.targetId === VIRTUAL_ROOT_ID
          ? 'workspace root'
          : targetItem?.name;

      const itemCount = variables.nodeIds.length;
      showWorkspaceNotification('items_reordered', {
        itemName: `${itemCount} items`,
        itemType: 'folder',
        ...(targetName && { targetLocation: targetName }),
      });
    },
    onError: (error, variables) => {
      // Revert optimistic update
      setItems(treeData);

      // Show error notification
      const targetItem = filteredItems[variables.targetId];
      const targetName =
        variables.targetId === VIRTUAL_ROOT_ID
          ? 'workspace root'
          : targetItem?.name;

      const itemCount = variables.nodeIds.length;
      showWorkspaceError(
        'items_reordered',
        {
          itemName: `${itemCount} items`,
          itemType: 'folder',
          ...(targetName && { targetLocation: targetName }),
        },
        error instanceof Error ? error.message : 'Unknown error'
      );
    },
  });

  // Create a stable data structure that forces tree re-render
  const dataLoader = useMemo(
    () => ({
      getItem: (itemId: string) => {
        const item = filteredItems[itemId];
        if (!item) {
          return { name: 'Unknown', children: [], isFile: true };
        }
        return item;
      },
      getChildren: (itemId: string) => {
        const item = filteredItems[itemId];
        return item?.children ?? [];
      },
    }),
    [filteredItems]
  );

  // Force tree to recognize data changes by creating a new instance key
  const treeKey = useMemo(() => {
    // Include a hash of the actual item IDs to ensure key changes when data changes
    const itemIds = Object.keys(filteredItems).sort().join(',');
    return `${filterBy}-${sortBy}-${sortOrder}-${itemIds}`;
  }, [filterBy, sortBy, sortOrder, filteredItems]);

  // Tree state management - reset when filters change
  const [treeState, setTreeState] = useState<any>({
    expandedItems: [VIRTUAL_ROOT_ID],
    selectedItems: selectMode.isSelectMode ? selectMode.selectedItems : [],
  });

  // Reset tree state when filters change to force re-render
  useEffect(() => {
    setTreeState((prev: any) => ({
      ...prev,
      expandedItems: searchQuery ? prev.expandedItems : [VIRTUAL_ROOT_ID],
      // Force a state change to trigger re-render
      _filterKey: treeKey,
    }));
  }, [treeKey, searchQuery]);

  // Only initialize tree after we have data
  const tree = useTree<Item>({
    state: treeState,
    setState: setTreeState,
    indent,
    rootItemId: VIRTUAL_ROOT_ID,
    getItemName: item => item.getItemData().name,
    isItemFolder: item => {
      const itemData = item.getItemData();
      return !itemData.isFile && (itemData.children?.length ?? 0) >= 0;
    },
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      // Prevent drops during operations
      if (!canInteract) return;

      const parentId = parentItem.getId();
      const parentItemData = filteredItems[parentId];

      if (!parentItemData) return;

      // Disable select mode on drag/drop
      if (selectMode.isSelectMode) {
        selectMode.disableSelectMode();
      }

      // Optimistically update the UI first
      setItems(prevItems => {
        const updatedItems = { ...prevItems };
        if (updatedItems[parentId]) {
          updatedItems[parentId] = {
            ...updatedItems[parentId],
            children: newChildrenIds,
          };
        }
        return updatedItems;
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
        // This is a move operation - find the moved item(s)
        const movedItemIds = newChildrenIds.filter(
          id => !originalChildren.includes(id)
        );

        if (movedItemIds.length === 0) return;

        // Check if this is a batch move (multiple selected items being moved)
        const isBatchMove =
          selectMode.selectedItems.length > 1 &&
          movedItemIds.some(id => selectMode.selectedItems.includes(id));

        if (isBatchMove) {
          // Batch move all selected items
          batchMoveItemsMutation.mutate({
            nodeIds: selectMode.selectedItems,
            targetId: parentId,
          });
        } else {
          // Single item move
          const movedItemId = movedItemIds[0];
          if (movedItemId) {
            moveItemMutation.mutate({
              nodeId: movedItemId,
              targetId: parentId,
            });
          }
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
      expandAllFeature,
      searchFeature,
    ],
  });

  // Track if tree is ready
  const [isTreeReady, setIsTreeReady] = useState(false);

  // Notify parent when tree is ready
  useEffect(() => {
    if (tree && tree.getItems && typeof tree.getItems === 'function') {
      setIsTreeReady(true);
      if (onTreeReady) {
        onTreeReady(tree);
      }
    }
  }, [tree, onTreeReady]);

  // Sync select mode selections with tree state and handle clearing selections
  useEffect(() => {
    setTreeState((prev: any) => ({
      ...prev,
      selectedItems: selectMode.isSelectMode ? selectMode.selectedItems : [],
    }));
  }, [selectMode.isSelectMode, selectMode.selectedItems]);

  // Handle search using tree's built-in search feature
  useEffect(() => {
    if (!isTreeReady || !tree) {
      return;
    }

    // Use the tree's search feature directly
    const searchProps = tree.getSearchInputElementProps();
    if (searchProps?.onChange) {
      // Defer the search update to avoid render-phase updates
      const timeoutId = setTimeout(() => {
        const syntheticEvent = {
          target: { value: searchQuery || '' },
        } as React.ChangeEvent<HTMLInputElement>;
        searchProps.onChange(syntheticEvent);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isTreeReady, tree]);

  // Manage expanded items separately to avoid render-phase updates
  useEffect(() => {
    if (!isTreeReady || !tree) return;

    if (searchQuery && searchQuery.length > 0) {
      // Expand all items when searching
      const timeoutId = setTimeout(() => {
        const allItemIds = tree
          .getItems()
          .filter(item => item.isFolder())
          .map(item => item.getId());
        setTreeState((prev: any) => ({
          ...prev,
          expandedItems: allItemIds,
        }));
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Reset to initial expanded state when search is cleared
      const timeoutId = setTimeout(() => {
        setTreeState((prev: any) => ({
          ...prev,
          expandedItems: initialExpandedItems,
        }));
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, isTreeReady, tree]);

  // Force complete re-mount when filters change
  if (!tree) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-sm text-muted-foreground'>Loading tree...</span>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col gap-2 *:first:grow'>
      <Tree key={treeKey} indent={indent} tree={tree}>
        <AssistiveTreeDescription tree={tree} />
        {(() => {
          const allItems = tree.getItems();
          const visibleItems = allItems.filter(item =>
            searchQuery ? item.isMatchingSearch() : true
          );

          if (searchQuery && visibleItems.length === 0) {
            return (
              <p className='px-3 py-4 text-center text-sm text-muted-foreground'>
                No items found for "{searchQuery}"
              </p>
            );
          }

          if (
            filterBy !== 'all' &&
            allItems.length === 1 &&
            allItems[0]?.getId() === VIRTUAL_ROOT_ID
          ) {
            return (
              <p className='px-3 py-4 text-center text-sm text-muted-foreground'>
                No {filterBy} found
              </p>
            );
          }

          return allItems
            .map(item => {
              const itemData = item.getItemData();
              const isFolder = !itemData.isFile;
              const itemId = item.getId();
              const showCheckboxes = selectMode.isSelectMode;
              const isSelected = selectMode.isItemSelected(itemId);

              // Check if this folder has any selected children (for partial selection state)
              let hasSelectedChildren = false;
              if (isFolder && !isSelected) {
                const checkDescendants = (id: string): boolean => {
                  const itemData = filteredItems[id];
                  if (itemData?.children) {
                    for (const childId of itemData.children) {
                      if (
                        selectMode.isItemSelected(childId) ||
                        checkDescendants(childId)
                      ) {
                        return true;
                      }
                    }
                  }
                  return false;
                };
                hasSelectedChildren = checkDescendants(itemId);
              }

              const isMatchingSearch = searchQuery
                ? item.isMatchingSearch()
                : true;

              // Skip rendering items that don't match search
              if (!isMatchingSearch && searchQuery) {
                return null;
              }

              return (
                <TreeItem key={item.getId()} item={item}>
                  <TreeItemLabel
                    className='before:bg-background relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10'
                    onClick={_e => {
                      // Clear selection and exit select mode when item is clicked (but not when checkbox is clicked)
                      if (selectMode.isSelectMode) {
                        selectMode.disableSelectMode();
                      }
                    }}
                  >
                    <div className='flex items-center gap-2 w-full'>
                      {showCheckboxes && (
                        <div
                          className='flex-shrink-0 p-1 -m-1 rounded hover:bg-muted/50 transition-colors'
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();

                            // If this is a folder, we need to handle selecting all children
                            if (isFolder) {
                              const getAllDescendants = (
                                id: string
                              ): string[] => {
                                const result: string[] = [id];
                                const itemData = filteredItems[id];
                                if (itemData?.children) {
                                  itemData.children.forEach(childId => {
                                    result.push(...getAllDescendants(childId));
                                  });
                                }
                                return result;
                              };

                              const allIds = getAllDescendants(itemId);
                              const allSelected = allIds.every(id =>
                                selectMode.isItemSelected(id)
                              );

                              allIds.forEach(id => {
                                if (allSelected) {
                                  selectMode.deselectItem(id);
                                } else {
                                  selectMode.selectItem(id);
                                }
                              });
                            } else {
                              selectMode.toggleItemSelection(itemId);
                            }
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className='text-blue-600 size-4 cursor-pointer' />
                          ) : hasSelectedChildren ? (
                            <MinusSquare className='text-blue-600 size-4 cursor-pointer' />
                          ) : (
                            <Square className='text-muted-foreground size-4 cursor-pointer hover:text-foreground transition-colors' />
                          )}
                        </div>
                      )}
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {isFolder ? (
                          item.isExpanded() ? (
                            <FolderOpenIcon className='text-muted-foreground pointer-events-none size-4 flex-shrink-0' />
                          ) : (
                            <FolderIcon className='text-muted-foreground pointer-events-none size-4 flex-shrink-0' />
                          )
                        ) : (
                          <FileIcon className='text-muted-foreground pointer-events-none size-4 flex-shrink-0' />
                        )}
                        <span className='truncate'>{item.getItemName()}</span>
                      </div>
                    </div>
                  </TreeItemLabel>
                </TreeItem>
              );
            })
            .filter(Boolean);
        })()}
        <TreeDragLine />
      </Tree>

      <p
        aria-live='polite'
        role='region'
        className='text-muted-foreground mt-2 text-xs'
      >
        {(updateOrderMutation.isPending ||
          moveItemMutation.isPending ||
          batchMoveItemsMutation.isPending) && (
          <span className='ml-2 text-blue-600'>Updating...</span>
        )}
      </p>

      {/* Loading Overlay - Replaces tree during operations */}
      <TreeOperationOverlay
        operationState={operationState}
        onCancel={resetOperation}
      />
    </div>
  );
}

type FilterBy = 'all' | 'files' | 'folders';
type SortBy = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

export default function WorkspaceTree({
  selectMode,
  onTreeReady,
  searchQuery,
  filterBy = 'all',
  sortBy = 'name',
  sortOrder = 'asc',
}: {
  selectMode: {
    isSelectMode: boolean;
    selectedItems: string[];
    selectedItemsCount: number;
    toggleSelectMode: () => void;
    enableSelectMode: () => void;
    disableSelectMode: () => void;
    toggleItemSelection: (itemId: string) => void;
    clearSelection: () => void;
    selectItem: (itemId: string) => void;
    deselectItem: (itemId: string) => void;
    isItemSelected: (itemId: string) => boolean;
  };
  onTreeReady?: (tree: any) => void;
  searchQuery?: string;
  filterBy?: FilterBy;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}) {
  const { data: workspaceData, isLoading, error } = useWorkspaceTree();

  // Create a stable key for TreeContent to force remount when data changes significantly
  const treeContentKey = useMemo(() => {
    if (!workspaceData) return 'empty';

    const foldersCount = workspaceData.folders?.length || 0;
    const filesCount = workspaceData.files?.length || 0;
    const workspaceId = workspaceData.workspace?.id || 'unknown';

    // Include filter and sort in key to force complete re-mount
    return `tree-${workspaceId}-${foldersCount}-${filesCount}-${filterBy}-${sortBy}-${sortOrder}`;
  }, [workspaceData, filterBy, sortBy, sortOrder]);

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

  // Force TreeContent remount with key when data changes significantly
  // Use a more aggressive key that includes filter parameters
  const contentKey = `${treeContentKey}-${filterBy}-${sortBy}-${sortOrder}`;

  return (
    <TreeContent
      key={contentKey}
      workspaceData={workspaceData}
      selectMode={selectMode}
      {...(onTreeReady && { onTreeReady })}
      {...(searchQuery && { searchQuery })}
      filterBy={filterBy}
      sortBy={sortBy}
      sortOrder={sortOrder}
    />
  );
}
