'use client';

import type { TreeInstance } from '@headless-tree/core';
import { FileIcon, FolderIcon } from 'lucide-react';
import type { LinkTreeItem } from '../../lib/tree-data';

interface DragPreviewProps {
  tree: TreeInstance<LinkTreeItem>;
}

export function DragPreview({ tree }: DragPreviewProps) {
  // Safely get dragged items with null checks
  if (!tree || typeof tree.getState !== 'function') {
    return null;
  }
  
  const treeState = tree.getState();
  const draggedItems = treeState?.dnd?.draggedItems || [];

  if (draggedItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed pointer-events-none z-50 bg-white border rounded-lg shadow-lg p-2 max-w-xs">
      {draggedItems.length === 1 ? (
        <div className="flex items-center gap-2">
          {draggedItems[0]?.isFolder?.() ? (
            <FolderIcon className="w-4 h-4 text-blue-600" />
          ) : (
            <FileIcon className="w-4 h-4 text-gray-600" />
          )}
          <span className="text-sm font-medium truncate">
            {draggedItems[0]?.getItemName?.() || 'Unknown'}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {draggedItems.slice(0, 3).map((item, index) => (
              <div
                key={item?.getId?.() || index}
                className="w-6 h-6 bg-blue-100 border-2 border-white rounded flex items-center justify-center"
                style={{ zIndex: 10 - index }}
              >
                {item?.isFolder?.() ? (
                  <FolderIcon className="w-3 h-3 text-blue-600" />
                ) : (
                  <FileIcon className="w-3 h-3 text-gray-600" />
                )}
              </div>
            ))}
          </div>
          <span className="text-sm font-medium">
            {draggedItems.length} items
          </span>
        </div>
      )}
    </div>
  );
}

