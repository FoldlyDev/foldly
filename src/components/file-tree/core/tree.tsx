'use client';

import React from 'react';
import './tree.css';
import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  checkboxesFeature,
  expandAllFeature,
  type FeatureImplementation,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';

import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Input } from '@/components/ui/shadcn/input';
import { TreeItemRenderer } from '../sub-components/tree-item-renderer';
import { ContextMenuWrapper } from '../sub-components/context-menu-wrapper';
import { UploadHighlight } from '@/components/feedback/upload-highlight';
import {
  type TreeItem as TreeItemType,
  type TreeFolderItem,
  isFolder,
} from '../types/tree-types';
import { createTreeData } from '../utils/tree-data';
import { addTreeItem, removeTreeItem } from '../utils/tree-manipulation';
import { createTreeDropHandler, type DropOperationCallbacks } from '../handlers/drop-handler';
import { createRenameHandler, type RenameOperationCallback } from '../handlers/rename-handler';
import { createForeignDropHandlers } from '../handlers/foreign-drop-handler';
import { createInsertNewItem } from '../handlers/insert-item-handler';
import { clearCheckedItems } from '../utils/checkbox-management';

// WeakMap to store tree instance to treeId associations
const treeIdMap = new WeakMap<any, string>();

// Helper function to get treeId from tree instance
export const getTreeId = (tree: any): string | undefined => {
  return treeIdMap.get(tree);
};

// Create a Map to store data for each tree instance
const treeDataMap = new Map<string, ReturnType<typeof createTreeData<TreeItemType>>>();

// Helper to get or create data for a specific tree instance
export const getTreeData = (treeId: string) => {
  if (!treeDataMap.has(treeId)) {
    treeDataMap.set(treeId, createTreeData<TreeItemType>());
  }
  return treeDataMap.get(treeId)!;
};


// Export helper functions for programmatic tree manipulation with bound getTreeData
export const addTreeItemExport = (
  treeInstance: any,
  parentId: string,
  item: TreeItemType,
  treeId: string
) => {
  // console.log('🔵 [FileTree] addTreeItemExport called:', {
  //   parentId,
  //   itemId: item.id,
  //   itemName: item.name,
  //   treeId,
  //   timestamp: Date.now()
  // });
  
  // const dataBefore = Object.keys(getTreeData(treeId).data);
  // console.log('🔵 [FileTree] Data keys before add:', dataBefore);
  
  addTreeItem(treeInstance, parentId, item, treeId, getTreeData);
  
  // const dataAfter = Object.keys(getTreeData(treeId).data);
  // console.log('🔵 [FileTree] Data keys after add:', dataAfter);
  // console.log('🔵 [FileTree] New keys added:', dataAfter.filter(k => !dataBefore.includes(k)));
  
  // Schedule a rebuild to ensure the tree updates
  // Use setTimeout to allow the data mutation to complete first
  // console.log('🔵 [FileTree] Scheduling manual rebuildTree with 0ms delay');
  setTimeout(() => {
    if (treeInstance.rebuildTree) {
      // console.log('🔴 [FileTree] EXECUTING manual rebuildTree NOW!', {
      //   treeId,
      //   itemCountBefore: treeInstance.getItems().length,
      //   timestamp: Date.now()
      // });
      treeInstance.rebuildTree();
      // console.log('🔴 [FileTree] Manual rebuildTree COMPLETED!', {
      //   treeId,
      //   itemCountAfter: treeInstance.getItems().length,
      //   timestamp: Date.now()
      // });
    }
  }, 0);
};

export const removeTreeItemExport = (
  treeInstance: any,
  itemIds: string[],
  treeId: string
) => {
  removeTreeItem(treeInstance, itemIds, treeId, getTreeData);
  // The syncDataLoaderFeature will automatically detect the change and update the tree
};

// Re-export with original names for backward compatibility
export { addTreeItemExport as addTreeItem, removeTreeItemExport as removeTreeItem };

// Export checkbox management utilities
export {
  getCheckedItems,
  clearCheckedItems,
  checkItems,
  uncheckItems,
  toggleCheckItems,
  checkAllItems,
  getCheckedItemsData,
} from '../utils/checkbox-management';

// Context menu item configuration
export interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

// Context menu provider function
export type ContextMenuProvider = (
  item: TreeItemType,
  itemInstance: any
) => ContextMenuItem[] | null;

interface FileTreeProps {
  rootId: string;
  treeId: string;  // Required treeId for instance isolation
  initialData: Record<string, TreeItemType>;
  initialExpandedItems?: string[];
  initialSelectedItems?: string[];
  initialCheckedItems?: string[];
  onTreeReady?: (tree: any) => void;
  // Display options for sub-components
  showFileSize?: boolean;
  showFileDate?: boolean;
  showFileStatus?: boolean;
  showFolderCount?: boolean;
  showFolderSize?: boolean;
  // Checkbox control
  showCheckboxes?: boolean;
  // Search/filter control
  searchQuery?: string;
  onSearchChange?: (query: string) => void; // Reserved for future search implementation
  // Selection callback
  onSelectionChange?: (selectedItems: string[]) => void;
  // Drop operation callbacks
  dropCallbacks?: DropOperationCallbacks;
  // Rename operation callback
  renameCallback?: RenameOperationCallback;
  // Context menu provider
  contextMenuProvider?: ContextMenuProvider;
  // External file drop handler
  onExternalFileDrop?: (files: File[], targetFolderId: string | null, folderStructure?: { [folder: string]: File[] }) => void;
}

export default function FileTree({
  rootId,
  treeId,
  initialData,
  initialExpandedItems = [],
  initialSelectedItems = [],
  initialCheckedItems = [],
  onTreeReady,
  showFileSize = false,
  showFileDate = false,
  showFileStatus = false,
  showFolderCount = false,
  showFolderSize = false,
  showCheckboxes = false,
  searchQuery = '',
  onSearchChange: _onSearchChange,
  onSelectionChange,
  dropCallbacks,
  renameCallback,
  contextMenuProvider,
  onExternalFileDrop,
}: FileTreeProps) {
  // Update counter for re-syncing data
  const [updateCounter, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Get the data and syncDataLoader for this specific tree instance
  // IMPORTANT: Only get this once when treeId changes, not on every render
  const treeDataRef = React.useRef<ReturnType<typeof getTreeData> | null>(null);
  if (!treeDataRef.current || treeDataRef.current !== getTreeData(treeId)) {
    treeDataRef.current = getTreeData(treeId);
  }
  const { syncDataLoader, data } = treeDataRef.current;
  
  // Track if we should hide drag line (after clicking)
  const [hideDragLine, setHideDragLine] = React.useState(false);
  
  // Store tree instance ref for clearDragState
  const treeRef = React.useRef<any>(null);
  
  // Force clear drag state when clicking items
  const clearDragState = React.useCallback(() => {
    // Clear drag state if tree is available
    if (treeRef.current?.applySubStateUpdate) {
      treeRef.current.applySubStateUpdate("dnd", {});
    }
    setHideDragLine(true);
    // Reset the flag after a short delay
    setTimeout(() => setHideDragLine(false), 100);
  }, []);
  
  // Create custom feature to prevent folder expansion on click (only select)
  const customClickBehavior: FeatureImplementation<TreeItemType> = React.useMemo(() => ({
    itemInstance: {
      getProps: ({ tree, item, prev }) => {
        const prevProps = prev?.() || {};
        
        return {
          ...prevProps,
          onClick: (e: React.MouseEvent) => {
            // Clear any lingering drag state when clicking
            clearDragState();
            
            // Check if the click target is the chevron icon
            const target = e.target as HTMLElement;
            const isChevronClick = target.closest('[data-chevron]');
            
            // If chevron was clicked, toggle expansion
            if (isChevronClick && item.isFolder()) {
              e.preventDefault();
              e.stopPropagation();
              if (item.isExpanded()) {
                item.collapse();
              } else {
                item.expand();
              }
              return;
            }
            
            // Handle selection logic (without expanding folders)
            if (e.shiftKey) {
              item.selectUpTo(e.ctrlKey || e.metaKey);
            } else if (e.ctrlKey || e.metaKey) {
              item.toggleSelect();
            } else {
              tree.setSelectedItems([item.getItemMeta().itemId]);
            }
            
            item.setFocused();
          },
        };
      },
    },
  }), [clearDragState]);
  
  // Create custom feature to clear selection when clicking root
  const clearSelectionOnRootClick: FeatureImplementation<TreeItemType> = React.useMemo(() => ({
    itemInstance: {
      getProps: ({ prev, item, tree }) => {
        const prevProps = prev?.() || {};
        const itemId = item.getId();
        
        // Check if this is the root item
        const isRootItem = itemId === rootId;
        
        if (isRootItem) {
          return {
            ...prevProps,
            onClick: (e: React.MouseEvent) => {
              // If the root is already selected, clear all selections
              const currentSelection = tree.getState?.()?.selectedItems || [];
              if (currentSelection.includes(rootId)) {
                // Clear all selections
                if (tree.setSelectedItems) {
                  tree.setSelectedItems([]);
                }
                
                // Clear checked items if in checkbox mode
                if (showCheckboxes) {
                  clearCheckedItems(tree);
                }
                
                // Prevent default selection behavior
                e.preventDefault();
                e.stopPropagation();
              } else {
                // Let the default behavior select the root
                if (prevProps.onClick) {
                  prevProps.onClick(e);
                }
              }
            },
          };
        }
        
        return prevProps;
      },
    },
  }), [rootId, showCheckboxes]);
  
  // Create instance-specific handlers - memoize with stable reference
  const insertNewItem = React.useCallback(
    createInsertNewItem(data),
    [] // Empty deps since data is a stable reference
  );
  
  const { onDropForeignDragObject, onCompleteForeignDrop } = React.useMemo(
    () => createForeignDropHandlers(data, insertNewItem, onExternalFileDrop),
    [insertNewItem, onExternalFileDrop] // Depend on both
  );

  const onRename = React.useMemo(
    () => createRenameHandler(data, renameCallback, forceUpdate),
    [renameCallback, forceUpdate] // Depend on renameCallback and forceUpdate
  );
  
  // Log once when callbacks are set up
  React.useEffect(() => {
    console.log('🎯 [FileTree] Callbacks configured:', {
      hasDropCallbacks: !!dropCallbacks,
      hasOnReorder: !!dropCallbacks?.onReorder,
      hasOnMove: !!dropCallbacks?.onMove,
      hasRenameCallback: !!renameCallback
    });
  }, []);
  
  // Initialize data with provided initial data
  React.useEffect(() => {
    // console.log('🟡 [FileTree] Initializing data effect:', {
    //   treeId,
    //   previousDataKeys: Object.keys(data),
    //   newDataKeys: Object.keys(initialData),
    //   timestamp: Date.now()
    // });
    
    // Keep track of temp items that should be preserved
    const tempItems: Record<string, TreeItemType> = {};
    Object.keys(data).forEach(key => {
      if (key.startsWith('folder-temp-') || key.startsWith('file-temp-')) {
        const item = data[key];
        if (item) {
          tempItems[key] = item;
        }
      }
    });
    
    // Clear existing data
    Object.keys(data).forEach(key => delete data[key]);
    
    // Add initial data
    Object.assign(data, initialData);
    
    // Re-add temp items that aren't in initialData
    Object.keys(tempItems).forEach(key => {
      if (!data[key]) {
        const tempItem = tempItems[key];
        if (tempItem) {
          data[key] = tempItem;
          
          // Also ensure temp item is in parent's children array
          if (tempItem.parentId && data[tempItem.parentId]) {
            const parent = data[tempItem.parentId];
            if (parent && parent.type === 'folder') {
              const folderParent = parent as TreeFolderItem;
              if (folderParent.children && !folderParent.children.includes(key)) {
                folderParent.children.push(key);
              }
            }
          }
        }
      }
    });
    
    // console.log('🟡 [FileTree] Data initialized, final keys:', Object.keys(data));
  }, [initialData, data, updateCounter]); // Include updateCounter to re-sync on force updates

  // Only log when tree is actually being created (first render)
  React.useEffect(() => {
    // console.log('🟢 [FileTree] Tree component mounted:', {
    //   treeId,
    //   rootId,
    //   dataKeys: Object.keys(data),
    //   timestamp: Date.now()
    // });
  }, []);
  
  // Memoize the tree configuration to prevent recreating the tree on every render
  const treeConfig = React.useMemo(() => ({
    initialState: {
      expandedItems: initialExpandedItems,
      selectedItems: initialSelectedItems,
      checkedItems: initialCheckedItems,
    },
    rootItemId: rootId,
    getItemName: (item: any) => item.getItemData().name,
    isItemFolder: (item: any) => {
      const itemData = item.getItemData();
      // Check if item has children property OR is type folder
      // This ensures compatibility with both patterns
      return (
        !!('children' in itemData && itemData.children) || isFolder(itemData)
      );
    },
    canReorder: true,
    onDrop: createTreeDropHandler(data, dropCallbacks),
    onRename,
    onDropForeignDragObject,
    onCompleteForeignDrop,
    createForeignDragObject: (items: any[]) => {
      // Serialize the full item data, not just IDs
      const itemsData = items.map(item => {
        const itemId = item.getId();
        const itemData = data[itemId];
        return itemData;
      });
      return {
        format: 'application/json',
        data: JSON.stringify(itemsData),
      };
    },
    canDropForeignDragObject: (dataTransfer: any, target: any) => {
      // Allow file drops on folders
      if (dataTransfer.files && dataTransfer.files.length > 0) {
        return target.item.isFolder() || target.mode === 'inside';
      }
      // Original behavior for other drops
      return target.item.isFolder();
    },
    indent: 20,
    dataLoader: syncDataLoader,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      checkboxesFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      renamingFeature,
      searchFeature,
      expandAllFeature,
      customClickBehavior,
      clearSelectionOnRootClick,
    ],
  }), [rootId, syncDataLoader, onRename, onDropForeignDragObject, onCompleteForeignDrop, customClickBehavior, clearSelectionOnRootClick, initialExpandedItems, initialSelectedItems, initialCheckedItems, data, dropCallbacks]);
  
  const tree = useTree<TreeItemType>(treeConfig);
  
  // Store tree instance in ref for clearDragState
  React.useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  // Track selection changes and notify parent
  React.useEffect(() => {
    if (tree && onSelectionChange) {
      // Get current selection from tree state
      const selectedItems = tree.getState?.()?.selectedItems || [];
      onSelectionChange(selectedItems);
    }
  }, [tree?.getState?.()?.selectedItems, onSelectionChange]);

  // Call onTreeReady when tree is created with treeId attached
  React.useEffect(() => {
    if (onTreeReady && tree) {
      // console.log('🟣 [FileTree] Tree ready, calling onTreeReady:', {
      //   treeId,
      //   itemCount: tree.getItems().length,
      //   timestamp: Date.now()
      // });
      // Store the treeId association in the WeakMap
      treeIdMap.set(tree, treeId);
      onTreeReady(tree);
    }
  }, [tree, onTreeReady, treeId]);
  
  // Rebuild tree after data changes to ensure UI reflects latest data
  // This is the mechanism that prevents items from disappearing
  React.useEffect(() => {
    const dataLength = Object.keys(data).length;
    // console.log('🟠 [FileTree] Data change detection effect:', {
    //   treeId,
    //   hasTree: !!tree,
    //   dataLength,
    //   dataKeys: Object.keys(data).slice(0, 5), // Show first 5 keys
    //   timestamp: Date.now()
    // });
    
    if (tree && dataLength > 0) {
      // console.log('🟠 [FileTree] Scheduling auto rebuildTree in 10ms');
      // Small delay to ensure data mutations are complete
      const timer = setTimeout(() => {
        // console.log('🔴 [FileTree] EXECUTING auto rebuildTree NOW!', {
        //   treeId,
        //   itemCountBefore: tree.getItems().length,
        //   timestamp: Date.now()
        // });
        tree.rebuildTree();
        // console.log('🔴 [FileTree] Auto rebuildTree COMPLETED!', {
        //   treeId,
        //   itemCountAfter: tree.getItems().length,
        //   timestamp: Date.now()
        // });
      }, 10);
      return () => {
        // console.log('🟠 [FileTree] Cleanup: Cancelling scheduled auto rebuild');
        clearTimeout(timer);
      };
    }
  }, [tree, Object.keys(data).length]); // Watch for data changes

  // Handle search query changes
  React.useEffect(() => {
    if (tree && searchQuery !== undefined) {
      // Get the search input props from the tree
      const searchProps = tree.getSearchInputElementProps();
      
      if (searchProps.onChange) {
        // Create a synthetic event to trigger the search
        const syntheticEvent = {
          target: { value: searchQuery },
        } as React.ChangeEvent<HTMLInputElement>;
        
        searchProps.onChange(syntheticEvent);
        
        // If search has content, expand all folders to show results
        if (searchQuery.length > 0 && tree.expandAll) {
          tree.expandAll();
        }
      }
    }
  }, [searchQuery, tree]);
  
  // Track filtered items for display
  const [filteredItems, setFilteredItems] = React.useState<string[]>([]);
  
  // Check if workspace is empty (only root item with no children)
  const isWorkspaceEmpty = React.useMemo(() => {
    // Check the initialData prop - this is the source of truth
    const dataKeys = Object.keys(initialData);
    
    // If we have more than one item (root + others), not empty
    if (dataKeys.length > 1) return false;
    
    // If we only have one item, check if it's the root and has no children
    if (dataKeys.length === 1) {
      const rootItem = initialData[rootId];
      if (!rootItem) return false;
      
      // Check if it's a folder with children
      if (isFolder(rootItem)) {
        const folderItem = rootItem as TreeFolderItem;
        return !folderItem.children || folderItem.children.length === 0;
      }
    }
    
    // No data at all
    return dataKeys.length === 0;
  }, [initialData, rootId]);
  
  // Update filtered items when search changes or tree items change
  React.useEffect(() => {
    if (!searchQuery || searchQuery.length === 0) {
      setFilteredItems([]);
      return;
    }
    
    if (!tree) return;
    
    // Get all matching items from the tree's search
    const matchingItems = tree.getSearchMatchingItems();
    const directMatches = matchingItems.map((item: any) => item.getId());
    
    // Also include parent folders of matching items
    const parentIds = new Set<string>();
    matchingItems.forEach((item: any) => {
      let currentItem = item;
      while (currentItem?.getParent && currentItem.getParent()) {
        const parent = currentItem.getParent();
        if (parent) {
          parentIds.add(parent.getId());
          currentItem = parent;
        } else {
          break;
        }
      }
    });
    
    // Combine direct matches and their parents
    setFilteredItems([...new Set([...directMatches, ...Array.from(parentIds)])]);
  }, [searchQuery, tree]);

  return (
    <div className='file-tree-component flex h-full flex-col gap-2 *:first:grow'>
      {/* Tree Container - MUST have getContainerProps for drag/drop to work! */}
      <div 
        {...tree.getContainerProps()} 
        className='tree'
        onClick={(e) => {
          // Check if the click is directly on the container (empty space)
          if (e.target === e.currentTarget) {
            // Clear any lingering drag state
            clearDragState();
            
            // Clear all selections when clicking empty space
            if (tree.setSelectedItems) {
              tree.setSelectedItems([]);
            }
            // Clear checked items if in checkbox mode
            if (showCheckboxes) {
              clearCheckedItems(tree);
            }
          }
        }}>
        <AssistiveTreeDescription tree={tree} />
        {searchQuery && filteredItems.length === 0 ? (
          <div className='px-3 py-4 text-center text-sm text-muted-foreground'>
            No items found for "{searchQuery}"
          </div>
        ) : isWorkspaceEmpty && !searchQuery ? (
          // Show upload highlight when workspace is empty and not searching
          <div className='flex h-full flex-col items-center justify-center p-8 gap-4'>
            <UploadHighlight 
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0 && onExternalFileDrop) {
                  // Convert FileList to File array and trigger the external drop handler
                  const fileArray = Array.from(files);
                  onExternalFileDrop(fileArray, rootId, undefined);
                }
              }}
            />
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>
                Drop files here or click to upload
              </p>
              <p className='text-xs text-muted-foreground mt-1'>
                You can also drag folders from your computer
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const items = tree.getItems();
            
            // Only log during development and not on every render
            if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
              console.log('🎆 [FileTree] RENDERING tree items:', {
                treeId,
                totalItems: items.length,
                itemIds: items.map(i => i.getId()).slice(0, 5), // First 5 IDs
                searchQuery,
                filteredItemsCount: filteredItems.length,
                timestamp: Date.now()
              });
            }
            return items.map(item => {
            // Add null checks for item methods
            if (!item || !item.getId || !item.getItemData) {
              console.warn('Invalid item encountered during rendering');
              return null;
            }
            
            try {
              const itemData = item.getItemData();
              const itemId = item.getId();
              const isVisible = !searchQuery || filteredItems.includes(itemId);
              
              // Check if this is the last child of its parent
              const parent = item.getParent ? item.getParent() : null;
              const isLastChild = parent ? (() => {
                try {
                  const children = parent.getChildren ? parent.getChildren() : [];
                  if (!children || children.length === 0) return false;
                  const lastChild = children[children.length - 1];
                  return lastChild && lastChild.getId ? lastChild.getId() === itemId : false;
                } catch (e) {
                  console.warn('Error checking last child status:', e);
                  return false;
                }
              })() : false;

            return isVisible ? (
              <React.Fragment key={item.getId()}>
                {item.isRenaming() ? (
                  <div
                    className='renaming-item'
                    style={{ marginLeft: `${item.getItemMeta().level * 20}px` }}
                  >
                    <Input
                      {...item.getRenameInputProps()}
                      autoFocus
                      className='h-6 px-1'
                    />
                  </div>
                ) : (
                  <ContextMenuWrapper
                    item={itemData}
                    itemInstance={item}
                    menuItems={contextMenuProvider ? contextMenuProvider(itemData, item) : null}
                  >
                    <div 
                    className='outeritem'
                    data-depth={item.getItemMeta().level}
                    data-last-child={isLastChild}
                    style={{ '--depth': item.getItemMeta().level } as React.CSSProperties}
                  >
                    {showCheckboxes && (
                      <Checkbox
                        checked={
                          {
                            checked: true,
                            unchecked: false,
                            indeterminate: 'indeterminate' as const,
                          }[item.getCheckedState()]
                        }
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          const checkboxProps = item.getCheckboxProps();
                          checkboxProps.onChange?.({ target: { checked } });
                        }}
                      />
                    )}
                    {/* Button MUST have item.getProps() for drag/drop! */}
                    <button
                      {...item.getProps()}
                      style={{
                        paddingLeft: `${item.getItemMeta().level * 20}px`,
                      }}
                      className='flex-1'
                    >
                      <div className={`treeitem ${item.isFolder() ? 'folder' : ''} ${item.isExpanded() ? 'expanded' : ''} ${item.isSelected() ? 'selected' : ''} ${item.isFocused() ? 'focused' : ''} ${item.isDragTarget?.() ? 'drop' : ''} ${item.isDragTargetAbove?.() ? 'drop-above' : ''} ${item.isDragTargetBelow?.() ? 'drop-below' : ''} ${item.isMatchingSearch?.() ? 'searchmatch' : ''}`}>
                        <TreeItemRenderer
                          item={itemData}
                          itemInstance={item}
                          showFileSize={showFileSize}
                          showFileDate={showFileDate}
                          showFileStatus={showFileStatus}
                          showFolderCount={showFolderCount}
                          showFolderSize={showFolderSize}
                        />
                      </div>
                    </button>
                  </div>
                  </ContextMenuWrapper>
                )}
              </React.Fragment>
            ) : null;
            } catch (error) {
              console.error('Error rendering tree item:', error, { itemId: item?.getId?.() });
              return null;
            }
          });
          })()
        )}
        {(() => {
          // Don't show drag line if it's been hidden by clicking
          if (hideDragLine) {
            return null;
          }
          
          // Only render drag line during active drag operations
          const dndState = tree.getState?.()?.dnd;
          
          // Check multiple conditions to ensure we're actually dragging
          const hasDraggedItems = dndState?.draggedItems && dndState.draggedItems.length > 0;
          const hasDragTarget = dndState?.dragTarget !== null && dndState?.dragTarget !== undefined;
          const isDraggingOver = dndState?.draggingOverItem !== null && dndState?.draggingOverItem !== undefined;
          
          // Only show drag line if actively dragging AND have a valid target
          const shouldShowDragLine = hasDraggedItems && (hasDragTarget || isDraggingOver);
          
          if (!shouldShowDragLine || !tree.getDragLineStyle) {
            return null;
          }
          
          try {
            const style = tree.getDragLineStyle();
            // Additional check: ensure style has valid positioning and isn't hidden
            if (
              style && 
              typeof style === 'object' && 
              ('top' in style || 'bottom' in style) &&
              style.display !== 'none' &&
              style.visibility !== 'hidden'
            ) {
              return <div style={style} className='dragline' />;
            }
            return null;
          } catch (error) {
            // Silently handle the error - this is expected when dragging to certain positions
            // The headless-tree library tries to access elements that might not exist yet
            return null;
          }
        })()}
      </div>
    </div>
  );
}
