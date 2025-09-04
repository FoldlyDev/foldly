'use client';

import { useState, useRef, useCallback } from 'react';
import { addTreeItem, removeTreeItem } from '@/components/file-tree/core/tree';
import type { TreeFolderItem, TreeFileItem } from '@/components/file-tree/types';

/**
 * Link Tree Instance Manager Hook
 * Manages the tree instance for link uploads
 * Public uploaders start with empty tree and have full capabilities for their session
 * 
 * Responsibilities:
 * - Manage tree instance state
 * - Provide full tree manipulation methods for session
 * - Handle tree instance initialization
 * - Maintain tree reference for operations
 */

interface UseLinkTreeInstanceManagerProps {
  linkId?: string;
  isOwner?: boolean;
}

interface LinkTreeInstanceManager {
  // State
  treeInstance: any | null;
  treeIdRef: React.MutableRefObject<string>;
  
  // Methods
  handleTreeReady: (tree: any) => void;
  addFolderToTree: (folder: any) => void;
  addFileToTree: (file: any) => void;
  deleteItemsFromTree: (itemIds: string[]) => void;
}

export function useLinkTreeInstanceManager({
  linkId,
  isOwner = false,
}: UseLinkTreeInstanceManagerProps): LinkTreeInstanceManager {
  // Tree instance state
  const [treeInstance, setTreeInstance] = useState<any | null>(null);
  const treeIdRef = useRef<string>(`link-tree-${Date.now()}`);

  /**
   * Add a folder to the tree (for organizing uploads)
   */
  const addFolderToTree = useCallback((folder: any) => {
    if (!treeInstance || !treeIdRef.current || !folder) return;

    const treeFolder: TreeFolderItem = {
      id: folder.id || `folder-temp-${Date.now()}`,
      name: folder.name,
      type: 'folder',
      parentId: folder.parentFolderId || linkId || null,
      path: folder.path || '/',
      depth: folder.depth || 0,
      fileCount: 0,
      totalSize: 0,
      isArchived: false,
      sortOrder: folder.sortOrder || 999,
      children: [],
      record: folder,
    };

    const parentId = folder.parentFolderId || linkId || '';
    addTreeItem(treeInstance, parentId, treeFolder, treeIdRef.current);
  }, [treeInstance, linkId]);

  /**
   * Add a file to the tree during upload session
   */
  const addFileToTree = useCallback((file: any) => {
    if (!treeInstance || !treeIdRef.current || !file) return;

    const treeFile: TreeFileItem = {
      id: file.id || `file-temp-${Date.now()}`,
      name: file.name || file.fileName || file.originalName || 'Unnamed',
      type: 'file',
      parentId: file.folderId || linkId || null,
      mimeType: file.mimeType || 'application/octet-stream',
      fileSize: file.fileSize || 0,
      extension: file.extension || file.name?.split('.').pop() || null,
      thumbnailPath: file.thumbnailPath || null,
      processingStatus: file.processingStatus || 'pending',
      sortOrder: file.sortOrder || 999,
      record: file,
    };

    const parentId = file.folderId || linkId || '';
    addTreeItem(treeInstance, parentId, treeFile, treeIdRef.current);
  }, [treeInstance, linkId]);

  /**
   * Delete items from tree during session
   */
  const deleteItemsFromTree = useCallback((itemIds: string[]) => {
    if (treeInstance && treeIdRef.current) {
      removeTreeItem(treeInstance, itemIds, treeIdRef.current);
    }
  }, [treeInstance]);

  /**
   * Handle tree ready event - sets up the tree instance with full capabilities
   * IMPORTANT: Methods that need the tree instance are defined inline to avoid circular deps
   * NOTE: Dependencies are intentionally limited to prevent infinite re-renders
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTreeReady = useCallback((tree: any) => {
    // Extend the tree instance with session management methods
    const extendedTree = {
      ...tree,
      // Keep all existing tree methods
      getSelectedItems: () => {
        return tree.getSelectedItems ? tree.getSelectedItems() : [];
      },
      getItemInstance: (id: string) => {
        return tree.getItemInstance ? tree.getItemInstance(id) : null;
      },
      expandAll: () => {
        if (tree.expandAll) tree.expandAll();
      },
      collapseAll: () => {
        if (tree.collapseAll) tree.collapseAll();
      },
      
      // Add folder creation for organizing uploads (inline to avoid deps)
      addFolder: (name: string, parentId?: string) => {
        const tempId = `folder-temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;  
        const treeFolder: TreeFolderItem = {
          id: tempId,
          name: name,
          type: 'folder',
          parentId: parentId || linkId || null,
          path: '/',
          depth: 0,
          fileCount: 0,
          totalSize: 0,
          isArchived: false,
          sortOrder: 999,
          children: [],
        };
        
        const targetParentId = parentId || linkId || '';
        addTreeItem(tree, targetParentId, treeFolder, treeIdRef.current);
        return tempId;
      },
      
      // Delete items during session (inline to avoid deps)
      deleteItems: (itemIds: string[]) => {
        if (tree && treeIdRef.current) {
          removeTreeItem(tree, itemIds, treeIdRef.current);
        }
      },
      
      // Add folder to tree (inline to avoid deps)
      addFolderToTree: (folder: any) => {
        if (!tree || !treeIdRef.current || !folder) return;

        const treeFolder: TreeFolderItem = {
          id: folder.id || `folder-temp-${Date.now()}`,
          name: folder.name,
          type: 'folder',
          parentId: folder.parentId || folder.parentFolderId || linkId || null,
          path: folder.path || '/',
          depth: folder.depth || 0,
          fileCount: folder.fileCount || 0,
          totalSize: folder.totalSize || 0,
          isArchived: false,
          sortOrder: folder.sortOrder || 999,
          children: [],
          record: folder,
        };

        const parentId = folder.parentId || folder.parentFolderId || linkId || '';
        addTreeItem(tree, parentId, treeFolder, treeIdRef.current);
      },
      
      // Add file to tree (inline to avoid deps)
      addFileToTree: (file: any) => {
        if (!tree || !treeIdRef.current || !file) return;

        const treeFile: TreeFileItem = {
          id: file.id || `file-temp-${Date.now()}`,
          name: file.name || file.fileName || file.originalName || 'Unnamed',
          type: 'file',
          parentId: file.parentId || file.folderId || linkId || null,
          mimeType: file.mimeType || 'application/octet-stream',
          fileSize: file.fileSize || 0,
          extension: file.extension || file.name?.split('.').pop() || null,
          thumbnailPath: file.thumbnailPath || null,
          processingStatus: file.processingStatus || 'pending',
          sortOrder: file.sortOrder || 999,
          record: file,
        };

        const parentId = file.parentId || file.folderId || linkId || '';
        addTreeItem(tree, parentId, treeFile, treeIdRef.current);
      },
      
      // Update item name locally (for rename operation)
      updateItemName: (itemId: string, newName: string) => {
        const itemInstance = tree.getItemInstance ? tree.getItemInstance(itemId) : null;
        if (itemInstance && itemInstance.rename) {
          itemInstance.rename(newName);
        }
      },
    };

    setTreeInstance(extendedTree);
  }, [linkId]);

  return {
    treeInstance,
    treeIdRef,
    handleTreeReady,
    addFolderToTree,
    addFileToTree,
    deleteItemsFromTree,
  };
}