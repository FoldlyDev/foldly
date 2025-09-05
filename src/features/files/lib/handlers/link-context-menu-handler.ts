'use client';

import { useCallback } from 'react';
import type { TreeItem } from '@/components/file-tree/types';
import { isFolder, isFile } from '@/components/file-tree/types';
import type { ContextMenuItem, ContextMenuProvider } from '@/components/file-tree/core/tree';

/**
 * Link Context Menu Handler Hook
 * Manages context menu for interactive link trees (base and topic links)
 * 
 * Responsibilities:
 * - Provide context menu items based on item type and selection
 * - Handle file operations (download, rename, delete)
 * - Handle folder operations (create, rename, delete)
 * - Support single and multi-selection logic
 */

export interface LinkContextMenuHandlerProps {
  linkId: string;
  treeInstance: any;
  onRename?: (itemId: string, newName: string) => Promise<void>;
  onDelete?: (itemIds: string[]) => Promise<void>;
  onDownload?: (itemIds: string[]) => Promise<void>;
  onCreateFolder?: (parentId: string, name: string) => Promise<void>;
}

interface LinkContextMenuHandler {
  contextMenuProvider: ContextMenuProvider;
}

export function useLinkContextMenuHandler({
  linkId,
  treeInstance,
  onRename,
  onDelete,
  onDownload,
  onCreateFolder,
}: LinkContextMenuHandlerProps): LinkContextMenuHandler {
  
  /**
   * Create context menu provider for link trees
   */
  const contextMenuProvider: ContextMenuProvider = useCallback(
    (item: TreeItem, itemInstance: any) => {
      const menuItems: ContextMenuItem[] = [];
      
      // Get selected items to determine if multi-selection
      // Note: getSelectedItems returns tree item instances, not raw items
      const tree = itemInstance?.getTree?.();
      const selectedTreeItems = tree?.getSelectedItems?.() || [];
      const selectedItemIds = selectedTreeItems.map((selectedItem: any) => selectedItem.getId());
      const isMultipleSelection = selectedTreeItems.length > 1;
      
      // For files
      if (isFile(item)) {
        // Download is always available
        menuItems.push({
          label: isMultipleSelection ? 'Download Files' : 'Download',
          onClick: async () => {
            const itemsToDownload = isMultipleSelection ? selectedItemIds : [item.id];
            await onDownload?.(itemsToDownload);
          },
        });
        
        // Rename only for single selection
        if (!isMultipleSelection && onRename) {
          menuItems.push({
            label: 'Rename',
            onClick: async () => {
              const newName = prompt('Enter new name:', item.name);
              if (newName && newName !== item.name) {
                await onRename(item.id, newName);
              }
            },
          });
        }
        
        // Separator before destructive action
        menuItems.push({ separator: true });
        
        // Delete
        if (onDelete) {
          menuItems.push({
            label: isMultipleSelection ? 'Delete Files' : 'Delete',
            destructive: true,
            onClick: async () => {
              const itemsToDelete = isMultipleSelection ? selectedItemIds : [item.id];
              if (confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`)) {
                await onDelete(itemsToDelete);
              }
            },
          });
        }
      }
      
      // For folders
      if (isFolder(item)) {
        // Create new folder (single selection only)
        if (!isMultipleSelection && onCreateFolder) {
          menuItems.push({
            label: 'New Folder',
            onClick: async () => {
              const folderName = prompt('Enter folder name:');
              if (folderName && folderName.trim()) {
                await onCreateFolder(item.id, folderName.trim());
              }
            },
          });
        }
        
        // Download folder contents
        if (onDownload) {
          menuItems.push({
            label: isMultipleSelection ? 'Download Folders' : 'Download Folder',
            onClick: async () => {
              const itemsToDownload = isMultipleSelection ? selectedItemIds : [item.id];
              await onDownload(itemsToDownload);
            },
          });
        }
        
        // Rename (single selection only)
        if (!isMultipleSelection && onRename) {
          menuItems.push({
            label: 'Rename',
            onClick: async () => {
              const newName = prompt('Enter new name:', item.name);
              if (newName && newName !== item.name) {
                await onRename(item.id, newName);
              }
            },
          });
        }
        
        // Separator before destructive action
        menuItems.push({ separator: true });
        
        // Delete
        if (onDelete) {
          menuItems.push({
            label: isMultipleSelection ? 'Delete Folders' : 'Delete Folder',
            destructive: true,
            onClick: async () => {
              const itemsToDelete = isMultipleSelection ? selectedItemIds : [item.id];
              const itemType = isMultipleSelection ? 'items' : 'folder and its contents';
              if (confirm(`Are you sure you want to delete ${itemsToDelete.length} ${itemType}?`)) {
                await onDelete(itemsToDelete);
              }
            },
          });
        }
      }
      
      return menuItems.length > 0 ? menuItems : null;
    },
    [linkId, onRename, onDelete, onDownload, onCreateFolder]
  );
  
  return {
    contextMenuProvider,
  };
}