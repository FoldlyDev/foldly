import type { Folder } from '@/lib/supabase/types/folders';
import type { File } from '@/lib/supabase/types/files';

export interface WorkspaceTreeItem {
  name: string;
  children?: string[];
  isFile?: boolean;
}

export type WorkspaceTreeData = Record<string, WorkspaceTreeItem>;

export const VIRTUAL_ROOT_ID = 'workspace-root';

/**
 * Creates workspace tree data from database files and folders with virtual root
 * @param folders - Array of folders from the database
 * @param files - Array of files from the database
 * @param workspaceName - Name of the workspace for virtual root
 * @returns Workspace tree data structure with virtual root
 */
export function createWorkspaceTreeData(
  folders: Folder[],
  files: File[],
  workspaceName: string = 'Workspace'
): WorkspaceTreeData {
  const treeData: WorkspaceTreeData = {};

  // Create virtual root node
  treeData[VIRTUAL_ROOT_ID] = {
    name: workspaceName,
    children: [],
    isFile: false,
  };

  // First, add all folders to the tree
  folders.forEach(folder => {
    treeData[folder.id] = {
      name: folder.name,
      children: [],
      isFile: false,
    };
  });

  // Add all files to the tree
  files.forEach(file => {
    treeData[file.id] = {
      name: file.fileName,
      isFile: true,
    };
  });

  // Build the hierarchical structure
  // First pass: organize folders by their parent relationships
  folders.forEach(folder => {
    if (folder.parentFolderId) {
      // This folder has a parent, add it to parent's children
      const parentFolder = treeData[folder.parentFolderId];
      if (parentFolder && parentFolder.children) {
        parentFolder.children.push(folder.id);
      }
    } else {
      // This is a root-level folder, add it to virtual root
      const virtualRoot = treeData[VIRTUAL_ROOT_ID];
      if (virtualRoot && virtualRoot.children) {
        virtualRoot.children.push(folder.id);
      }
    }
  });

  // Second pass: add files to their parent folders
  files.forEach(file => {
    if (file.folderId) {
      // File is in a folder, add it to folder's children
      const parentFolder = treeData[file.folderId];
      if (parentFolder && parentFolder.children) {
        parentFolder.children.push(file.id);
      }
    } else {
      // File is at root level, add it to virtual root
      const virtualRoot = treeData[VIRTUAL_ROOT_ID];
      if (virtualRoot && virtualRoot.children) {
        virtualRoot.children.push(file.id);
      }
    }
  });

  return treeData;
}
