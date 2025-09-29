'use client';

import { useCallback, useMemo } from 'react';
import type { TreeItem } from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';

/**
 * Cross-Tree Drag Handler Hook
 * Manages drag operations between different trees in the files feature
 * 
 * Responsibilities:
 * - Enable dragging from link trees to workspace tree
 * - Handle foreign drag data transfer
 * - Validate drop targets
 * - Process copy operations (not move)
 */

export interface CrossTreeDragData {
  sourceTreeId: string;
  sourceType: 'link' | 'workspace';
  sourceLinkId?: string; // Add linkId for link sources
  items: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
  operation: 'copy' | 'reference';
}

export interface CrossTreeDragHandlerProps {
  treeId: string;
  treeType: 'link' | 'workspace';
  linkId?: string | undefined; // Add linkId for link trees
  workspaceId?: string | undefined; // Add workspaceId for workspace trees
  onCopyToWorkspace?: ((items: TreeItem[], targetFolderId: string, workspaceId?: string) => Promise<void>) | undefined;
  canAcceptDrops?: boolean | undefined;
  canDragOut?: boolean | undefined;
}

interface CrossTreeDragHandler {
  // For trees that can drag out
  createForeignDragData?: (items: TreeItem[]) => string;
  
  // For trees that can accept drops
  canAcceptForeignDrop?: (dataTransfer: DataTransfer) => boolean;
  handleForeignDrop?: (dataTransfer: DataTransfer, targetFolderId: string) => Promise<void>;
}

export function useCrossTreeDragHandler({
  treeId,
  treeType,
  linkId,
  workspaceId,
  onCopyToWorkspace,
  canAcceptDrops = false,
  canDragOut = false,
}: CrossTreeDragHandlerProps): CrossTreeDragHandler {
  
  /**
   * Create foreign drag data for items being dragged out
   * Used by link trees to package data for workspace
   */
  const createForeignDragData = useCallback(
    (items: TreeItem[]): string => {
      if (!canDragOut) return '';
      
      const dragData: CrossTreeDragData = {
        sourceTreeId: treeId,
        sourceType: treeType,
        sourceLinkId: linkId || '', // Always include sourceLinkId
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          type: isFolder(item) ? 'folder' : 'file',
        })),
        operation: 'copy', // Always copy from links to workspace
      };
      
      console.log('[CrossTree] Creating drag data:', {
        treeId,
        linkId,
        itemCount: items.length,
        sourceLinkId: dragData.sourceLinkId
      });
      
      return JSON.stringify(dragData);
    },
    [treeId, treeType, linkId, canDragOut]
  );
  
  /**
   * Check if foreign drop can be accepted
   * Used by workspace tree to validate incoming drops
   */
  const canAcceptForeignDrop = useCallback(
    (dataTransfer: DataTransfer): boolean => {
      if (!canAcceptDrops) return false;
      
      try {
        // Check if it's our custom cross-tree drag data
        const dragDataStr = dataTransfer.getData('application/x-cross-tree-drag');
        if (!dragDataStr) return false;
        
        const dragData: CrossTreeDragData = JSON.parse(dragDataStr);
        
        // Workspace can only accept from link trees
        if (treeType === 'workspace' && dragData.sourceType === 'link') {
          return true;
        }
        
        return false;
      } catch {
        return false;
      }
    },
    [treeType, canAcceptDrops]
  );
  
  /**
   * Handle foreign drop
   * Used by workspace tree to process drops from link trees
   */
  const handleForeignDrop = useCallback(
    async (dataTransfer: DataTransfer, targetFolderId: string): Promise<void> => {
      if (!canAcceptDrops || !onCopyToWorkspace) {
        console.log('[CrossTree] Cannot handle drop:', { canAcceptDrops, hasHandler: !!onCopyToWorkspace });
        return;
      }
      
      try {
        const dragDataStr = dataTransfer.getData('application/x-cross-tree-drag');
        if (!dragDataStr) {
          console.log('[CrossTree] No cross-tree drag data found');
          return;
        }
        
        const dragData: CrossTreeDragData = JSON.parse(dragDataStr);
        
        console.log('[CrossTree] Processing drop:', {
          sourceType: dragData.sourceType,
          sourceLinkId: dragData.sourceLinkId,
          targetFolderId,
          itemCount: dragData.items.length,
          treeType
        });
        
        // Validate this is a valid drop
        if (treeType === 'workspace' && dragData.sourceType === 'link') {
          if (!dragData.sourceLinkId) {
            console.error('[CrossTree] No source link ID in drag data');
            return;
          }
          
          // Convert simple items back to TreeItems for the handler
          // Add linkId to each item for the copy operation
          const items: TreeItem[] = dragData.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            parentId: null, // Will be set by copy operation
            linkId: dragData.sourceLinkId, // Add linkId for the server action
          } as TreeItem & { linkId?: string }));
          
          console.log('[CrossTree] Calling onCopyToWorkspace with:', {
            itemCount: items.length,
            linkId: dragData.sourceLinkId,
            targetFolderId,
            workspaceId
          });
          
          await onCopyToWorkspace(items, targetFolderId, workspaceId);
        }
      } catch (error) {
        console.error('[CrossTree] Failed to handle foreign drop:', error);
      }
    },
    [treeType, canAcceptDrops, onCopyToWorkspace, workspaceId]
  );
  
  // Return handlers based on tree capabilities
  const handlers: CrossTreeDragHandler = {};
  
  if (canDragOut) {
    handlers.createForeignDragData = createForeignDragData;
  }
  
  if (canAcceptDrops) {
    handlers.canAcceptForeignDrop = canAcceptForeignDrop;
    handlers.handleForeignDrop = handleForeignDrop;
  }
  
  return handlers;
}