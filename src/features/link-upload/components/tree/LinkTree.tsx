'use client';

import React from 'react';
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
  type TreeInstance,
  type FeatureImplementation,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';

import { useLinkTree } from '../../hooks/use-link-tree';
import { useLinkTreeHandlers } from '../../hooks/use-link-tree-handlers';
import { useLinkBatchOperations } from '../../hooks/use-link-batch-operations';
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
import { DragPreview } from './DragPreview';
import { LinkTreeNode } from './LinkTreeNode';
import { StagedItemsContainer } from './StagedItemsContainer';
import { EmptyTreeState } from './EmptyTreeState';
import '../../styles/link-tree.css';
import type { LinkWithOwner } from '../../types';

import { downloadFileAction } from '../../lib/actions/download-file';

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
          const itemMeta = item.getItemMeta?.();
          if (itemMeta?.itemId) {
            tree.setSelectedItems([itemMeta.itemId]);
          } else {
            // Fallback to using getId if metadata is missing
            tree.setSelectedItems([item.getId()]);
          }
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
  onSelectionChange?: (selectedItems: string[]) => void;
}

export default function LinkTree({
  linkData,
  onTreeReady,
  searchQuery,
  onRootClick,
  onSelectionChange,
}: LinkTreeProps) {
  const queryClient = useQueryClient();
  const [localStagedItemIds, setLocalStagedItemIds] = React.useState<
    Set<string>
  >(new Set());

  // Hooks
  const { data: linkTreeData, error } = useLinkTree(linkData.id);

  // Use atomic selectors to avoid infinite loops with Map->Array conversion
  const stagedFilesMap = useStagingStore(state => state.stagedFiles);
  const stagedFoldersMap = useStagingStore(state => state.stagedFolders);
  const version = useStagingStore(state => state.version);

  // Convert Maps to arrays using useMemo to maintain stable references
  const stagedFiles = React.useMemo(
    () => Array.from(stagedFilesMap || new Map()),
    [stagedFilesMap]
  );

  const stagedFolders = React.useMemo(
    () => Array.from(stagedFoldersMap || new Map()),
    [stagedFoldersMap]
  );

  // Initialize tree - using a ref to break circular dependency
  const treeRef = React.useRef<TreeInstance<LinkTreeItem> | null>(null);

  const tree = useTree<LinkTreeItem>({
    initialState: {
      expandedItems: linkData.id ? [linkData.id] : [],
      selectedItems: [],
    },
    rootItemId: linkData.id || '',
    getItemName: (item: ItemInstance<LinkTreeItem>) =>
      item.getItemData()?.name || 'Unknown',
    isItemFolder: (item: ItemInstance<LinkTreeItem>) =>
      !item.getItemData()?.isFile,
    canReorder: true,
    reorderAreaPercentage: 0.4,
    dataLoader,
    features: [
      dragAndDropFeature,
      renamingFeature,
      syncDataLoaderFeature,
      expandAllFeature,
      hotkeysCoreFeature,
      keyboardDragAndDropFeature,
      selectionFeature,
      searchFeature,
      customClickBehavior,
    ],
    onDrop: async (items: ItemInstance<LinkTreeItem>[], target: any) => {
      if (treeRef.current) {
        const context = {
          tree: treeRef.current,
          queryClient,
          linkId: linkData.id,
        };
        return handleLinkDrop({ items, target }, context);
      }
    },
    onRename: async (item: ItemInstance<LinkTreeItem>, value: string) => {
      const context = { queryClient, linkId: linkData.id };
      return handleLinkRename({ item, value }, context);
    },
    onDropForeignDragObject: (dataTransfer: DataTransfer, target: any) => {
      return handleLinkDropForeignDragObject(dataTransfer, target);
    },
    onCompleteForeignDrop: (items: ItemInstance<LinkTreeItem>[]) => {
      // Note: onCompleteForeignDrop only receives items, not target
      // We'll need to get the target from the tree state if needed
      const target = tree?.getDragTarget?.();
      if (target) {
        return handleLinkCompleteForeignDrop(items, target);
      }
    },
    canDropForeignDragObject: canLinkDropForeignDragObject,
    createForeignDragObject: createLinkForeignDragObject,
  });

  // Store tree reference
  React.useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  const handlers = useLinkTreeHandlers({ tree, linkId: linkData.id });
  const batchOps = useLinkBatchOperations({ tree, linkId: linkData.id });

  // Note: dnd hook removed as it's not needed with current implementation

  // Apply search filter with expand/collapse behavior
  const [isSearching, setIsSearching] = React.useState(false);
  const [preSearchExpandedItems, setPreSearchExpandedItems] = React.useState<
    string[]
  >([]);

  React.useEffect(() => {
    if (!tree) return;

    const hasSearchQuery = searchQuery.trim().length > 0;

    // Apply the search to the tree's internal state
    const searchProps = tree.getSearchInputElementProps?.();
    if (searchProps?.onChange) {
      const syntheticEvent = {
        target: { value: searchQuery },
      } as React.ChangeEvent<HTMLInputElement>;
      searchProps.onChange(syntheticEvent);
    }

    // Handle expand/collapse based on search state
    if (hasSearchQuery && !isSearching) {
      // Starting search - save current state and expand all
      const currentExpanded = tree.getState?.()?.expandedItems || [];
      setPreSearchExpandedItems(currentExpanded);
      setIsSearching(true);
      tree.expandAll?.();
    } else if (!hasSearchQuery && isSearching) {
      // Ending search - restore previous expanded state
      setIsSearching(false);
      tree.collapseAll?.();
      // Optionally restore previous expanded items
      if (preSearchExpandedItems.length > 0) {
        setTimeout(() => {
          preSearchExpandedItems.forEach(itemId => {
            const item = tree.getItemInstance?.(itemId);
            if (item && 'expand' in item && typeof item.expand === 'function') {
              item.expand();
            }
          });
        }, 100);
      }
    }
  }, [searchQuery, tree, isSearching]);

  // Track drag operation state
  const isDragActive = getDragOperationActive();

  // Sync tree data - using refs to prevent infinite loops
  const prevVersionRef = React.useRef(version);
  const prevStagedFilesRef = React.useRef(stagedFiles);
  const prevStagedFoldersRef = React.useRef(stagedFolders);

  React.useEffect(() => {
    if (!linkTreeData || isDragActive) return;

    // Check if data actually changed
    const versionChanged = prevVersionRef.current !== version;
    const stagedFilesChanged = prevStagedFilesRef.current !== stagedFiles;
    const stagedFoldersChanged = prevStagedFoldersRef.current !== stagedFolders;

    // Update refs
    prevVersionRef.current = version;
    prevStagedFilesRef.current = stagedFiles;
    prevStagedFoldersRef.current = stagedFolders;

    // Only sync if something actually changed
    if (
      !versionChanged &&
      !stagedFilesChanged &&
      !stagedFoldersChanged &&
      !linkTreeData
    ) {
      return;
    }

    const dataUpdated = populateFromDatabase(
      {
        id: linkTreeData.link.id,
        ...(linkTreeData.link.title && { title: linkTreeData.link.title }),
      },
      linkTreeData.folders || [],
      linkTreeData.files || []
    );

    // Merge staging data after database data - we already have the Maps
    mergeStagedItemsWithTree(linkData.id, stagedFilesMap, stagedFoldersMap);

    // Track staged item IDs for grouped display
    const newStagedIds = new Set<string>();
    stagedFiles.forEach(([id]) => newStagedIds.add(id));
    stagedFolders.forEach(([id]) => newStagedIds.add(id));
    setLocalStagedItemIds(newStagedIds);

    // Force tree rebuild when we have staged items or data updated
    if (tree?.rebuildTree) {
      const hasStaged = stagedFiles.length > 0 || stagedFolders.length > 0;
      if (dataUpdated || hasStaged) {
        // Use setTimeout to ensure DOM updates are processed
        setTimeout(() => {
          tree.rebuildTree();
        }, 0);
      }
    }
  }, [
    linkTreeData,
    tree,
    linkData.id,
    stagedFiles,
    stagedFolders,
    version,
    isDragActive,
  ]);

  // Track selection changes
  React.useEffect(() => {
    if (tree && onSelectionChange && tree.getSelectedItems) {
      const currentSelection = tree
        .getSelectedItems()
        .map(item => item.getId());
      onSelectionChange(currentSelection);
    }
  }, [tree, onSelectionChange]);

  // Notify parent when tree is ready
  React.useEffect(() => {
    if (tree && onTreeReady && handlers) {
      const extendedTree = Object.assign(tree, {
        addFolder: (name: string, parentId?: string): string | null =>
          handlers.addItem(name, parentId, false),
        deleteItems: (itemIds: string[]): void => handlers.deleteItems(itemIds),
        rebuildTree: tree.rebuildTree,
      });
      onTreeReady(extendedTree);
    }
  }, [tree, onTreeReady, handlers]);

  // Handle file download
  const handleDownload = async (
    item: ItemInstance<LinkTreeItem>
  ): Promise<void> => {
    const itemData = item.getItemData();
    if (!itemData?.isFile) return;

    try {
      await downloadFileAction({ fileId: itemData.id });
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

  // Empty state
  const hasNoItems =
    !linkTreeData.folders?.length &&
    !linkTreeData.files?.length &&
    stagedFolders.length === 0 &&
    stagedFiles.length === 0;

  if (hasNoItems) {
    return <EmptyTreeState />;
  }

  // Separate staged and non-staged items with better error handling
  const allItems = tree?.getItems ? tree.getItems() : [];

  // Validate items and separate them
  const validItems: ItemInstance<LinkTreeItem>[] = [];
  const stagedItems: ItemInstance<LinkTreeItem>[] = [];
  const nonStagedItems: ItemInstance<LinkTreeItem>[] = [];

  allItems.forEach((item: ItemInstance<LinkTreeItem>, index: number) => {
    // Validate item has required methods
    if (
      !item ||
      typeof item.getItemData !== 'function' ||
      typeof item.getId !== 'function'
    ) {
      console.error(`Invalid tree item at index ${index}:`, item);
      return;
    }

    try {
      const itemData = item.getItemData();
      const itemId = item.getId();

      // Check if it's staged
      if (itemData?.isStaged || localStagedItemIds.has(itemId)) {
        stagedItems.push(item);
      } else {
        nonStagedItems.push(item);
      }
      validItems.push(item);
    } catch (error) {
      console.error(
        `Error processing tree item at index ${index}:`,
        error,
        item
      );
    }
  });

  // Log any issues for debugging
  if (validItems.length !== allItems.length) {
    console.warn(
      `Tree has ${allItems.length} items but only ${validItems.length} are valid`
    );
  }

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

        {/* Staged Items */}
        <StagedItemsContainer items={stagedItems} onDownload={handleDownload} />

        {/* Non-staged Items */}
        <div className='space-y-0.5'>
          {nonStagedItems.map((item: ItemInstance<LinkTreeItem>) => (
            <LinkTreeNode
              key={item.getId()}
              item={item}
              onDownload={handleDownload}
              isDragging={false}
            />
          ))}
        </div>

        {/* Drag Preview */}
        <DragPreview tree={tree} />
      </div>

      {/* Batch operation modal */}
      <BatchOperationModal
        isOpen={batchOps.batchMoveModal.isOpen}
        onClose={batchOps.handleModalClose}
        operation='move'
        items={batchOps.batchMoveModal.items}
        targetFolder={batchOps.batchMoveModal.targetFolder || 'Unknown'}
        onConfirm={batchOps.executeBatchMove}
        {...(batchOps.batchMoveModal.progress && {
          progress: batchOps.batchMoveModal.progress,
        })}
        isProcessing={batchOps.batchMoveModal.isProcessing}
      />
    </motion.div>
  );
}
