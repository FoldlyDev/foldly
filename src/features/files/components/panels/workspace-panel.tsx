'use client';

import React, { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WorkspaceTree } from '../trees/workspace-tree';
import { copyLinkItemsToWorkspaceAction, type CopyItem } from '../../lib/actions/copy-to-workspace-actions';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';
import type { WorkspacePanelProps } from '../../types/workspace';
import type { CrossTreeDragData } from '../../lib/handlers/cross-tree-drag-handler';

export function WorkspacePanel({ isReadOnly, onFileDrop }: WorkspacePanelProps) {
  const queryClient = useQueryClient();
  const [isCopying, setIsCopying] = useState(false);
  
  // Handle copying items from link trees to workspace
  const handleCopyToWorkspace = useCallback(async (items: any[], targetFolderId: string) => {
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
    
    try {
      // Handle special case for workspace root
      const actualTargetFolderId = targetFolderId === 'workspace-root' ? null : targetFolderId;
      
      const result = await copyLinkItemsToWorkspaceAction(
        copyItems,
        linkId,
        actualTargetFolderId
      );

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
    } catch (error) {
      console.error('Failed to copy items:', error);
      toast.error('An unexpected error occurred while copying items');
    } finally {
      setIsCopying(false);
    }
  }, [queryClient]);

  // Handle external file drops (OS files)
  const handleExternalFileDrop = useCallback((files: File[], targetFolderId?: string) => {
    if (onFileDrop) {
      onFileDrop(files, targetFolderId);
    }
  }, [onFileDrop]);

  // Handle drag over for visual feedback
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Check if this is a cross-tree drag
    const dragData = e.dataTransfer.getData('application/x-cross-tree-drag');
    if (dragData) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      // Check for link drag (legacy)
      const linkId = e.dataTransfer.getData('linkId');
      if (linkId) {
        e.dataTransfer.dropEffect = 'copy';
      }
    }
  }, []);

  // Handle drops on the panel container (outside the tree)
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Try to parse cross-tree drag data
    try {
      const dragDataStr = e.dataTransfer.getData('application/x-cross-tree-drag');
      if (dragDataStr) {
        const dragData: CrossTreeDragData = JSON.parse(dragDataStr);
        console.log('Cross-tree drop received:', dragData);
        
        // Handle based on source type
        if (dragData.sourceType === 'link') {
          // Copy items from link to workspace root
          handleCopyToWorkspace(dragData.items, 'workspace-root');
        }
        return;
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
    
    // Fallback: Check for legacy link drag
    const linkId = e.dataTransfer.getData('linkId');
    if (linkId) {
      console.log('Link dropped:', linkId);
      // Handle legacy link drop
    }
  }, [handleCopyToWorkspace]);

  return (
    <div 
      className="workspace-panel-container"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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