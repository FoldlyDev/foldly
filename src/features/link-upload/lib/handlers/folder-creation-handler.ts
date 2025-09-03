'use client';

import { useCallback } from 'react';
import { eventBus, NotificationEventType } from '@/features/notifications/core';
import { sanitizeInput } from '@/lib/utils/validation';

/**
 * Folder Creation Handler Hook for Link Upload
 * Manages folder creation operations during upload session
 * 
 * Responsibilities:
 * - Get selected parent folder from tree
 * - Validate folder names
 * - Create folders locally in the tree
 * - Update tree optimistically
 * - Handle errors and emit notifications
 * 
 * Note: All operations are local to the upload session
 */

interface UseFolderCreationHandlerProps {
  treeInstance: any;
  linkId: string;
}

interface FolderCreationHandler {
  createFolder: (name: string, parentId?: string) => Promise<void>;
  getSelectedParentId: () => string | undefined;
  validateFolderName: (name: string) => { valid: boolean; error?: string };
}

export function useFolderCreationHandler({
  treeInstance,
  linkId,
}: UseFolderCreationHandlerProps): FolderCreationHandler {

  /**
   * Get the selected parent folder ID from tree
   */
  const getSelectedParentId = useCallback(() => {
    const selectedItems = treeInstance?.getSelectedItems?.() || [];
    // If no selection, use link root as parent
    const parentFolderId = selectedItems.length > 0 ? selectedItems[0]?.getId() : linkId;
    return parentFolderId;
  }, [treeInstance, linkId]);

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
   * Main create folder function
   */
  const createFolder = useCallback(async (name: string, parentId?: string) => {
    // Use provided parentId or get from selection
    const targetParentId = parentId !== undefined ? parentId : getSelectedParentId();
    
    // Sanitize and validate
    const sanitizedName = sanitizeInput(name.trim());
    const validation = validateFolderName(sanitizedName);
    
    if (!validation.valid) {
      // Emit error notification
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: name,
        parentId: targetParentId || '',
        error: validation.error || 'Invalid folder name',
      });
      throw new Error(validation.error);
    }
    
    // Generate a temporary ID for the new folder
    const tempFolderId = `temp-folder-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    try {
      // Add folder to tree locally
      if (treeInstance?.addFolderToTree) {
        treeInstance.addFolderToTree({
          id: tempFolderId,
          name: sanitizedName,
          parentId: targetParentId,
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
      
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Emit success notification
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
        folderId: tempFolderId,
        folderName: sanitizedName,
        parentId: targetParentId || '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      
      // Emit error notification
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
        folderId: '',
        folderName: sanitizedName,
        parentId: targetParentId || '',
        error: errorMessage,
      });
      
      throw error;
    }
  }, [treeInstance, getSelectedParentId, validateFolderName]);

  return {
    createFolder,
    getSelectedParentId,
    validateFolderName,
  };
}