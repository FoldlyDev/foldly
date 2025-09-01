'use client';

import React, { useCallback } from 'react';
import { WorkspaceTree } from '../trees/workspace-tree';
import type { WorkspacePanelProps } from '../../types/workspace';
import type { CrossTreeDragData } from '../../lib/handlers/cross-tree-drag-handler';

export function WorkspacePanel({ isReadOnly, onFileDrop }: WorkspacePanelProps) {
  
  // Handle copying items from link trees to workspace
  const handleCopyToWorkspace = useCallback(async (items: any[], targetFolderId: string) => {
    console.log('Copying items to workspace:', items, 'target folder:', targetFolderId);
    // TODO: Implement actual copy logic
    // This would:
    // 1. Fetch the actual files from the link
    // 2. Copy them to the workspace folder
    // 3. Update the workspace tree
  }, []);

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