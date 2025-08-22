'use client';

import React from 'react';
import type { ItemInstance } from '@headless-tree/core';
import type { LinkTreeItem } from '../../lib/tree-data';
import { LinkTreeNode } from './LinkTreeNode';

interface StagedItemsContainerProps {
  items: ItemInstance<LinkTreeItem>[];
  onDownload?: (item: ItemInstance<LinkTreeItem>) => void;
}

export function StagedItemsContainer({ items, onDownload }: StagedItemsContainerProps) {
  if (items.length === 0) {
    return null;
  }

  // Recursive function to count all items including nested ones
  const countItemsRecursively = (itemsList: ItemInstance<LinkTreeItem>[]): { files: number; folders: number } => {
    let fileCount = 0;
    let folderCount = 0;
    
    for (const item of itemsList) {
      // Add null checks for safety
      if (!item || typeof item.getItemData !== 'function') {
        console.warn('Invalid item in staged items list:', item);
        continue;
      }
      
      const itemData = item.getItemData();
      
      // Skip if no item data
      if (!itemData) {
        console.warn('Item has no data:', item.getId?.());
        continue;
      }
      
      if (itemData.isFile === true) {
        fileCount++;
      } else {
        folderCount++;
        // Count children recursively for folders
        if (typeof item.getChildren === 'function') {
          const children = item.getChildren();
          if (children && Array.isArray(children) && children.length > 0) {
            // Filter out any null/undefined children before recursing
            const validChildren = children.filter(child => child != null);
            if (validChildren.length > 0) {
              const childCounts = countItemsRecursively(validChildren);
              fileCount += childCounts.files;
              folderCount += childCounts.folders;
            }
          }
        }
      }
    }
    
    return { files: fileCount, folders: folderCount };
  };

  // Count all items recursively
  const { files: fileCount, folders: folderCount } = countItemsRecursively(items);

  // Build the count text
  const countParts: string[] = [];
  if (fileCount > 0) {
    countParts.push(`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`);
  }
  if (folderCount > 0) {
    countParts.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
  }
  const countText = countParts.join(' and ');

  return (
    <div className="mb-4 p-3 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center gap-2 mb-2 px-2">
        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
          Staged for Upload ({countText})
        </span>
      </div>
      <div className="space-y-0.5">
        {items.map((item, index) => {
          // Skip invalid items
          if (!item || typeof item.getItemData !== 'function' || typeof item.getId !== 'function') {
            console.warn(`Invalid staged item at index ${index}:`, item);
            return null;
          }
          
          const itemData = item.getItemData();
          const stagingStatus = itemData?.stagingStatus;

          return (
            <LinkTreeNode
              key={item.getId()}
              item={item}
              onDownload={onDownload}
              isStaged={true}
              stagingStatus={stagingStatus}
            />
          );
        }).filter(Boolean)}
      </div>
    </div>
  );
}