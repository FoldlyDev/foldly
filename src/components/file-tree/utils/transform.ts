import type { TreeItem, TreeFileItem, TreeFolderItem } from '../types/tree-types';

/**
 * Transform database folders and files into tree structure
 */
export function transformToTreeStructure(
  folders: any[],
  files: any[]
): Record<string, TreeItem> {
  const treeData: Record<string, TreeItem> = {};

  // Transform folders
  folders.forEach(folder => {
    const treeFolder: TreeFolderItem = {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parentId: folder.parentFolderId || null,
      path: folder.path,
      depth: folder.depth || 0,
      children: [], // Will be populated below
      fileCount: folder.fileCount,
      totalSize: folder.totalSize,
      isArchived: folder.isArchived,
    };
    treeData[folder.id] = treeFolder;
  });

  // Transform files
  files.forEach(file => {
    const treeFile: TreeFileItem = {
      id: file.id,
      name: file.fileName || file.originalName,
      type: 'file',
      parentId: file.folderId || null,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      extension: file.extension,
      thumbnailPath: file.thumbnailPath,
      processingStatus: file.processingStatus,
    };
    treeData[file.id] = treeFile;
  });

  // Build parent-child relationships
  Object.values(treeData).forEach(item => {
    if (item.parentId && treeData[item.parentId]) {
      const parent = treeData[item.parentId];
      if (parent.type === 'folder' && !parent.children?.includes(item.id)) {
        parent.children = [...(parent.children || []), item.id];
      }
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