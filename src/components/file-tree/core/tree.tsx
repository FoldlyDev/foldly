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
import {
  type TreeItem as TreeItemType,
  type TreeFolderItem,
  isFolder,
} from '../types/tree-types';
import { createTreeData } from '../utils/tree-data';
import { addTreeItem, removeTreeItem } from '../utils/tree-manipulation';
import { createTreeDropHandler } from '../handlers/drop-handler';
import { createRenameHandler } from '../handlers/rename-handler';
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
  console.log('🔵 [FileTree] addTreeItemExport called:', {
    parentId,
    itemId: item.id,
    itemName: item.name,
    treeId,
    timestamp: Date.now()
  });
  
  const dataBefore = Object.keys(getTreeData(treeId).data);
  console.log('🔵 [FileTree] Data keys before add:', dataBefore);
  
  addTreeItem(treeInstance, parentId, item, treeId, getTreeData);
  
  const dataAfter = Object.keys(getTreeData(treeId).data);
  console.log('🔵 [FileTree] Data keys after add:', dataAfter);
  console.log('🔵 [FileTree] New keys added:', dataAfter.filter(k => !dataBefore.includes(k)));
  
  // Schedule a rebuild to ensure the tree updates
  // Use setTimeout to allow the data mutation to complete first
  console.log('🔵 [FileTree] Scheduling manual rebuildTree with 0ms delay');
  setTimeout(() => {
    if (treeInstance.rebuildTree) {
      console.log('🔴 [FileTree] EXECUTING manual rebuildTree NOW!', {
        treeId,
        itemCountBefore: treeInstance.getItems().length,
        timestamp: Date.now()
      });
      treeInstance.rebuildTree();
      console.log('🔴 [FileTree] Manual rebuildTree COMPLETED!', {
        treeId,
        itemCountAfter: treeInstance.getItems().length,
        timestamp: Date.now()
      });
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
  onSearchChange,
}: FileTreeProps) {
  // Update counter for re-syncing data
  const [updateCounter] = React.useReducer(x => x + 1, 0);
  
  // Get the data and syncDataLoader for this specific tree instance
  // IMPORTANT: Only get this once when treeId changes, not on every render
  const treeDataRef = React.useRef<ReturnType<typeof getTreeData> | null>(null);
  if (!treeDataRef.current || treeDataRef.current !== getTreeData(treeId)) {
    treeDataRef.current = getTreeData(treeId);
  }
  const { syncDataLoader, data } = treeDataRef.current;
  
  // Create custom feature to prevent folder expansion on click (only select)
  const customClickBehavior: FeatureImplementation<TreeItemType> = React.useMemo(() => ({
    itemInstance: {
      getProps: ({ tree, item, prev }) => {
        const prevProps = prev?.() || {};
        
        return {
          ...prevProps,
          onClick: (e: React.MouseEvent) => {
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
  }), []);
  
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
    () => createForeignDropHandlers(data, insertNewItem),
    [insertNewItem] // Only depend on insertNewItem, not data
  );

  const onRename = React.useCallback(
    createRenameHandler(data),
    [] // Empty deps since data is a stable reference
  );
  
  // Initialize data with provided initial data
  React.useEffect(() => {
    console.log('🟡 [FileTree] Initializing data effect:', {
      treeId,
      previousDataKeys: Object.keys(data),
      newDataKeys: Object.keys(initialData),
      timestamp: Date.now()
    });
    
    // Keep track of temp items that should be preserved
    const tempItems: Record<string, TreeItemType> = {};
    Object.keys(data).forEach(key => {
      if (key.startsWith('folder-temp-') || key.startsWith('file-temp-')) {
        tempItems[key] = data[key];
      }
    });
    
    // Clear existing data
    Object.keys(data).forEach(key => delete data[key]);
    
    // Add initial data
    Object.assign(data, initialData);
    
    // Re-add temp items that aren't in initialData
    Object.keys(tempItems).forEach(key => {
      if (!data[key]) {
        data[key] = tempItems[key];
        
        // Also ensure temp item is in parent's children array
        const tempItem = tempItems[key];
        if (tempItem.parentId && data[tempItem.parentId]) {
          const parent = data[tempItem.parentId];
          if (parent.type === 'folder') {
            const folderParent = parent as TreeFolderItem;
            if (folderParent.children && !folderParent.children.includes(key)) {
              folderParent.children.push(key);
            }
          }
        }
      }
    });
    
    console.log('🟡 [FileTree] Data initialized, final keys:', Object.keys(data));
  }, [initialData, data, updateCounter]); // Include updateCounter to re-sync on force updates

  // Only log when tree is actually being created (first render)
  React.useEffect(() => {
    console.log('🟢 [FileTree] Tree component mounted:', {
      treeId,
      rootId,
      dataKeys: Object.keys(data),
      timestamp: Date.now()
    });
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
    onDrop: createTreeDropHandler(data),
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
    canDropForeignDragObject: (_: any, target: any) => target.item.isFolder(),
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
  }), [rootId, syncDataLoader, onRename, onDropForeignDragObject, onCompleteForeignDrop, customClickBehavior, clearSelectionOnRootClick, initialExpandedItems, initialSelectedItems, initialCheckedItems]);
  
  const tree = useTree<TreeItemType>(treeConfig);

  // Call onTreeReady when tree is created with treeId attached
  React.useEffect(() => {
    if (onTreeReady && tree) {
      console.log('🟣 [FileTree] Tree ready, calling onTreeReady:', {
        treeId,
        itemCount: tree.getItems().length,
        timestamp: Date.now()
      });
      // Store the treeId association in the WeakMap
      treeIdMap.set(tree, treeId);
      onTreeReady(tree);
    }
  }, [tree, onTreeReady, treeId]);
  
  // Rebuild tree after data changes to ensure UI reflects latest data
  // This is the mechanism that prevents items from disappearing
  React.useEffect(() => {
    const dataLength = Object.keys(data).length;
    console.log('🟠 [FileTree] Data change detection effect:', {
      treeId,
      hasTree: !!tree,
      dataLength,
      dataKeys: Object.keys(data).slice(0, 5), // Show first 5 keys
      timestamp: Date.now()
    });
    
    if (tree && dataLength > 0) {
      console.log('🟠 [FileTree] Scheduling auto rebuildTree in 10ms');
      // Small delay to ensure data mutations are complete
      const timer = setTimeout(() => {
        console.log('🔴 [FileTree] EXECUTING auto rebuildTree NOW!', {
          treeId,
          itemCountBefore: tree.getItems().length,
          timestamp: Date.now()
        });
        tree.rebuildTree();
        console.log('🔴 [FileTree] Auto rebuildTree COMPLETED!', {
          treeId,
          itemCountAfter: tree.getItems().length,
          timestamp: Date.now()
        });
      }, 10);
      return () => {
        console.log('🟠 [FileTree] Cleanup: Cancelling scheduled auto rebuild');
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
    <div className='flex h-full flex-col gap-2 *:first:grow'>
      {/* Tree Container - MUST have getContainerProps for drag/drop to work! */}
      <div 
        {...tree.getContainerProps()} 
        className='tree'
        onClick={(e) => {
          // Check if the click is directly on the container (empty space)
          if (e.target === e.currentTarget) {
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
        ) : (
          (() => {
            const items = tree.getItems();
            console.log('🎆 [FileTree] RENDERING tree items:', {
              treeId,
              totalItems: items.length,
              itemIds: items.map(i => i.getId()).slice(0, 5), // First 5 IDs
              searchQuery,
              filteredItemsCount: filteredItems.length,
              timestamp: Date.now()
            });
            return items.map(item => {
            const itemData = item.getItemData();
            const itemId = item.getId();
            const isVisible = !searchQuery || filteredItems.includes(itemId);
            
            // Check if this is the last child of its parent
            const parent = item.getParent();
            const isLastChild = parent ? 
              parent.getChildren()[parent.getChildren().length - 1]?.getId() === itemId : 
              false;

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
                    <TreeItemRenderer
                      item={itemData}
                      itemInstance={item}
                      showFileSize={showFileSize}
                      showFileDate={showFileDate}
                      showFileStatus={showFileStatus}
                      showFolderCount={showFolderCount}
                      showFolderSize={showFolderSize}
                    />
                  </button>
                </div>
                )}
              </React.Fragment>
            ) : null;
          });
          })()
        )}
        {tree.getDragLineStyle && tree.getDragLineStyle() && (
          <div style={tree.getDragLineStyle()} className='dragline' />
        )}
      </div>
    </div>
  );
}
