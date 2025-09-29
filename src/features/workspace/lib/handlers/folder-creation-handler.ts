'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolderAction } from '../actions';
import { workspaceQueryKeys } from '../query-keys';
import { eventBus, NotificationEventType } from '@/features/notifications/core';
import { sanitizeInput } from '@/lib/utils/validation';

/**
 * Folder Creation Handler Hook
 * Focused handler for folder creation operations only
 * 
 * Responsibilities:
 * - Get selected parent folder from tree
 * - Validate folder names
 * - Create folders with proper parent selection
 * - Update tree optimistically after creation
 * - Handle errors and emit notifications
 * 
 * Note: Other folder operations are handled by:
 * - Rename: Rename Handler (handles both files and folders)
 * - Delete: Inline or batch operations
 * - Move: Drag-Drop Handler
 */

interface UseFolderCreationHandlerProps {
  treeInstance: any;
}

interface FolderCreationHandler {
  createFolder: (name: string, parentId?: string) => Promise<void>;
  createFolderMutation: ReturnType<typeof useMutation<any, Error, { name: string; parentId?: string }>>;
  getSelectedParentId: () => string | undefined;
  validateFolderName: (name: string) => { valid: boolean; error?: string };
}

export function useFolderCreationHandler({
  treeInstance,
}: UseFolderCreationHandlerProps): FolderCreationHandler {
  const queryClient = useQueryClient();

  /**
   * Get the selected parent folder ID from tree
   * Matches the toolbar logic: gets the first selected item's ID
   */
  const getSelectedParentId = useCallback(() => {
    const selectedItems = treeInstance?.getSelectedItems?.() || [];
    const parentFolderId = selectedItems.length > 0 ? selectedItems[0]?.getId() : undefined;
    return parentFolderId;
  }, [treeInstance]);

  /**
   * Validate folder name
   */
  const validateFolderName = useCallback((name: string): { valid: boolean; error?: string } => {
    if (!name || !name.trim()) {
      return { valid: false, error: 'Folder name cannot be empty' };
    }
    
    const trimmed = name.trim();
    
    // Check for invalid characters (filesystem-safe)
    if (/[<>:"|?*\/\\]/.test(trimmed)) {
      return { valid: false, error: 'Folder name contains invalid characters' };
    }
    
    // Check length
    if (trimmed.length > 255) {
      return { valid: false, error: 'Folder name is too long (max 255 characters)' };
    }
    
    // Check for reserved names (Windows compatibility)
    const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                      'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                      'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reserved.includes(trimmed.toUpperCase())) {
      return { valid: false, error: 'This folder name is reserved by the system' };
    }
    
    // Check for dots at the end (Windows strips these)
    if (trimmed.endsWith('.')) {
      return { valid: false, error: 'Folder name cannot end with a period' };
    }
    
    return { valid: true };
  }, []);

  /**
   * Create folder mutation with all the complex logic
   * Matches the toolbar's tree update pattern
   */
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      // Sanitize and validate
      const sanitizedName = sanitizeInput(name.trim());
      const validation = validateFolderName(sanitizedName);
      
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Don't add to tree immediately - addFolder returns null to indicate server action should handle it
      const tempId = treeInstance?.addFolder?.(sanitizedName, parentId);
      
      // Call the server action
      const result = await createFolderAction(sanitizedName, parentId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      
      // If we didn't add a temp folder (tempId is null), add the real folder to tree now
      if (!tempId && result.data && treeInstance?.addFolderToTree) {
        console.log('Adding folder to tree with sortOrder:', result.data.sortOrder);
        treeInstance.addFolderToTree(result.data);
      }
      
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Don't invalidate queries immediately - the tree is already updated
      // Only invalidate to sync any other data that might depend on this
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.data(),
        refetchType: 'none', // Don't refetch immediately
      });
      
      // Emit success notification
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
        folderId: data?.id || '',
        folderName: data?.name || variables.name,
        parentId: variables.parentId || '',
      });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      
      // Emit error notification
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: variables.name,
        parentId: variables.parentId || '',
        error: errorMessage,
      });
      
      // Invalidate to sync with server state
      queryClient.invalidateQueries({ 
        queryKey: workspaceQueryKeys.data() 
      });
    },
  });

  /**
   * Main create folder function
   * Can be called with or without a parent ID
   * If no parent ID is provided, it will try to get it from the selected item
   */
  const createFolder = useCallback(async (name: string, parentId?: string) => {
    // Use provided parentId or get from selection
    const targetParentId = parentId !== undefined ? parentId : getSelectedParentId();
    
    // Execute the mutation
    await createFolderMutation.mutateAsync({ 
      name, 
      parentId: targetParentId 
    });
  }, [createFolderMutation, getSelectedParentId]);

  return {
    createFolder,
    createFolderMutation,
    getSelectedParentId,
    validateFolderName,
  };
}