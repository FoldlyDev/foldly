import type { TreeItem, TreeFileItem, TreeFolderItem } from '../types/tree-types';
import type { File, Folder } from '@/lib/database/types';
import { sortChildren } from './sort-children';

/**
 * Transform database folders and files into tree structure
 * @param folders - Array of folder records from database
 * @param files - Array of file records from database
 * @param rootItem - Optional root item to add to the tree (e.g., workspace, link root, etc.)
 */
export function transformToTreeStructure(
  folders: Folder[],
  files: File[],
  rootItem?: { id: string; name: string } | null
): Record<string, TreeItem> {
  const treeData: Record<string, TreeItem> = {};

  // Add root item if provided (could be workspace, link, or any other container)
  if (rootItem) {
    const rootFolder: TreeFolderItem = {
      id: rootItem.id,
      name: rootItem.name,
      type: 'folder',
      parentId: null,
      path: '/',
      depth: 0,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
      isArchived: false,
      sortOrder: 0,
      children: [],
    };
    treeData[rootItem.id] = rootFolder;
  }

  // Transform folders
  folders.forEach(folder => {
    const treeFolder: TreeFolderItem = {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parentId: folder.parentFolderId || (rootItem?.id ?? null),
      path: folder.path,
      depth: folder.depth,
      children: [], // Will be populated below
      fileCount: folder.fileCount,
      totalSize: folder.totalSize,
      isArchived: folder.isArchived,
      sortOrder: folder.sortOrder,
      // Include hasGeneratedLink if it exists on the folder object
      hasGeneratedLink: (folder as any).hasGeneratedLink,
      record: folder, // Store full database record
    };
    treeData[folder.id] = treeFolder;
  });

  // Transform files
  files.forEach(file => {
    const treeFile: TreeFileItem = {
      id: file.id,
      name: file.fileName || file.originalName,
      type: 'file',
      parentId: file.folderId || (rootItem?.id ?? null),
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      extension: file.extension,
      thumbnailPath: file.thumbnailPath,
      processingStatus: file.processingStatus,
      sortOrder: file.sortOrder, // Add sortOrder for files
      record: file, // Store full database record
    };
    treeData[file.id] = treeFile;
  });

  // Build parent-child relationships - group children by parent first
  const childrenByParent: Record<string, TreeItem[]> = {};
  
  Object.values(treeData).forEach(item => {
    if (item.parentId && treeData[item.parentId]) {
      const parent = treeData[item.parentId];
      if (parent && parent.type === 'folder') {
        if (!childrenByParent[item.parentId]) {
          childrenByParent[item.parentId] = [];
        }
        childrenByParent[item.parentId]?.push(item);
      }
    } else if (rootItem && !item.parentId && item.id !== rootItem.id) {
      // Items without parents should be children of the root
      if (!childrenByParent[rootItem.id]) {
        childrenByParent[rootItem.id] = [];
      }
      childrenByParent[rootItem.id]?.push(item);
      item.parentId = rootItem.id;
    }
  });
  
  // Sort children by sortOrder and assign to parent's children array
  Object.entries(childrenByParent).forEach(([parentId, children]) => {
    const parent = treeData[parentId];
    if (parent && parent.type === 'folder') {
      const folderParent = parent as TreeFolderItem;
      
      // Use centralized sorting logic
      const childIds = children.map(child => child.id);
      folderParent.children = sortChildren(childIds, treeData);
    }
  });

  return treeData;
}

/**
 * Get root items (items without parents)
 */
export function getRootItems(data: Record<string, TreeItem>): string[] {
  return Object.values(data)
    .filter(item => !item.parentId)
    .map(item => item.id);
}

/**
 * Sort items (folders first, then alphabetically)
 */
export function sortTreeItems(
  itemIds: string[],
  data: Record<string, TreeItem>
): string[] {
  return itemIds.sort((a, b) => {
    const itemA = data[a];
    const itemB = data[b];
    
    if (!itemA || !itemB) return 0;
    
    // Folders come before files
    if (itemA.type !== itemB.type) {
      return itemA.type === 'folder' ? -1 : 1;
    }
    
    // Alphabetical within same type
    return itemA.name.localeCompare(itemB.name);
  });
}