/**
 * Workspace tree data - Following headless-tree library patterns
 * Simple data structure with direct mutations
 */

import type { File, Folder } from '@/lib/database/types';

export type WorkspaceTreeItem = {
  name: string;
  children?: string[];
  isFile?: boolean;
};

// Simple data store - direct mutation like in library examples
export const data: Record<string, WorkspaceTreeItem> = {};

// Track drag operations to prevent data rebuilds during active drag operations
export let isDragOperationActive = false;

// Helper functions to manage drag state
export const setDragOperationActive = (active: boolean) => {
  isDragOperationActive = active;
};

export const getDragOperationActive = () => isDragOperationActive;

// Simple data loader - matches library patterns exactly
export const dataLoader = {
  getItem: (id: string) => {
    const item = data[id];
    if (!item) {
      return { name: `Missing: ${id}`, children: [] };
    }
    return item;
  },
  getChildren: (id: string) => data[id]?.children ?? [],
  getChildrenWithData: (id: string) => {
    const childrenIds = data[id]?.children ?? [];
    return childrenIds.map(childId => ({
      id: childId,
      data: data[childId] || { name: `Missing: ${childId}`, children: [] },
    }));
  },
};

// Populate data from database - simple approach
export const populateFromDatabase = (
  workspace: { id: string; name: string } | null,
  folders: Folder[],
  files: File[]
) => {
  // Clear existing data
  Object.keys(data).forEach(key => delete data[key]);

  if (!workspace) {
    return;
  }

  // Add workspace as root
  data[workspace.id] = {
    name: workspace.name,
    children: [],
  };

  // Add folders
  folders.forEach(folder => {
    data[folder.id] = {
      name: folder.name,
      children: [],
    };
  });

  // Add files
  files.forEach(file => {
    data[file.id] = {
      name: file.fileName,
      isFile: true,
    };
  });

  // Build hierarchy - collect items by parent first, then sort by sortOrder
  const itemsByParent: Record<
    string,
    Array<{ id: string; sortOrder: number; type: 'folder' | 'file' }>
  > = {};

  // Group folders by parent
  folders.forEach(folder => {
    const parentId = folder.parentFolderId || workspace.id;
    if (data[parentId]) {
      itemsByParent[parentId] = itemsByParent[parentId] || [];
      itemsByParent[parentId].push({
        id: folder.id,
        sortOrder: folder.sortOrder,
        type: 'folder',
      });
    }
  });

  // Group files by parent
  files.forEach(file => {
    const parentId = file.folderId || workspace.id;
    if (data[parentId]) {
      itemsByParent[parentId] = itemsByParent[parentId] || [];
      itemsByParent[parentId].push({
        id: file.id,
        sortOrder: file.sortOrder,
        type: 'file',
      });
    }
  });

  // Sort children by sortOrder and assign to parents
  Object.keys(itemsByParent).forEach(parentId => {
    const items = itemsByParent[parentId];
    if (!items) return;

    // Sort by sortOrder, then by type (folders first), then by id for consistency
    items.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.id.localeCompare(b.id);
    });

    const parentData = data[parentId];
    if (parentData) {
      parentData.children = items.map(item => item.id);
    }
  });

  // Return true to indicate data was updated
  return true;
};

// Simple item insertion - following library pattern
let newItemId = 0;
export const insertNewItem = (name: string, isFile = false): string => {
  const newId = `new-${newItemId++}`;

  data[newId] = {
    name,
    ...(isFile ? { isFile: true } : { children: [] }),
  };

  return newId;
};

// Delete items from tree data structure - following headless-tree pattern
export const deleteItemsFromTree = (itemIds: string[]): void => {
  // Remove items from their parents' children arrays
  Object.keys(data).forEach(parentId => {
    const parentData = data[parentId];
    if (parentData?.children) {
      parentData.children = parentData.children.filter(
        childId => !itemIds.includes(childId)
      );
    }
  });

  // Remove the actual item data
  itemIds.forEach(itemId => {
    delete data[itemId];
  });
};
