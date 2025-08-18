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
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';

import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Input } from '@/components/ui/shadcn/input';
import { TreeItemRenderer } from '../sub-components/tree-item-renderer';
import {
  type TreeItem as TreeItemType,
  isFolder,
} from '../types/tree-types';
import { createTreeData } from '../utils/tree-data';
import { addTreeItem, removeTreeItem } from '../utils/tree-manipulation';
import { createTreeDropHandler } from '../handlers/drop-handler';
import { createRenameHandler } from '../handlers/rename-handler';
import { createForeignDropHandlers } from '../handlers/foreign-drop-handler';
import { createInsertNewItem } from '../handlers/insert-item-handler';

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
) => addTreeItem(treeInstance, parentId, item, treeId, getTreeData);

export const removeTreeItemExport = (
  treeInstance: any,
  itemIds: string[],
  treeId: string
) => removeTreeItem(treeInstance, itemIds, treeId, getTreeData);

// Re-export with original names for backward compatibility
export { addTreeItemExport as addTreeItem, removeTreeItemExport as removeTreeItem };

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
}: FileTreeProps) {
  // Get the data and syncDataLoader for this specific tree instance
  const { syncDataLoader, data } = React.useMemo(
    () => getTreeData(treeId),
    [treeId]
  );
  
  // Create instance-specific handlers
  const insertNewItem = React.useMemo(
    () => createInsertNewItem(data),
    [data]
  );
  
  const { onDropForeignDragObject, onCompleteForeignDrop } = React.useMemo(
    () => createForeignDropHandlers(data, insertNewItem),
    [data, insertNewItem]
  );

  const onRename = React.useMemo(
    () => createRenameHandler(data),
    [data]
  );
  
  // Initialize data with provided initial data
  React.useEffect(() => {
    Object.keys(data).forEach(key => delete data[key]);
    Object.assign(data, initialData);
  }, [initialData, data]);

  const tree = useTree<TreeItemType>({
    initialState: {
      expandedItems: initialExpandedItems,
      selectedItems: initialSelectedItems,
      checkedItems: initialCheckedItems,
    },
    rootItemId: rootId,
    getItemName: item => item.getItemData().name,
    isItemFolder: item => {
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
    createForeignDragObject: items => {
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
    canDropForeignDragObject: (_, target) => target.item.isFolder(),
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
    ],
  });

  // Call onTreeReady when tree is created with treeId attached
  React.useEffect(() => {
    if (onTreeReady && tree) {
      // Store the treeId association in the WeakMap
      treeIdMap.set(tree, treeId);
      onTreeReady(tree);
    }
  }, [tree, onTreeReady, treeId]);

  return (
    <div className='flex h-full flex-col gap-2 *:first:grow'>
      {/* Search Box */}
      {tree.isSearchOpen() && (
        <div className='searchbox'>
          <input {...tree.getSearchInputElementProps()} />
          <span>({tree.getSearchMatchingItems().length} matches)</span>
        </div>
      )}

      {/* Tree Container - MUST have getContainerProps for drag/drop to work! */}
      <div {...tree.getContainerProps()} className='tree'>
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map(item => {
          const itemData = item.getItemData();

          return (
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
                <div className='outeritem'>
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
          );
        })}
        <div style={tree.getDragLineStyle()} className='dragline' />
      </div>
    </div>
  );
}
