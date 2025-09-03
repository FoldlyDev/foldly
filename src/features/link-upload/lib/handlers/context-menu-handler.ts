'use client';

import { useCallback } from 'react';
import type { TreeItem } from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';
import { sanitizeInput } from '@/lib/utils/validation';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';

/**
 * Context Menu Handler Hook for Link Upload
 * Manages context menu logic for tree items during upload session
 * 
 * Responsibilities:
 * - Determine menu item visibility based on item type and selection
 * - Handle menu action execution (folder creation, rename, delete)
 * - Process single vs multi-selection logic
 * - Return menu configuration (not JSX)
 * 
 * Note: Link upload sessions don't support link generation
 */

export interface BatchOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export type MenuItemType = 'rename' | 'delete' | 'newFolder' | 'separator';

export interface MenuItemConfig {
  type: MenuItemType;
  label: string;
  destructive?: boolean;
  action?: () => void | Promise<void>;
}

interface UseContextMenuHandlerProps {
  linkId: string;
  treeInstance: any;
  setItemsToDelete: (items: BatchOperationItem[]) => void;
  setShowDeleteModal: (show: boolean) => void;
  createFolder?: (name: string, parentId?: string) => Promise<void>;
}

interface ContextMenuHandler {
  getMenuItems: (item: TreeItem, itemInstance: any) => MenuItemConfig[] | null;
  handleNewFolder: (parentId: string) => Promise<void>;
  handleDelete: (item: TreeItem, itemInstance: any) => void;
}

export function useContextMenuHandler({
  linkId,
  treeInstance,
  setItemsToDelete,
  setShowDeleteModal,
  createFolder,
}: UseContextMenuHandlerProps): ContextMenuHandler {
  
  /**
   * Handle new folder creation
   */
  const handleNewFolder = useCallback(async (parentId: string) => {
    // Prompt for folder name
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    
    // If createFolder handler is provided, use it
    if (createFolder) {
      try {
        await createFolder(folderName, parentId);
      } catch (error) {
        // Error notification is already handled by the createFolder handler
      }
      return;
    }
    
    // Fallback to inline implementation if no handler provided
    const sanitizedFolderName = sanitizeInput(folderName.trim());
    if (!sanitizedFolderName) {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: folderName || '',
        error: 'Invalid folder name',
      }, {
        priority: NotificationPriority.HIGH,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 3000,
      });
      return;
    }
    
    // For link upload, folders are created locally in the tree
    // Generate a temporary ID for the new folder
    const tempFolderId = `temp-folder-${Date.now()}`;
    
    // Add to tree immediately for responsive UI
    if (treeInstance?.addFolderToTree) {
      treeInstance.addFolderToTree({
        id: tempFolderId,
        name: sanitizedFolderName,
        parentId: parentId,
        type: 'folder' as const,
        depth: 0, // Will be calculated by tree
        path: '/', // Will be calculated by tree
        fileCount: 0,
        totalSize: 0,
        isArchived: false,
        sortOrder: 0,
        children: [],
      });
    }
    
    // Emit success notification
    eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
      folderId: tempFolderId,
      folderName: sanitizedFolderName,
      parentId: parentId,
    });
  }, [treeInstance, createFolder]);

  /**
   * Handle delete action
   */
  const handleDelete = useCallback((item: TreeItem, itemInstance: any) => {
    const tree = itemInstance?.getTree?.();
    const selectedTreeItems = tree?.getSelectedItems?.() || [];
    const isItemSelected = selectedTreeItems.some((si: any) => si.getId() === item.id);
    const isMultipleSelection = isItemSelected && selectedTreeItems.length > 1;
    
    let itemsToDeleteArray: BatchOperationItem[] = [];
    
    if (isMultipleSelection) {
      // Multiple items selected and the right-clicked item is one of them
      itemsToDeleteArray = selectedTreeItems.map((selectedItem: any) => {
        const itemData = selectedItem.getItemData();
        return {
          id: selectedItem.getId(),
          name: selectedItem.getItemName?.() || itemData?.name || 'Unknown',
          type: selectedItem.isFolder?.() ? 'folder' : 'file',
        } as BatchOperationItem;
      });
    } else {
      // Single item or right-clicked item is not in selection
      itemsToDeleteArray = [{
        id: item.id,
        name: item.name,
        type: isFolder(item) ? 'folder' : 'file',
      }];
    }
    
    setItemsToDelete(itemsToDeleteArray);
    setShowDeleteModal(true);
  }, [setItemsToDelete, setShowDeleteModal]);

  /**
   * Get menu items configuration for a tree item
   */
  const getMenuItems = useCallback((item: TreeItem, itemInstance: any): MenuItemConfig[] | null => {
    // Don't show context menu for link root
    if (item.id === linkId) {
      return null;
    }

    const menuItems: MenuItemConfig[] = [];
    
    // Get selected items to determine single vs multiple selection
    const tree = itemInstance?.getTree?.();
    const selectedTreeItems = tree?.getSelectedItems?.() || [];
    const isItemSelected = selectedTreeItems.some((si: any) => si.getId() === item.id);
    const isMultipleSelection = isItemSelected && selectedTreeItems.length > 1;
    const deleteCount = isMultipleSelection ? selectedTreeItems.length : 1;

    // Only show rename for single selection
    if (!isMultipleSelection) {
      menuItems.push({
        type: 'rename',
        label: 'Rename',
        action: () => {
          itemInstance.startRenaming();
        },
      });
    }

    // Delete is always available
    menuItems.push({
      type: 'delete',
      label: deleteCount > 1 ? `Delete ${deleteCount} items` : 'Delete',
      destructive: true,
      action: () => handleDelete(item, itemInstance),
    });

    // Folder-specific items - only show for single selection
    if (isFolder(item) && !isMultipleSelection) {
      menuItems.push({ type: 'separator', label: '' });

      menuItems.push({
        type: 'newFolder',
        label: 'New Folder',
        action: () => handleNewFolder(item.id),
      });
    }

    return menuItems;
  }, [linkId, handleDelete, handleNewFolder]);

  return {
    getMenuItems,
    handleNewFolder,
    handleDelete,
  };
}