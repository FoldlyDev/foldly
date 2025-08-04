'use client';

import React, { Fragment, useState, useEffect } from 'react';
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

import { useWorkspaceTree } from '../../hooks/use-workspace-tree';
import { useTreeHandlers } from '../../hooks/use-tree-handlers';
import { useBatchOperations } from '../../hooks/use-batch-operations';
import { useTreeSearch } from '../../hooks/use-tree-search';
import {
  handleDrop,
  handleRename,
  handleDropForeignDragObject,
  handleCompleteForeignDrop,
  createForeignDragObject,
  canDropForeignDragObject,
} from '../../handlers';
import {
  data,
  dataLoader,
  populateFromDatabase,
  getDragOperationActive,
  type WorkspaceTreeItem,
} from '../../lib/tree-data';
import { useQueryClient } from '@tanstack/react-query';
import { BatchOperationModal } from '../modals/batch-operation-modal';
import { DragPreview, useDragPreview } from './DragPreview';
import { 
  MobileWorkspaceActionsModal, 
  type WorkspaceItem, 
  type WorkspaceAction 
} from '../modals/mobile-workspace-actions-modal';
import '../../styles/workspace-tree.css';

// Import tree UI components
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
} from 'lucide-react';

import type { FeatureImplementation } from '@headless-tree/core';

// Remove hardcoded virtual root - use actual workspace ID

interface WorkspaceTreeProps {
  onTreeReady?: (
    tree: TreeInstance<WorkspaceTreeItem> & {
      addFolder: (name: string, parentId?: string) => string | null;
      deleteItems: (itemIds: string[]) => void;
    }
  ) => void;
  searchQuery?: string;
  onRootClick?: () => void;
  onRootDrop?: (dataTransfer: DataTransfer) => void;
  selectedItems?: string[];
  onSelectionChange?: (selectedItems: string[]) => void;
  selectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
}

// Simple approach - directly use exported data and loader

export default function WorkspaceTree({
  onTreeReady,
  searchQuery = '',
  onRootClick,
  onSelectionChange,
  selectionMode = false,
  onSelectionModeChange,
}: WorkspaceTreeProps) {
  const { data: workspaceData, error } = useWorkspaceTree();
  
  // Mobile selection mode state - use external prop if provided, otherwise internal state
  const [internalSelectionMode, setInternalSelectionMode] = useState(false);
  const isSelectionMode = selectionMode ?? internalSelectionMode;
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Long-press detection state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [contextMenuItems, setContextMenuItems] = useState<WorkspaceItem[]>([]);
  
  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouchDevice();
    // Re-check on resize as device orientation might change
    window.addEventListener('resize', checkTouchDevice);
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, []);

  // Get the actual workspace root ID
  const rootId = workspaceData?.workspace?.id;

  // Get CSS class for items - exactly like library example with enhanced drag feedback
  const getCssClass = (item: ItemInstance<WorkspaceTreeItem>) =>
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
  
  // Long-press handlers for mobile context menu
  const handleTouchStart = (item: ItemInstance<WorkspaceTreeItem>) => {
    if (!isTouchDevice || isSelectionMode) return;
    
    const timer = setTimeout(() => {
      // Get selected items or use the long-pressed item
      const selectedItems = tree.getSelectedItems();
      const items: WorkspaceItem[] = selectedItems.length > 0 
        ? selectedItems.map(i => ({
            id: i.getId(),
            name: i.getItemName(),
            type: i.isFolder() ? 'folder' as const : 'file' as const,
          }))
        : [{
            id: item.getId(),
            name: item.getItemName(),
            type: item.isFolder() ? 'folder' as const : 'file' as const,
          }];
      
      setContextMenuItems(items);
      setShowMobileActions(true);
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms for long press
    
    setLongPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  // Custom click behavior that accounts for selection mode
  const customClickBehavior: FeatureImplementation = {
    itemInstance: {
      getProps: ({ tree, item, prev }) => ({
        ...prev?.(),
        onClick: (e: MouseEvent) => {
          // In selection mode (mobile or desktop), toggle selection
          if (isSelectionMode) {
            item.toggleSelect();
            item.setFocused();
            return;
          }
          
          // Normal mode behavior
          if (e.shiftKey) {
            item.selectUpTo(e.ctrlKey || e.metaKey);
          } else if (e.ctrlKey || e.metaKey) {
            item.toggleSelect();
          } else {
            tree.setSelectedItems([item.getItemMeta().itemId]);
          }

          item.setFocused();
        },
        onTouchStart: () => handleTouchStart(item),
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
      }),
    },
  };

  // Initialize tree with inline handlers to avoid circular dependencies
  const tree: TreeInstance<WorkspaceTreeItem> = useTree<WorkspaceTreeItem>({
    initialState: {
      expandedItems: rootId ? [rootId] : [],
      selectedItems: [],
    },
    rootItemId: rootId || '',
    getItemName: (item: ItemInstance<WorkspaceTreeItem>) =>
      item.getItemData()?.name || 'Unknown',
    isItemFolder: (item: ItemInstance<WorkspaceTreeItem>) =>
      !item.getItemData()?.isFile,
    canReorder: true,
    reorderAreaPercentage: 0.4, // Increase reorder zone sensitivity for better UX

    // Custom drag preview
    ...dragPreviewConfig,

    // Use custom onDrop handler that properly distinguishes between move vs reorder operations
    onDrop: async (
      items: ItemInstance<WorkspaceTreeItem>[],
      target: DragTarget<WorkspaceTreeItem>
    ): Promise<void> => {
      return handleDrop({ items, target }, { tree, queryClient });
    },

    onRename: (item: ItemInstance<WorkspaceTreeItem>, value: string) => {
      return handleRename({ item, value }, { queryClient });
    },

    onDropForeignDragObject: handleDropForeignDragObject,
    onCompleteForeignDrop: handleCompleteForeignDrop,
    createForeignDragObject: createForeignDragObject,
    canDropForeignDragObject: canDropForeignDragObject,

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
  const handlers = useTreeHandlers({ tree, rootId });

  // Initialize other hooks after tree is created
  const batchOperations = useBatchOperations({
    rootId,
    onSelectionChange,
    tree,
  });
  useTreeSearch({ tree, searchQuery });
  
  // Handle mobile workspace actions
  const handleMobileAction = (action: WorkspaceAction) => {
    switch (action) {
      case 'rename':
        // Start rename on the first selected item
        if (contextMenuItems.length === 1) {
          const item = tree?.getItemInstance?.(contextMenuItems[0].id);
          if (item && 'startRenaming' in item && typeof item.startRenaming === 'function') {
            item.startRenaming();
          }
        }
        break;
      
      case 'delete':
        // Use existing batch delete functionality
        if (contextMenuItems.length > 0) {
          const itemIds = contextMenuItems.map(item => item.id);
          handlers?.deleteItems(itemIds);
        }
        break;
      
      case 'move':
        // TODO: Implement move functionality
        // This requires selecting a target folder, which needs a more complex UI
        console.log('Move action not fully implemented yet');
        break;
      
      case 'createFolder':
        // Create folder inside selected folder
        if (contextMenuItems.length === 1 && contextMenuItems[0].type === 'folder') {
          const folderName = prompt('Enter folder name:');
          if (folderName && handlers) {
            handlers?.addItem(folderName, contextMenuItems[0].id, false);
          }
        }
        break;
      
      // TODO: Implement other actions as needed
      case 'copy':
      case 'download':
      case 'info':
        console.log(`Action ${action} not yet implemented`);
        break;
    }
  };

  // Sync database data to tree data store
  React.useEffect(() => {
    const isDragActive = getDragOperationActive();

    console.log('🔄 Database sync effect triggered:', {
      hasWorkspaceData: !!workspaceData,
      folderCount: workspaceData?.folders?.length || 0,
      fileCount: workspaceData?.files?.length || 0,
      isDragActive,
      timestamp: new Date().toISOString(),
    });

    // Skip data sync during active drag operations to prevent race conditions
    if (!workspaceData || isDragActive) {
      if (isDragActive) {
        console.log('🎯 Skipping data sync - drag operation in progress');
      }
      return;
    }

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

  // Track selection changes and notify parent
  React.useEffect(() => {
    if (tree && onSelectionChange) {
      const currentSelection = tree
        .getSelectedItems()
        .map(item => item.getId());
      onSelectionChange(currentSelection);
    }
  }, [tree?.getState?.()?.selectedItems, onSelectionChange]);

  // Notify parent when tree is ready and expose mobile state
  React.useEffect(() => {
    if (tree && onTreeReady && handlers) {
      const extendedTree = Object.assign(tree, {
        addFolder: (name: string, parentId?: string): string | null =>
          handlers.addItem(name, parentId, false),
        deleteItems: (itemIds: string[]): void => handlers.deleteItems(itemIds),
        isTouchDevice: () => isTouchDevice,
        isSelectionMode: () => isSelectionMode,
        setSelectionMode: (mode: boolean) => {
          if (onSelectionModeChange) {
            onSelectionModeChange(mode);
          } else {
            setInternalSelectionMode(mode);
          }
        },
      });
      onTreeReady(extendedTree);
    }
  }, [tree, onTreeReady, handlers, isTouchDevice, isSelectionMode, onSelectionModeChange]);

  // Early return if no data (handled by progressive loader)
  if (!workspaceData) {
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
          Failed to load workspace
        </span>
      </motion.div>
    );
  }

  // Empty state
  if (!workspaceData.folders?.length && !workspaceData.files?.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className='flex h-full items-center justify-center'
      >
        <span className='text-sm text-muted-foreground'>
          No files or folders found. Create some to get started.
        </span>
      </motion.div>
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
                    {/* Selection checkbox - shown in selection mode for all devices */}
                    {isSelectionMode && (
                      <span
                        className='flex-shrink-0 w-5 h-5 flex items-center justify-center cursor-pointer'
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.toggleSelect();
                        }}
                      >
                        {item.isSelected() ? (
                          <CheckSquare className='size-4 text-blue-600' />
                        ) : (
                          <Square className='size-4 text-muted-foreground' />
                        )}
                      </span>
                    )}
                    
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

          // Check if the drag line is targeting the root workspace
          // Root workspace shouldn't show drag lines for reordering
          const isTargetingRootWorkspace =
            dragTarget && dragTarget.item.getId() === rootId;

          // Hide drag line if:
          // 1. It's targeting one of the dragged items (illogical)
          // 2. It's targeting the root workspace (no reordering in root)
          // 3. No drag line style available
          if (
            isDragLineOnDraggedItem ||
            isTargetingRootWorkspace ||
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
      
      {/* Mobile Actions Modal */}
      <MobileWorkspaceActionsModal
        isOpen={showMobileActions}
        onClose={() => setShowMobileActions(false)}
        selectedItems={contextMenuItems}
        onAction={handleMobileAction}
      />
    </motion.div>
  );
}
