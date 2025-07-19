/**
 * Workspace tree data - Following headless-tree library patterns
 * Simple data structure with direct mutations
 */

import type { File, Folder } from '@/lib/supabase/types';

export type WorkspaceTreeItem = {
  name: string;
  children?: string[];
  isFile?: boolean;
};

// Simple data store - direct mutation like in library examples
export const data: Record<string, WorkspaceTreeItem> = {};

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
  console.log('🏗️ populateFromDatabase called with:', {
    workspace,
    folderCount: folders.length,
    fileCount: files.length,
    currentDataKeys: Object.keys(data),
    timestamp: new Date().toISOString(),
  });

  // Clear existing data
  const keysBeforeClearing = Object.keys(data);
  Object.keys(data).forEach(key => delete data[key]);
  console.log('🗑️ Cleared existing data. Keys removed:', keysBeforeClearing);

  if (!workspace) {
    console.log('❌ No workspace provided, returning early');
    return;
  }

  // Add workspace as root
  data[workspace.id] = {
    name: workspace.name,
    children: [],
  };
  console.log('📁 Added workspace root:', workspace.id, workspace.name);

  // Add folders
  folders.forEach(folder => {
    data[folder.id] = {
      name: folder.name,
      children: [],
    };
    console.log(
      '📂 Added folder:',
      folder.id,
      folder.name,
      'parent:',
      folder.parentFolderId
    );
  });

  // Add files
  files.forEach(file => {
    data[file.id] = {
      name: file.fileName,
      isFile: true,
    };
    console.log(
      '📄 Added file:',
      file.id,
      file.fileName,
      'parent:',
      file.folderId
    );
  });

  // Build hierarchy - folders
  folders.forEach(folder => {
    const parentId = folder.parentFolderId || workspace.id;
    if (data[parentId]) {
      data[parentId].children = data[parentId].children || [];
      data[parentId].children!.push(folder.id);
      console.log('🔗 Linked folder to parent:', folder.id, '->', parentId);
    } else {
      console.log(
        '❌ Parent not found for folder:',
        folder.id,
        'expected parent:',
        parentId
      );
    }
  });

  // Build hierarchy - files
  files.forEach(file => {
    const parentId = file.folderId || workspace.id;
    if (data[parentId]) {
      data[parentId].children = data[parentId].children || [];
      data[parentId].children!.push(file.id);
      console.log('🔗 Linked file to parent:', file.id, '->', parentId);
    } else {
      console.log(
        '❌ Parent not found for file:',
        file.id,
        'expected parent:',
        parentId
      );
    }
  });

  console.log(
    '✅ populateFromDatabase completed. Final data structure:',
    JSON.stringify(data, null, 2)
  );
  
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
