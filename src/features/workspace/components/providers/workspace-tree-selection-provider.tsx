'use client';

import React, { useMemo, useCallback } from 'react';
import { WorkspaceTreeSelectionContext } from '../../hooks/use-workspace-tree-selection';
import { VIRTUAL_ROOT_ID } from '@/lib/utils/workspace-tree-utils';

// =============================================================================
// TYPES
// =============================================================================

interface Item {
  name: string;
  children?: string[];
  isFile?: boolean;
}

// Tree item type based on headless-tree API
interface TreeItem {
  getId(): string;
  isSelected(): boolean;
  isExpanded(): boolean;
  expand?(): void;
  toggleExpanded?(): void;
}

// Tree API type based on actual usage
interface TreeAPI {
  getItems(): TreeItem[];
}

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface WorkspaceTreeSelectionProviderProps {
  children: React.ReactNode;
  tree: TreeAPI | null;
  items: Record<string, Item>;
}

export function WorkspaceTreeSelectionProvider({
  children,
  tree,
  items,
}: WorkspaceTreeSelectionProviderProps) {
  // Get selected items from tree
  const selectedItems = useMemo(() => {
    if (!tree) return [];
    return tree
      .getItems()
      .filter((item: TreeItem) => item.isSelected())
      .map((item: TreeItem) => item.getId());
  }, [tree]);

  // Get the primary selected item (first in selection)
  const selectedItem = useMemo(() => {
    return selectedItems.length > 0 ? selectedItems[0] || null : null;
  }, [selectedItems]);

  // Determine the best folder for creating new items
  const getSelectedFolderForCreation = useCallback(() => {
    if (!tree || !selectedItem) {
      return VIRTUAL_ROOT_ID; // Default to workspace root
    }

    const item = items[selectedItem];
    if (!item) {
      return VIRTUAL_ROOT_ID;
    }

    // If selected item is a folder, use it as parent
    if (!item.isFile) {
      return selectedItem;
    }

    // If selected item is a file, find its parent folder by searching through the tree structure
    for (const [parentId, parentItem] of Object.entries(items)) {
      if (parentItem.children && parentItem.children.includes(selectedItem)) {
        return parentId;
      }
    }

    // If no parent found, default to workspace root
    return VIRTUAL_ROOT_ID;
  }, [tree, selectedItem, items]);

  // Check if an item is a folder
  const isItemFolder = useCallback(
    (itemId: string) => {
      const item = items[itemId];
      return item ? !item.isFile : false;
    },
    [items]
  );

  // Get item name
  const getItemName = useCallback(
    (itemId: string) => {
      const item = items[itemId];
      return item?.name || 'Unknown';
    },
    [items]
  );

  // Expand an item (best effort - may not work with all tree API versions)
  const expandItem = useCallback(
    (itemId: string) => {
      if (tree) {
        try {
          // Find the item and try to expand it
          const item = tree
            .getItems()
            .find((item: TreeItem) => item.getId() === itemId);
          if (
            item &&
            typeof item.isExpanded === 'function' &&
            !item.isExpanded()
          ) {
            // Try different methods that might exist on the item
            if (typeof item.expand === 'function') {
              item.expand();
            } else if (typeof item.toggleExpanded === 'function') {
              item.toggleExpanded();
            }
          }
        } catch (error) {
          // If expansion fails, continue silently - this is not critical functionality
          console.debug('Could not expand item:', itemId, error);
        }
      }
    },
    [tree]
  );

  const contextValue = useMemo(
    () => ({
      tree,
      selectedItems,
      selectedItem,
      getSelectedFolderForCreation,
      isItemFolder,
      getItemName,
      expandItem,
    }),
    [
      tree,
      selectedItems,
      selectedItem,
      getSelectedFolderForCreation,
      isItemFolder,
      getItemName,
      expandItem,
    ]
  );

  return (
    <WorkspaceTreeSelectionContext.Provider value={contextValue}>
      {children}
    </WorkspaceTreeSelectionContext.Provider>
  );
}
