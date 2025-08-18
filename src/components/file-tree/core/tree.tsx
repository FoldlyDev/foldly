'use client';

import React from 'react';
import './tree.css';
import {
  type DragTarget,
  type ItemInstance,
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
  checkboxesFeature,
} from '@headless-tree/core';
import { AssistiveTreeDescription, useTree } from '@headless-tree/react';
import { cn } from '@/lib/utils/utils';
import { FolderIcon, FolderOpenIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Input } from '@/components/ui/shadcn/input';
import { getFileIcon } from '../sub-components/file';
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
} from './tree-orchestrator';
import {
  type TreeItem as TreeItemType,
  isFolder,
  isFile,
} from '../types/tree-types';
import { createTreeData } from '../utils/tree-data';

// Create data outside component - exactly like the example
const { syncDataLoader, data } = createTreeData<TreeItemType>();
let newItemId = 0;

const insertNewItem = (dataTransfer: DataTransfer) => {
  const newId = `new-${newItemId++}`;
  const itemName = dataTransfer.getData('text/plain') || 'New Item';
  const itemType = dataTransfer.getData('item-type') || 'file';
  
  if (itemType === 'folder') {
    data[newId] = {
      id: newId,
      name: itemName,
      type: 'folder',
      path: '/' + itemName,
      depth: 1,
      children: [],
    } as TreeItemType;
  } else {
    // Get file metadata if available
    const fileSize = parseInt(dataTransfer.getData('file-size') || '0');
    const fileType = dataTransfer.getData('file-type') || 'text/plain';
    
    data[newId] = {
      id: newId,
      name: itemName,
      type: 'file',
      mimeType: fileType,
      fileSize: fileSize,
      extension: itemName.includes('.') ? itemName.split('.').pop() : null,
    } as TreeItemType;
  }
  
  return newId;
};

const onDropForeignDragObject = (
  dataTransfer: DataTransfer,
  target: DragTarget<TreeItemType>
) => {
  const newId = insertNewItem(dataTransfer);
  insertItemsAtTarget([newId], target, (item, newChildrenIds) => {
    const itemData = data[item.getId()];
    if (itemData && 'children' in itemData) {
      (itemData as any).children = newChildrenIds;
    }
  });
};

const onCompleteForeignDrop = (items: ItemInstance<TreeItemType>[]) =>
  removeItemsFromParents(items, (item, newChildren) => {
    const itemData = item.getItemData();
    if ('children' in itemData) {
      (itemData as any).children = newChildren;
    }
  });

const onRename = (item: ItemInstance<TreeItemType>, value: string) => {
  const itemData = data[item.getId()];
  if (itemData) {
    itemData.name = value;
  }
};

// Export helper functions for programmatic tree manipulation
// Use insertItemsAtTarget just like the drag handler does!
export const addTreeItem = (treeInstance: any, parentId: string, item: TreeItemType) => {
  // First add the item to data
  data[item.id] = item;
  
  // Now use insertItemsAtTarget just like drag drop does!
  const parentItem = treeInstance.getItemInstance(parentId);
  if (parentItem) {
    // Simple target - just the item (will drop inside it)
    const target: DragTarget<TreeItemType> = {
      item: parentItem,
    };
    
    // Use the same function that drag drop uses!
    insertItemsAtTarget([item.id], target, (item, newChildrenIds) => {
      const itemData = data[item.getId()];
      if (itemData && 'children' in itemData) {
        (itemData as any).children = newChildrenIds;
      }
    });
  }
};

export const removeTreeItem = (itemId: string) => {
  // Remove from parent's children
  Object.values(data).forEach((item: any) => {
    if (item.children && item.children.includes(itemId)) {
      item.children = item.children.filter((id: string) => id !== itemId);
    }
  });
  
  // Delete the item
  delete data[itemId];
  // That's it! The tree will re-render automatically via syncDataLoader
};

// Helper function to get CSS classes for tree items
const getCssClass = (item: ItemInstance<TreeItemType>) =>
  cn('treeitem', {
    focused: item.isFocused(),
    expanded: item.isExpanded(),
    selected: item.isSelected(),
    folder: item.isFolder(),
    drop: item.isDragTarget(),
    searchmatch: item.isMatchingSearch(),
  });

interface FileTreeProps {
  rootId: string;
  initialData: Record<string, TreeItemType>;
  initialExpandedItems?: string[];
  initialSelectedItems?: string[];
  initialCheckedItems?: string[];
  onTreeReady?: (tree: any) => void;
}

export default function FileTree({
  rootId,
  initialData,
  initialExpandedItems = [],
  initialSelectedItems = [],
  initialCheckedItems = [],
  onTreeReady,
}: FileTreeProps) {
  // Initialize data with provided initial data
  React.useEffect(() => {
    Object.keys(data).forEach(key => delete data[key]);
    Object.assign(data, initialData);
  }, [initialData]);

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
      return !!('children' in itemData && itemData.children) || isFolder(itemData);
    },
    canReorder: true,
    onDrop: createOnDropHandler((item, newChildren) => {
      // Exactly like the example - direct assignment
      const targetItem = data[item.getId()];
      if (targetItem) {
        (targetItem as any).children = newChildren;
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

  // Call onTreeReady when tree is created
  React.useEffect(() => {
    if (onTreeReady && tree) {
      onTreeReady(tree);
    }
  }, [tree, onTreeReady]);

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
                    style={{ paddingLeft: `${item.getItemMeta().level * 20}px` }}
                    className='flex-1'
                  >
                    <div className={getCssClass(item)}>
                      <span className='flex items-center gap-2'>
                        {(() => {
                          if (isFolder(itemData)) {
                            return item.isExpanded() ? (
                              <FolderOpenIcon className='size-4 text-muted-foreground' />
                            ) : (
                              <FolderIcon className='size-4 text-muted-foreground' />
                            );
                          } else if (isFile(itemData)) {
                            const FileIconComponent = getFileIcon(
                              itemData.mimeType,
                              itemData.extension
                            );
                            return (
                              <FileIconComponent className='size-4 text-muted-foreground' />
                            );
                          }
                          return null;
                        })()}
                        <span className='truncate'>{item.getItemName()}</span>
                      </span>
                    </div>
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