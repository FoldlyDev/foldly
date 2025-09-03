'use client';

import { useCallback } from 'react';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import { sanitizeInput } from '@/lib/utils/validation';

/**
 * Rename Handler Hook for Link Upload
 * Manages file and folder renaming operations during upload session
 * 
 * Responsibilities:
 * - Sanitize input names to prevent XSS
 * - Update local tree state (no database persistence)
 * - Emit success/error notifications
 * - Handle error cases with proper notifications
 * 
 * Note: All operations are local to the upload session
 */

export type RenameCallback = (
  itemId: string, 
  newName: string, 
  itemType: 'file' | 'folder'
) => Promise<void>;

interface UseRenameHandlerProps {
  treeInstance: any;
}

interface RenameHandler {
  renameCallback: RenameCallback;
}

export function useRenameHandler({ treeInstance }: UseRenameHandlerProps): RenameHandler {
  
  /**
   * Create rename operation callback for local tree updates
   */
  const renameCallback = useCallback(
    async (itemId: string, newName: string, itemType: 'file' | 'folder') => {
      // Sanitize the new name to prevent XSS
      const sanitizedName = sanitizeInput(newName);
      if (!sanitizedName) {
        eventBus.emitNotification(
          NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR,
          {
            folderId: itemId,
            folderName: newName,
            error: 'Invalid name provided',
          },
          {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 3000,
          }
        );
        return;
      }

      try {
        // For link upload, renaming is handled locally by the tree
        // Update the tree instance directly
        if (treeInstance?.updateItemName) {
          treeInstance.updateItemName(itemId, sanitizedName);
        }
        
        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Emit success notification
        if (itemType === 'folder') {
          eventBus.emitNotification(
            NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS,
            {
              folderId: itemId,
              folderName: sanitizedName,
            },
            {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            }
          );
        } else {
          eventBus.emitNotification(
            NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS,
            {
              fileId: itemId,
              fileName: sanitizedName,
              fileSize: 0,
            },
            {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            }
          );
        }
      } catch (error) {
        // Use event-driven error notification
        const errorMessage =
          error instanceof Error
            ? error.message
            : `Failed to rename ${itemType}`;

        eventBus.emitNotification(
          itemType === 'folder'
            ? NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR
            : NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
          {
            ...(itemType === 'folder'
              ? { folderId: itemId, folderName: newName }
              : { fileId: itemId, fileName: newName, fileSize: 0 }),
            error: errorMessage,
          },
          {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          }
        );

        throw error; // Re-throw to prevent local state update
      }
    },
    [treeInstance]
  );

  return {
    renameCallback,
  };
}