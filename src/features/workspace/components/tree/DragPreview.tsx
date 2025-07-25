'use client';

import React from 'react';
import { FileIcon, FolderIcon } from 'lucide-react';
import type { ItemInstance, TreeInstance } from '@headless-tree/core';
import type { WorkspaceTreeItem } from '../../lib/tree-data';

interface DragPreviewProps {
  tree: TreeInstance<WorkspaceTreeItem>;
  id?: string;
}

/**
 * Drag preview component that shows a styled preview of dragged items
 * This component is positioned off-screen and used by the headless-tree library
 * as a custom drag image via the setDragImage configuration
 */
export function DragPreview({ tree, id = 'drag-preview' }: DragPreviewProps) {
  const draggedItems = tree.getState()?.dnd?.draggedItems || [];
  
  if (draggedItems.length === 0) {
    return (
      <div id={id} className='drag-preview'>
        <div className='flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-lg'>
          <span className='text-sm text-muted-foreground'>No items</span>
        </div>
      </div>
    );
  }
  
  const firstItem = draggedItems[0];
  const itemData = firstItem?.getItemData();
  
  return (
    <div id={id} className='drag-preview'>
      <div className='flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md shadow-lg'>
        {itemData?.isFile ? (
          <FileIcon className='size-4 text-muted-foreground flex-shrink-0' />
        ) : (
          <FolderIcon className='size-4 text-muted-foreground flex-shrink-0' />
        )}
        <span className='text-sm font-medium truncate max-w-32'>
          {itemData?.name || 'Unknown'}
        </span>
        {draggedItems.length > 1 && (
          <span className='text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full'>
            +{draggedItems.length - 1}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to configure drag preview for headless-tree
 * Returns the setDragImage configuration object
 */
export function useDragPreview(previewId = 'drag-preview') {
  return {
    setDragImage: () => ({
      imgElement: document.getElementById(previewId)!,
      xOffset: -10,
      yOffset: -10,
    }),
  };
}