'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TreeItem } from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';
import { createFolderAction } from '../actions';
import { generateLinkFromFolderAction } from '@/features/links/lib/actions';
import { generateLinkUrl } from '@/lib/config/url-config';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import { sanitizeInput } from '@/lib/utils/validation';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';

/**
 * Context Menu Handler Hook
 * Manages context menu logic and actions for tree items
 * 
 * Responsibilities:
 * - Determine menu item visibility based on item type and selection
 * - Handle menu action execution (folder creation, link generation)
 * - Process single vs multi-selection logic
 * - Return menu configuration (not JSX)
 */

export interface BatchOperationItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

export type MenuItemType = 'rename' | 'delete' | 'newFolder' | 'generateLink' | 'separator';

export interface MenuItemConfig {
  type: MenuItemType;
  label: string;
  destructive?: boolean;
  action?: () => void | Promise<void>;
}

interface UseContextMenuHandlerProps {
  workspaceId?: string;
  treeInstance: any;
  setItemsToDelete: (items: BatchOperationItem[]) => void;
  setShowDeleteModal: (show: boolean) => void;
  createFolder?: (name: string, parentId?: string) => Promise<void>;
}

interface ContextMenuHandler {
  getMenuItems: (item: TreeItem, itemInstance: any) => MenuItemConfig[] | null;
  handleNewFolder: (parentId: string) => Promise<void>;
  handleGenerateLink: (item: TreeItem) => Promise<void>;
  handleDelete: (item: TreeItem, itemInstance: any) => void;
}

export function useContextMenuHandler({
  workspaceId,
  treeInstance,
  setItemsToDelete,
  setShowDeleteModal,
  createFolder,
}: UseContextMenuHandlerProps): ContextMenuHandler {
  const queryClient = useQueryClient();
  
  /**
   * Handle new folder creation
   */
  const handleNewFolder = useCallback(async (parentId: string) => {
    // Prompt for folder name
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;
    
    // If createFolder handler is provided, use it (it handles all logic including sanitization)
    if (createFolder) {
      try {
        await createFolder(folderName, parentId);
      } catch (error) {
        // Error notification is already handled by the createFolder handler
      }
      return;
    }
    
    // Fallback to inline implementation if no handler provided
    // Sanitize the folder name to prevent XSS
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
    
    try {
      // Create folder inside the selected folder
      const result = await createFolderAction(sanitizedFolderName, parentId);
      
      if (result.success && result.data) {
        // Add to tree immediately for responsive UI
        if (treeInstance?.addFolderToTree) {
          treeInstance.addFolderToTree(result.data);
        }
        
        // Use event-driven notification system
        eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
          folderId: result.data.id,
          folderName: result.data.name,
          parentId: parentId,
        });
      } else {
        eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
          folderId: '',
          folderName: sanitizedFolderName,
          parentId: parentId,
          error: result.error || 'Failed to create folder',
        });
      }
    } catch (error) {
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: sanitizedFolderName,
        parentId: parentId,
        error: error instanceof Error ? error.message : 'Failed to create folder',
      });
    }
  }, [treeInstance, createFolder]);

  /**
   * Handle link generation for folders
   */
  const handleGenerateLink = useCallback(async (item: TreeItem) => {
    try {
      const result = await generateLinkFromFolderAction({ folderId: item.id });
      
      if (result.success && result.data) {
        // Build the link URL
        const linkUrl = generateLinkUrl(
          result.data.slug,
          result.data.topic || null,
          { absolute: true }
        );
        
        // Invalidate both workspace and link queries to ensure UI updates everywhere
        // This ensures the link icon appears immediately on the folder
        await queryClient.invalidateQueries({
          queryKey: ['workspace', 'data'],
        });
        // This ensures the new link card appears in the links feature
        await queryClient.invalidateQueries({
          queryKey: ['links'],
        });
        
        // Use event-driven notification system for success
        // This is the centralized way to handle notifications
        eventBus.emitNotification(NotificationEventType.LINK_GENERATE_SUCCESS, {
          linkId: result.data.id,
          linkTitle: result.data.title || item.name,
          linkUrl: linkUrl,
          linkType: 'generated' as const,
          folderName: item.name,
        });
      } else {
        // Use event-driven notification system for error
        eventBus.emitNotification(NotificationEventType.LINK_GENERATE_ERROR, {
          linkId: '',
          linkTitle: item.name,
          folderName: item.name,
          error: result.error || 'Failed to generate link',
        });
      }
    } catch (error) {
      eventBus.emitNotification(NotificationEventType.LINK_GENERATE_ERROR, {
        linkId: '',
        linkTitle: item.name,
        folderName: item.name,
        error: error instanceof Error ? error.message : 'Failed to generate link',
      });
    }
  }, [queryClient]);

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
      // Delete all selected items
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
      // Just delete the right-clicked item
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
    // Don't show context menu for workspace root
    if (item.id === workspaceId) {
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

      menuItems.push({
        type: 'generateLink',
        label: 'Generate Link',
        action: () => handleGenerateLink(item),
      });
    }

    return menuItems;
  }, [workspaceId, handleDelete, handleNewFolder, handleGenerateLink]);

  return {
    getMenuItems,
    handleNewFolder,
    handleGenerateLink,
    handleDelete,
  };
}