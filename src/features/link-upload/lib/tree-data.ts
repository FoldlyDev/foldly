// =============================================================================
// LINK TREE DATA - Tree data management for link upload feature
// =============================================================================

'use client';

// Note: DataLoader type temporarily removed until proper headless-tree integration
// import type { DataLoader } from '@headless-tree/core';

// =============================================================================
// TYPES
// =============================================================================

export interface LinkTreeItem {
  id: string;
  name: string;
  isFile: boolean;
  parentId?: string;
  linkId: string;
  
  // File-specific properties
  size?: number;
  mimeType?: string;
  downloadUrl?: string;
  createdAt?: string;
  uploaderName?: string;
  
  // Folder-specific properties
  children?: string[]; // Array of child IDs, not full items
  
  // Staging properties
  isStaged?: boolean;
  stagingStatus?: 'staged' | 'uploading' | 'completed' | 'failed';
}

// =============================================================================
// GLOBAL STATE - Tree data store similar to workspace
// =============================================================================

// Global tree data store
export const data: Record<string, LinkTreeItem> = {};

// Track if a drag operation is currently active
let dragOperationActive = false;

export const getDragOperationActive = () => dragOperationActive;
export const setDragOperationActive = (active: boolean) => {
  dragOperationActive = active;
};

// =============================================================================
// DATA LOADER - Interface with headless-tree
// =============================================================================

export const dataLoader = {
  getItem: (itemId: string) => {
    const item = data[itemId];
    return item;
  },
  
  getChildren: (itemId: string) => {
    const item = data[itemId];
    if (!item) {
      return [];
    }
    
    if (item.isFile) {
      return [];
    }
    
    // If the item has a children array, return it
    if (item.children) {
      return item.children;
    }
    
    // Otherwise, find all direct children dynamically
    const children = Object.values(data).filter(
      child => child.parentId === itemId
    );
    
    // Store the children IDs in the parent for faster access
    item.children = children.map(child => child.id);
    
    return item.children;
  },
};

// =============================================================================
// DATABASE SYNC - Populate tree data from database
// =============================================================================

export function populateFromDatabase(
  link: { id: string; title?: string },
  folders: Array<{
    id: string;
    name: string;
    parentId?: string;
    linkId: string;
    createdAt: string;
  }>,
  files: Array<{
    id: string;
    originalName: string;
    parentId?: string;
    linkId: string;
    fileSize: number;
    mimeType: string;
    createdAt: string;
    uploaderName?: string;
    storagePath: string;
  }>
): boolean {

  const previousDataKeys = Object.keys(data);
  
  // Clear existing data for this link
  Object.keys(data).forEach(key => {
    if (data[key]?.linkId === link.id) {
      delete data[key];
    }
  });

  // Add link root as the virtual root item
  data[link.id] = {
    id: link.id,
    name: link.title || 'Link Root',
    isFile: false,
    linkId: link.id,
    children: [], // Initialize with empty children array
  };

  // Add folders
  folders.forEach(folder => {
    data[folder.id] = {
      id: folder.id,
      name: folder.name,
      isFile: false,
      parentId: folder.parentId || link.id, // Use link ID as root parent
      linkId: folder.linkId,
      createdAt: folder.createdAt,
      children: [], // Initialize with empty children array
    };
  });

  // Add files
  files.forEach(file => {
    data[file.id] = {
      id: file.id,
      name: file.originalName,
      isFile: true,
      parentId: file.parentId || link.id, // Use link ID as root parent
      linkId: file.linkId,
      size: file.fileSize,
      mimeType: file.mimeType,
      createdAt: file.createdAt,
      ...(file.uploaderName && { uploaderName: file.uploaderName }),
    };
  });

  // Build children arrays for all folders
  Object.values(data).forEach(item => {
    if (item.parentId && data[item.parentId]) {
      const parent = data[item.parentId];
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        if (!parent.children.includes(item.id)) {
          parent.children.push(item.id);
        }
      }
    }
  });

  const currentDataKeys = Object.keys(data);
  const dataChanged = 
    previousDataKeys.length !== currentDataKeys.length ||
    !previousDataKeys.every(key => currentDataKeys.includes(key));

  return dataChanged;
}

// =============================================================================
// TREE OPERATIONS - Add/remove items optimistically
// =============================================================================

export function addItemToTree(
  item: LinkTreeItem,
  parentId?: string
): void {
  // Use link ID as default parent if none specified
  const effectiveParentId = parentId || item.linkId;
  
  data[item.id] = {
    ...item,
    parentId: effectiveParentId,
  };
}

export function removeItemFromTree(itemId: string): void {
  // Remove the item and all its children recursively
  function removeRecursive(id: string) {
    const item = data[id];
    if (!item) return;
    
    // Find and remove all children first
    Object.values(data).forEach(child => {
      if (child.parentId === id) {
        removeRecursive(child.id);
      }
    });
    
    // Remove the item itself
    delete data[id];
  }
  
  removeRecursive(itemId);
}

export function moveItemInTree(
  itemId: string,
  newParentId: string,
  index?: number
): void {
  const item = data[itemId];
  if (!item) {
    return;
  }
  
  // Remove from old parent's children array
  if (item.parentId && data[item.parentId]) {
    const oldParent = data[item.parentId];
    if (oldParent?.children) {
      oldParent.children = oldParent.children.filter(id => id !== itemId);
    }
  }
  
  // Update item's parent
  data[itemId] = {
    ...item,
    parentId: newParentId,
  };
  
  // Add to new parent's children array
  if (data[newParentId]) {
    const newParent = data[newParentId];
    if (!newParent.children) {
      newParent.children = [];
    }
    if (!newParent.children.includes(itemId)) {
      if (index !== undefined && index >= 0) {
        newParent.children.splice(index, 0, itemId);
      } else {
        newParent.children.push(itemId);
      }
    }
  }
}

// =============================================================================
// STAGING INTEGRATION - Merge staged items with tree data
// =============================================================================

import type { StagedFile, StagedFolder } from '../stores/staging-store';

export function mergeStagedItemsWithTree(
  linkId: string,
  stagedFiles: Map<string, StagedFile>,
  stagedFolders: Map<string, StagedFolder>
): void {

  // Remove existing staged items first
  Object.keys(data).forEach(id => {
    if (data[id]?.isStaged) {
      delete data[id];
    }
  });

  // Add staged folders
  stagedFolders.forEach(folder => {
    const treeItem: LinkTreeItem = {
      id: folder.id,
      name: folder.name,
      isFile: false,
      parentId: folder.parentFolderId || linkId,
      linkId,
      isStaged: true,
      stagingStatus: folder.status,
      children: [], // Initialize with empty children array
    };
    
    data[folder.id] = treeItem;
    
    // Add to parent's children array
    const parentId = folder.parentFolderId || linkId;
    if (data[parentId]) {
      const parent = data[parentId];
      if (!parent.children) {
        parent.children = [];
      }
      if (!parent.children.includes(folder.id)) {
        parent.children.push(folder.id);
      }
    }
  });

  // Add staged files
  stagedFiles.forEach(file => {
    const treeItem: LinkTreeItem = {
      id: file.id,
      name: file.name,
      isFile: true,
      parentId: file.parentFolderId || linkId,
      linkId,
      size: file.size,
      mimeType: file.mimeType,
      ...(file.uploaderName && { uploaderName: file.uploaderName }),
      isStaged: true,
      stagingStatus: file.status,
    };
    
    data[file.id] = treeItem;
    
    // Add to parent's children array
    const parentId = file.parentFolderId || linkId;
    if (data[parentId]) {
      const parent = data[parentId];
      if (!parent.children) {
        parent.children = [];
      }
      if (!parent.children.includes(file.id)) {
        parent.children.push(file.id);
      }
    }
  });

}

export function removeStagedItemsFromTree(): void {
  const keysToRemove = Object.keys(data).filter(id => data[id]?.isStaged);
  keysToRemove.forEach(id => delete data[id]);
}