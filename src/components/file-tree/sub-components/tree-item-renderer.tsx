'use client';

import React from 'react';
import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';
import { isFolder, isFile } from '../types/tree-types';
import { File } from './file';
import { Folder } from './folder';
import type { TreeFileItem, TreeFolderItem } from '../types/display-types';

/**
 * Maps TreeItem data to display component props
 * Bridges the gap between headless-tree data and our display components
 */
function mapToFileDisplayItem(
  item: TreeItemType,
  itemInstance: ItemInstance<TreeItemType>
): TreeFileItem {
  if (!isFile(item)) {
    throw new Error('Item is not a file');
  }

  return {
    // Core fields from TreeItem
    id: item.id,
    fileName: item.name,
    originalName: item.name,
    fileSize: item.fileSize,
    mimeType: item.mimeType,
    extension: item.extension,
    
    // Processing status if available
    processingStatus: item.processingStatus,
    thumbnailPath: item.thumbnailPath,
    
    // Visual states from headless-tree
    isSelected: itemInstance.isSelected(),
    isFocused: itemInstance.isFocused(),
    isRenaming: itemInstance.isRenaming(),
  };
}

/**
 * Maps TreeItem data to folder display component props
 */
function mapToFolderDisplayItem(
  item: TreeItemType,
  itemInstance: ItemInstance<TreeItemType>
): TreeFolderItem {
  if (!isFolder(item)) {
    throw new Error('Item is not a folder');
  }

  return {
    // Core fields from TreeItem
    id: item.id,
    name: item.name,
    path: item.path,
    depth: item.depth,
    parentFolderId: item.parentId ?? null,  // Ensure undefined becomes null
    
    // Statistics if available
    fileCount: item.fileCount,
    totalSize: item.totalSize,
    isArchived: item.isArchived,
    
    // Visual states from headless-tree
    isExpanded: itemInstance.isExpanded(),
    isSelected: itemInstance.isSelected(),
    isFocused: itemInstance.isFocused(),
    isRenaming: itemInstance.isRenaming(),
    hasChildren: itemInstance.isFolder(),  // All folders can potentially have children
  };
}

interface TreeItemRendererProps {
  item: TreeItemType;
  itemInstance: ItemInstance<TreeItemType>;
  showFileSize?: boolean;
  showFileDate?: boolean;
  showFileStatus?: boolean;
  showFolderCount?: boolean;
  showFolderSize?: boolean;
}

/**
 * Renderer component that uses the appropriate sub-component
 * based on the item type (file or folder)
 */
export const TreeItemRenderer: React.FC<TreeItemRendererProps> = ({
  item,
  itemInstance,
  showFileSize = false,
  showFileDate = false,
  showFileStatus = false,
  showFolderCount = false,
  showFolderSize = false,
}) => {
  if (isFolder(item)) {
    const folderData = mapToFolderDisplayItem(item, itemInstance);
    return (
      <Folder
        folder={folderData}
        showIcon={true}
        showChevron={true}
        showFileCount={showFolderCount}
        showSize={showFolderSize}
      />
    );
  } else if (isFile(item)) {
    const fileData = mapToFileDisplayItem(item, itemInstance);
    return (
      <File
        file={fileData}
        showIcon={true}
        showSize={showFileSize}
        showDate={showFileDate}
        showStatus={showFileStatus}
      />
    );
  }

  // Fallback for unknown types (shouldn't happen but satisfies TypeScript)
  return <div className="text-sm">{(item as TreeItemType).name}</div>;
};