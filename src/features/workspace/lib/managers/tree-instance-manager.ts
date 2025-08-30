'use client';

import { useState, useRef, useCallback } from 'react';
import { addTreeItem, removeTreeItem } from '@/components/file-tree/core/tree';
import type { TreeFolderItem, TreeFileItem } from '@/components/file-tree/types';

/**
 * Tree Instance Manager Hook
 * Manages the tree instance lifecycle and provides methods for tree manipulation
 * 
 * Responsibilities:
 * - Manage tree instance state
 * - Provide tree manipulation methods (add/remove items)
 * - Handle tree instance initialization
 * - Maintain tree reference for operations
 */

interface UseTreeInstanceManagerProps {
  workspaceId?: string;
  selectionMode: boolean;
  isTouchDevice: boolean;
  setSelectedItems: (items: string[]) => void;
  setSelectionMode: (mode: boolean) => void;
  clearSelection: () => void;
}

interface TreeInstanceManager {
  // State
  treeInstance: any | null;
  treeIdRef: React.MutableRefObject<string>;
  
  // Methods
  handleTreeReady: (tree: any) => void;
  addFolderToTree: (folder: any) => void;
  addFileToTree: (file: any) => void;
  deleteItemsFromTree: (itemIds: string[]) => void;
}

export function useTreeInstanceManager({
  workspaceId,
  selectionMode,
  isTouchDevice,
  setSelectedItems,
  setSelectionMode,
  clearSelection,
}: UseTreeInstanceManagerProps): TreeInstanceManager {
  // Tree instance state
  const [treeInstance, setTreeInstance] = useState<any | null>(null);
  const treeIdRef = useRef<string>(`workspace-tree-${Date.now()}`);

  /**
   * These methods are exposed for external use when treeInstance is available
   * They use the state variable treeInstance
   */
  const addFolderToTree = useCallback((folder: any) => {
    if (!treeInstance || !treeIdRef.current || !folder) return;

    const treeFolder: TreeFolderItem = {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parentId: folder.parentFolderId || workspaceId || null,
      path: folder.path || '/',
      depth: folder.depth || 0,
      fileCount: 0,
      totalSize: 0,
      isArchived: false,
      sortOrder: folder.sortOrder || 999,
      children: [],
      record: folder,
    };

    const parentId = folder.parentFolderId || workspaceId || '';
    addTreeItem(treeInstance, parentId, treeFolder, treeIdRef.current);
  }, [treeInstance, workspaceId]);

  const addFileToTree = useCallback((file: any) => {
    if (!treeInstance || !treeIdRef.current || !file) return;

    const treeFile: TreeFileItem = {
      id: file.id,
      name: file.fileName || file.originalName || file.name || 'Unnamed',
      type: 'file',
      parentId: file.folderId || workspaceId || null,
      mimeType: file.mimeType || 'application/octet-stream',
      fileSize: file.fileSize || 0,
      extension: file.extension || file.fileName?.split('.').pop() || null,
      thumbnailPath: file.thumbnailPath || null,
      processingStatus: file.processingStatus || 'completed',
      sortOrder: file.sortOrder || 999,
      record: file,
    };

    const parentId = file.folderId || workspaceId || '';
    addTreeItem(treeInstance, parentId, treeFile, treeIdRef.current);
  }, [treeInstance, workspaceId]);

  const deleteItemsFromTree = useCallback((itemIds: string[]) => {
    if (treeInstance && treeIdRef.current) {
      removeTreeItem(treeInstance, itemIds, treeIdRef.current);
      // Clear selection after deletion
      clearSelection();
    }
  }, [treeInstance, clearSelection]);

  /**
   * Handle tree ready event - extends tree with additional methods
   * This is the core initialization function that sets up the tree instance
   * IMPORTANT: Methods that need the tree instance are defined inline to avoid circular deps
   * NOTE: Dependencies are intentionally limited to prevent infinite re-renders
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleTreeReady = useCallback((tree: any) => {
    // Extend the tree instance with methods the rest of the app expects
    const extendedTree = {
      ...tree,
      // Add methods that toolbar and other components expect
      getSelectedItems: () => {
        // The new tree tracks selected items differently
        return tree.getSelectedItems ? tree.getSelectedItems() : [];
      },
      getItemInstance: (id: string) => {
        // Get specific item instance
        return tree.getItemInstance ? tree.getItemInstance(id) : null;
      },
      addFolder: (_name: string, _parentId?: string) => {
        // Don't add immediately - return null to signal toolbar to use server action
        // We'll add to tree when server action succeeds
        return null;
      },
      deleteItems: (itemIds: string[]) => {
        // Remove items from tree immediately for responsive UI
        if (tree && treeIdRef.current) {
          removeTreeItem(tree, itemIds, treeIdRef.current);
          // Clear selection after deletion
          clearSelection();
        }
      },
      // Add a method to add folder after successful server action
      addFolderToTree: (folder: any) => {
        if (!tree || !treeIdRef.current || !folder) return;

        const treeFolder: TreeFolderItem = {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          parentId: folder.parentFolderId || workspaceId || null,
          path: folder.path || '/',
          depth: folder.depth || 0,
          fileCount: 0,
          totalSize: 0,
          isArchived: false,
          sortOrder: folder.sortOrder || 999,
          children: [],
          record: folder,
        };

        const parentId = folder.parentFolderId || workspaceId || '';
        addTreeItem(tree, parentId, treeFolder, treeIdRef.current);
      },
      // Add a method to add file after successful server action
      addFileToTree: (file: any) => {
        if (!tree || !treeIdRef.current || !file) return;

        const treeFile: TreeFileItem = {
          id: file.id,
          name: file.fileName || file.originalName || file.name || 'Unnamed',
          type: 'file',
          parentId: file.folderId || workspaceId || null,
          mimeType: file.mimeType || 'application/octet-stream',
          fileSize: file.fileSize || 0,
          extension: file.extension || file.fileName?.split('.').pop() || null,
          thumbnailPath: file.thumbnailPath || null,
          processingStatus: file.processingStatus || 'completed',
          sortOrder: file.sortOrder || 999,
          record: file,
        };

        const parentId = file.folderId || workspaceId || '';
        addTreeItem(tree, parentId, treeFile, treeIdRef.current);
      },
      expandAll: () => {
        if (tree.expandAll) tree.expandAll();
      },
      collapseAll: () => {
        if (tree.collapseAll) tree.collapseAll();
      },
      isTouchDevice: () => isTouchDevice,
      isSelectionMode: () => selectionMode,
      setSelectionMode: (mode: boolean) => {
        setSelectionMode(mode);
      },
      setSelectedItems: (items: string[]) => {
        // Use the selection manager to handle this
        setSelectedItems(items);
      },
    };

    setTreeInstance(extendedTree);
  }, [selectionMode, isTouchDevice, workspaceId]);

  return {
    // State
    treeInstance,
    treeIdRef,
    
    // Methods
    handleTreeReady,
    addFolderToTree,
    addFileToTree,
    deleteItemsFromTree,
  };
}