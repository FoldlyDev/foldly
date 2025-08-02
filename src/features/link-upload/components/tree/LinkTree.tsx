'use client';

import React, { Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  expandAllFeature,
  type ItemInstance,
  type DragTarget,
  type TreeInstance,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import { cn } from '@/lib/utils';

import { useLinkTree } from '../../hooks/use-link-tree';
import { useLinkTreeHandlers } from '../../hooks/use-link-tree-handlers';
import { useLinkBatchOperations } from '../../hooks/use-link-batch-operations';
import { useLinkTreeSearch } from '../../hooks/use-link-tree-search';
import {
  handleLinkDrop,
  handleLinkRename,
  handleLinkDropForeignDragObject,
  handleLinkCompleteForeignDrop,
  createLinkForeignDragObject,
  canLinkDropForeignDragObject,
} from '../../handlers';
import {
  data,
  dataLoader,
  populateFromDatabase,
  getDragOperationActive,
  mergeStagedItemsWithTree,
  type LinkTreeItem,
} from '../../lib/tree-data';
import { useStagingStore } from '../../stores/staging-store';
import { useQueryClient } from '@tanstack/react-query';
import { BatchOperationModal } from '../modals/batch-operation-modal';
import { DragPreview, useDragPreview } from './DragPreview';
import '../../styles/link-tree.css';
import type { LinkWithOwner } from '../../types';

// Import tree UI components
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  ChevronRight,
  ChevronDown,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { downloadFileAction } from '../../lib/actions/download-file';

import type { FeatureImplementation } from '@headless-tree/core';

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

interface LinkTreeProps {
  linkData: LinkWithOwner;
  onTreeReady?: (
    tree: TreeInstance<LinkTreeItem> & {
      addFolder: (name: string, parentId?: string) => string | null;
      deleteItems: (itemIds: string[]) => void;
      rebuildTree: () => void;
    }
  ) => void;
  searchQuery?: string;
  onRootClick?: () => void;
  onRootDrop?: (dataTransfer: DataTransfer) => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedItems: string[]) => void;
}

export default function LinkTree({
  linkData,
  onTreeReady,
  searchQuery = '',
  onRootClick,
  onSelectionChange,
}: LinkTreeProps) {
  const { data: linkTreeData, error } = useLinkTree(linkData.id);
  
  // Get staging data with version for proper re-render tracking
  const { stagedFiles, stagedFolders, version } = useStagingStore();
  
  // Separate staged items from database items for grouped display
  const [stagedItemIds, setLocalStagedItemIds] = React.useState<Set<string>>(new Set());

  // Get the actual link root ID
  const rootId = linkData.id;

  // Get CSS class for items - exactly like workspace tree
  const getCssClass = (item: ItemInstance<LinkTreeItem>) =>
    cn('treeitem', {
      focused: item.isFocused(),
      expanded: item.isExpanded(),
      selected: item.isSelected(),
      folder: item.isFolder(),
      drop: item.isDragTarget(),
      'drop-above': item.isDragTargetAbove?.(),
      'drop-below': item.isDragTargetBelow?.(),
      searchmatch: item.isMatchingSearch(),
    });

  const queryClient = useQueryClient();

  // Get drag preview configuration
  const dragPreviewConfig = useDragPreview();

  // Initialize tree with inline handlers to avoid circular dependencies
  const tree: TreeInstance<LinkTreeItem> = useTree<LinkTreeItem>({
    initialState: {
      expandedItems: rootId ? [rootId] : [],
      selectedItems: [],
    },
    rootItemId: rootId || '',
    getItemName: (item: ItemInstance<LinkTreeItem>) =>
      item.getItemData()?.name || 'Unknown',
    isItemFolder: (item: ItemInstance<LinkTreeItem>) =>
      !item.getItemData()?.isFile,
    canReorder: true,
    reorderAreaPercentage: 0.4,

    // Custom drag preview
    ...dragPreviewConfig,

    // Use custom onDrop handler for link-specific operations
    onDrop: async (
      items: ItemInstance<LinkTreeItem>[],
      target: DragTarget<LinkTreeItem>
    ): Promise<void> => {
      return handleLinkDrop({ items, target }, { tree, queryClient, linkId: linkData.id });
    },

    onRename: (item: ItemInstance<LinkTreeItem>, value: string) => {
      return handleLinkRename({ item, value }, { queryClient, linkId: linkData.id });
    },

    onDropForeignDragObject: handleLinkDropForeignDragObject,
    onCompleteForeignDrop: handleLinkCompleteForeignDrop,
    createForeignDragObject: createLinkForeignDragObject,
    canDropForeignDragObject: canLinkDropForeignDragObject,

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

  // Initialize handlers for non-tree operations (add/delete items)
  const handlers = useLinkTreeHandlers({ tree, rootId, linkId: linkData.id });

  // Initialize other hooks after tree is created
  const batchOperations = useLinkBatchOperations({
    rootId,
    linkId: linkData.id,
    onSelectionChange,
    tree,
  });
  useLinkTreeSearch({ tree, searchQuery });

  // Sync database data and staging data to tree data store
  React.useEffect(() => {
    const isDragActive = getDragOperationActive();

    console.log('🔄 Link tree sync effect triggered:', {
      hasLinkTreeData: !!linkTreeData,
      folderCount: linkTreeData?.folders?.length || 0,
      fileCount: linkTreeData?.files?.length || 0,
      stagedFiles: stagedFiles.size,
      stagedFolders: stagedFolders.size,
      isDragActive,
      linkId: linkData.id,
      timestamp: new Date().toISOString(),
    });

    // Skip data sync during active drag operations to prevent race conditions
    if (!linkTreeData || isDragActive) {
      if (isDragActive) {
        console.log('🎯 Skipping link tree sync - drag operation in progress');
      }
      return;
    }

    console.log(
      '📊 Before populateFromDatabase - current tree data keys:',
      Object.keys(data)
    );

    const dataUpdated = populateFromDatabase(
      linkTreeData.link,
      linkTreeData.folders || [],
      linkTreeData.files || []
    );

    // Merge staging data after database data
    mergeStagedItemsWithTree(linkData.id, stagedFiles, stagedFolders);
    
    // Track staged item IDs for grouped display
    const newStagedIds = new Set<string>();
    stagedFiles.forEach((_, id) => newStagedIds.add(id));
    stagedFolders.forEach((_, id) => newStagedIds.add(id));
    setLocalStagedItemIds(newStagedIds);

    console.log(
      '📊 After populateFromDatabase + staging merge - new tree data keys:',
      Object.keys(data)
    );

    // Rebuild tree after database sync and staging merge
    // Only rebuild if tree is ready and data actually changed
    if (tree?.rebuildTree && (dataUpdated || stagedFiles.size > 0 || stagedFolders.size > 0)) {
      console.log('🔄 Triggering tree rebuild after database + staging sync');
      // Use requestAnimationFrame to avoid synchronous state updates
      requestAnimationFrame(() => {
        tree.rebuildTree();
      });
    }
  }, [linkTreeData, tree, linkData.id, stagedFiles, stagedFolders, version]); // Include version to detect Map changes

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
    if (tree && onTreeReady && handlers) {
      const extendedTree = Object.assign(tree, {
        addFolder: (name: string, parentId?: string): string | null =>
          handlers.addItem(name, parentId, false),
        deleteItems: (itemIds: string[]): void => handlers.deleteItems(itemIds),
        rebuildTree: tree.rebuildTree, // Pass the method reference directly, not a wrapper function
      });
      onTreeReady(extendedTree);
    }
  }, [tree, onTreeReady, handlers]);

  // Handle file download
  const handleDownload = async (item: ItemInstance<LinkTreeItem>) => {
    const itemData = item.getItemData();
    if (!itemData?.isFile) return;

    try {
      await downloadFileAction({ fileId: itemData.id });
      // The download action handles opening the download URL
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Early return if no data
  if (!linkTreeData) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='flex h-full items-center justify-center'
      >
        <span className='text-sm text-destructive'>
          Failed to load link data
        </span>
      </motion.div>
    );
  }

  // Empty state - check both database items and staged items
  const hasNoItems = !linkTreeData.folders?.length && 
                     !linkTreeData.files?.length && 
                     stagedFolders.size === 0 && 
                     stagedFiles.size === 0;
                     
  if (hasNoItems) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className='flex h-full items-center justify-center py-12'
      >
        <div className="text-center">
          <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No files uploaded yet
          </h3>
        </div>
      </motion.div>
    );
  }

  // Separate staged and non-staged items for grouped display
  const allItems = tree.getItems();
  const stagedItems = allItems.filter(item => {
    const itemData = item.getItemData();
    return itemData?.isStaged || stagedItemIds.has(item.getId());
  });
  const nonStagedItems = allItems.filter(item => {
    const itemData = item.getItemData();
    return !itemData?.isStaged && !stagedItemIds.has(item.getId());
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
      className='h-full flex flex-col'
    >
      <div
        {...tree.getContainerProps()}
        className='tree flex-1 overflow-auto relative bg-card border rounded-lg p-4'
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

        {/* Staged Items Container */}
        {stagedItems.length > 0 && (
          <div className="mb-4 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Staged for Upload ({stagedItems.length} {stagedItems.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <div className="space-y-0.5">
              {stagedItems.map(item => {
                const itemId = item.getId();
                const itemData = item.getItemData();
                const stagingStatus = itemData?.stagingStatus;

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
                        className="w-full text-left"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-1.5 flex-1 min-w-0 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group',
                            getCssClass(item),
                            // Staging status visual indicators (very subtle)
                            stagingStatus === 'uploading' && 'bg-amber-50/30 dark:bg-amber-950/10',
                            stagingStatus === 'completed' && 'bg-green-50/30 dark:bg-green-950/10',
                            stagingStatus === 'failed' && 'bg-red-50/30 dark:bg-red-950/10'
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
                              <FolderOpenIcon className='text-blue-600 dark:text-blue-400 size-4 flex-shrink-0' />
                            ) : (
                              <FolderIcon className='text-blue-600 dark:text-blue-400 size-4 flex-shrink-0' />
                            )
                          ) : (
                            <FileIcon className='text-blue-600 dark:text-blue-400 size-4 flex-shrink-0' />
                          )}

                          {/* Item name */}
                          <span className='truncate flex-1'>{item.getItemName()}</span>
                          
                          {/* Upload status indicator (only for uploading/failed) */}
                          {stagingStatus === 'uploading' && (
                            <span className='px-1.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center gap-1'>
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></div>
                              Uploading
                            </span>
                          )}
                          {stagingStatus === 'completed' && (
                            <span className='px-1.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'>
                              ✓
                            </span>
                          )}
                          {stagingStatus === 'failed' && (
                            <span className='px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'>
                              Failed
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Non-staged Items (existing files) */}
        {nonStagedItems.map(item => {
          const itemId = item.getId();
          const itemData = item.getItemData();

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
                  className="w-full text-left"
                >
                  <div
                    className={cn(
                      'flex items-center gap-1.5 flex-1 min-w-0 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group',
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
                    <span className='truncate flex-1'>{item.getItemName()}</span>

                    {/* File download button */}
                    {itemData?.isFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDownload(item);
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </button>
              )}
            </Fragment>
          );
        })}

        {/* Conditionally render drag line - hide drag lines that don't make logical sense */}
        {(() => {
          const draggedItems = tree.getState()?.dnd?.draggedItems;
          const dragTarget = tree.getDragTarget?.();
          const dragLineStyle = tree.getDragLineStyle();

          // Check if the drag line is targeting one of the currently dragged items
          // This prevents showing drag lines between/above/below items that are being dragged
          const isDragLineOnDraggedItem =
            draggedItems &&
            dragTarget &&
            draggedItems.some(
              draggedItem => draggedItem.getId() === dragTarget.item.getId()
            );

          // Check if the drag line is targeting the root link
          // Root link shouldn't show drag lines for reordering
          const isTargetingRootLink =
            dragTarget && dragTarget.item.getId() === rootId;

          // Hide drag line if:
          // 1. It's targeting one of the dragged items (illogical)
          // 2. It's targeting the root link (no reordering in root)
          // 3. No drag line style available
          if (
            isDragLineOnDraggedItem ||
            isTargetingRootLink ||
            !dragLineStyle ||
            dragLineStyle.display === 'none'
          ) {
            return null;
          }

          return <div style={dragLineStyle} className='dragline' />;
        })()}

        {/* Drag preview component */}
        <DragPreview tree={tree} />
      </div>

      {/* Batch Move Modal */}
      <BatchOperationModal
        isOpen={batchOperations.batchMoveModal.isOpen}
        onClose={batchOperations.handleModalClose}
        operation='move'
        items={batchOperations.batchMoveModal.items}
        targetFolder={batchOperations.batchMoveModal.targetFolder || 'Unknown'}
        onConfirm={batchOperations.executeBatchMove}
        progress={batchOperations.batchMoveModal.progress}
        isProcessing={batchOperations.batchMoveModal.isProcessing}
      />
    </motion.div>
  );
}