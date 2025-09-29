'use client';

import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WorkspaceTree } from '../trees/workspace-tree';
import { copyLinkItemsToWorkspaceAction, type CopyItem } from '../../lib/actions/copy-to-workspace-actions';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import type { WorkspacePanelProps } from '../../types/workspace';

export function WorkspacePanel({ isReadOnly, onFileDrop }: WorkspacePanelProps) {
  const queryClient = useQueryClient();
  const [, setIsCopying] = useState(false);
  
  // Handle copying items from link trees to workspace
  const handleCopyToWorkspace = useCallback(async (items: any[], targetFolderId: string, workspaceId?: string) => {
    // Extract linkId from the first item or from drag data
    // Items should have linkId property from the drag operation
    const linkId = items[0]?.linkId;
    
    if (!linkId) {
      toast.error('Unable to determine source link');
      return;
    }

    // Convert items to CopyItem format
    const copyItems: CopyItem[] = items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type === 'folder' ? 'folder' : 'file',
    }));

    setIsCopying(true);
    
    // Show loading notification using copy events
    const copyBatchId = `copy-to-workspace-${Date.now()}`;
    eventBus.emitNotification(
      NotificationEventType.WORKSPACE_ITEMS_COPY_START,
      {
        batchId: copyBatchId,
        totalItems: copyItems.length,
        completedItems: 0,
        items: copyItems.map((item: CopyItem) => ({ 
          id: item.id, 
          name: item.name, 
          type: item.type as 'file' | 'folder' 
        })),
      },
      {
        priority: NotificationPriority.MEDIUM,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 0, // Keep showing until complete
      }
    );
    
    try {
      // Handle special case for workspace root
      // When dropping on the workspace root node, targetFolderId will be the workspace ID
      // We need to pass null to copy to the root
      // Check if targetFolderId is the workspace root ID (passed from tree)
      const isWorkspaceRoot = workspaceId && targetFolderId === workspaceId;
      
      const actualTargetFolderId = isWorkspaceRoot ? null : targetFolderId;
      
      const result = await copyLinkItemsToWorkspaceAction(
        copyItems,
        linkId,
        actualTargetFolderId
      );

      if (!result) {
        toast.error('Server action failed to respond');
        return;
      }

      if (result.success && result.data) {
        const { copiedFiles, copiedFolders, failedItems } = result.data;
        
        // Use centralized invalidation service to update all workspace queries
        await QueryInvalidationService.invalidateWorkspaceData(queryClient);

        // Show success message
        if (failedItems.length === 0) {
          const message = [];
          if (copiedFiles > 0) message.push(`${copiedFiles} file${copiedFiles > 1 ? 's' : ''}`);
          if (copiedFolders > 0) message.push(`${copiedFolders} folder${copiedFolders > 1 ? 's' : ''}`);
          
          toast.success(`Successfully copied ${message.join(' and ')} to workspace`);
        } else {
          toast.warning(
            `Copied ${copiedFiles} files and ${copiedFolders} folders. ${failedItems.length} items failed.`
          );
        }
      } else {
        toast.error(result.error || 'Failed to copy items to workspace');
      }
      return; // Return after successful operation
    } catch (error) {
      console.error('Failed to copy items:', error);
      toast.error('An unexpected error occurred while copying items');
    } finally {
      setIsCopying(false);
    }
  }, [queryClient]);

  // Handle external file drops (OS files)
  const handleExternalFileDrop = useCallback((files: File[], targetFolderId: string | null, folderStructure?: { [folder: string]: File[] }) => {
    if (onFileDrop) {
      // Convert null to undefined for the parent handler
      onFileDrop(files, targetFolderId ?? undefined);
    }
  }, [onFileDrop]);

  return (
    <div className="workspace-panel-container">
      <div className="workspace-panel-header">
        <h2 className="workspace-panel-title">Personal Space</h2>
      </div>

      <div className="workspace-panel-content">
        <WorkspaceTree 
          onCopyToWorkspace={handleCopyToWorkspace}
          {...(!isReadOnly && { onExternalFileDrop: handleExternalFileDrop })}
        />
      </div>
    </div>
  );
}