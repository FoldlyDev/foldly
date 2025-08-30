'use client';

import { useCallback } from 'react';
import { renameFolderAction, renameFileAction } from '../actions';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import { sanitizeInput } from '@/lib/utils/validation';

/**
 * Rename Handler Hook
 * Manages file and folder renaming operations
 * 
 * Responsibilities:
 * - Sanitize input names to prevent XSS
 * - Call appropriate rename action (file vs folder)
 * - Emit success/error notifications
 * - Handle error cases with proper notifications
 * - Return callback for tree rename operations
 */

export type RenameCallback = (
  itemId: string, 
  newName: string, 
  itemType: 'file' | 'folder'
) => Promise<void>;

interface UseRenameHandlerProps {
  // No props needed for this handler as it's stateless
}

interface RenameHandler {
  renameCallback: RenameCallback;
}

export function useRenameHandler(_props?: UseRenameHandlerProps): RenameHandler {
  
  /**
   * Create rename operation callback for database persistence
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
        const result =
          itemType === 'folder'
            ? await renameFolderAction(itemId, sanitizedName)
            : await renameFileAction(itemId, sanitizedName);

        if (result.success) {
          // Use event-driven notifications
          if (itemType === 'folder') {
            eventBus.emitNotification(
              NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS,
              {
                folderId: itemId,
                folderName: newName,
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
                fileName: newName,
                fileSize: 0, // We don't have this info here
              },
              {
                priority: NotificationPriority.LOW,
                uiType: NotificationUIType.TOAST_SIMPLE,
                duration: 2000,
              }
            );
          }
        } else {
          throw new Error(result.error || `Failed to rename ${itemType}`);
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
    []
  );

  return {
    renameCallback,
  };
}