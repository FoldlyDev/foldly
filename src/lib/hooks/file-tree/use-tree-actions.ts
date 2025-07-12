// =============================================================================
// TREE ACTIONS - React Query hooks for tree operations
// =============================================================================
// 🎯 Context-aware tree operations with React Query integration

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTreeStore } from './use-tree-state';
import type {
  DatabaseId,
  TreeNode,
  ContextType,
  WorkspaceOperations,
  FilesOperations,
  UploadOperations,
} from '@/types/file-tree';

// =============================================================================
// TREE ACTIONS HOOK - Main hook for tree operations
// =============================================================================

export const useTreeActions = (
  contextType: ContextType,
  contextId?: DatabaseId
) => {
  const queryClient = useQueryClient();
  const { selectNode, toggleNode, setNodeLoading, hideContextMenu } =
    useTreeStore();

  // =============================================================================
  // FOLDER OPERATIONS
  // =============================================================================

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parentId?: DatabaseId }) => {
      setNodeLoading(data.parentId || 'root', true);

      try {
        switch (contextType) {
          case 'workspace':
            return await createWorkspaceFolder(contextId!, data);
          case 'upload':
            return await createUploadFolder(contextId!, data);
          default:
            throw new Error(
              `Create folder not supported for context: ${contextType}`
            );
        }
      } finally {
        setNodeLoading(data.parentId || 'root', false);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });

      // Expand parent folder if it exists
      if (variables.parentId) {
        toggleNode(variables.parentId);
      }

      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to create folder:', error);
      hideContextMenu();
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (nodeId: DatabaseId) => {
      setNodeLoading(nodeId, true);

      try {
        switch (contextType) {
          case 'workspace':
            return await deleteWorkspaceItem(nodeId);
          case 'upload':
            return await deleteUploadItem(nodeId);
          default:
            throw new Error(`Delete not supported for context: ${contextType}`);
        }
      } finally {
        setNodeLoading(nodeId, false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });
      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to delete item:', error);
      hideContextMenu();
    },
  });

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  const moveItemMutation = useMutation({
    mutationFn: async (data: { nodeId: DatabaseId; targetId: DatabaseId }) => {
      const { nodeId, targetId } = data;
      setNodeLoading(nodeId, true);
      setNodeLoading(targetId, true);

      try {
        switch (contextType) {
          case 'workspace':
            return await moveWorkspaceItem(nodeId, targetId);
          case 'files':
            return await moveFileToWorkspace(nodeId, targetId);
          case 'upload':
            return await moveUploadItem(nodeId, targetId);
          default:
            throw new Error(`Move not supported for context: ${contextType}`);
        }
      } finally {
        setNodeLoading(nodeId, false);
        setNodeLoading(targetId, false);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });

      // If moving to workspace context, also invalidate workspace queries
      if (contextType === 'files') {
        queryClient.invalidateQueries({
          queryKey: ['tree', 'workspace'],
        });
      }

      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to move item:', error);
      hideContextMenu();
    },
  });

  const renameItemMutation = useMutation({
    mutationFn: async (data: { nodeId: DatabaseId; newName: string }) => {
      const { nodeId, newName } = data;
      setNodeLoading(nodeId, true);

      try {
        switch (contextType) {
          case 'workspace':
            return await renameWorkspaceItem(nodeId, newName);
          case 'upload':
            return await renameUploadItem(nodeId, newName);
          default:
            throw new Error(`Rename not supported for context: ${contextType}`);
        }
      } finally {
        setNodeLoading(nodeId, false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });
      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to rename item:', error);
      hideContextMenu();
    },
  });

  const downloadItemMutation = useMutation({
    mutationFn: async (nodeId: DatabaseId) => {
      setNodeLoading(nodeId, true);

      try {
        switch (contextType) {
          case 'workspace':
            return await downloadWorkspaceItem(nodeId);
          case 'files':
            return await downloadLinkItem(nodeId);
          default:
            throw new Error(
              `Download not supported for context: ${contextType}`
            );
        }
      } finally {
        setNodeLoading(nodeId, false);
      }
    },
    onSuccess: () => {
      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to download item:', error);
      hideContextMenu();
    },
  });

  // =============================================================================
  // BATCH OPERATIONS
  // =============================================================================

  const batchMoveMutation = useMutation({
    mutationFn: async (data: {
      nodeIds: DatabaseId[];
      targetId: DatabaseId;
    }) => {
      const { nodeIds, targetId } = data;

      // Set loading state for all nodes
      nodeIds.forEach(nodeId => setNodeLoading(nodeId, true));
      setNodeLoading(targetId, true);

      try {
        switch (contextType) {
          case 'workspace':
            return await batchMoveWorkspaceItems(nodeIds, targetId);
          case 'files':
            return await batchMoveFilesToWorkspace(nodeIds, targetId);
          case 'upload':
            return await batchMoveUploadItems(nodeIds, targetId);
          default:
            throw new Error(
              `Batch move not supported for context: ${contextType}`
            );
        }
      } finally {
        nodeIds.forEach(nodeId => setNodeLoading(nodeId, false));
        setNodeLoading(targetId, false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });
      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to batch move items:', error);
      hideContextMenu();
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (nodeIds: DatabaseId[]) => {
      nodeIds.forEach(nodeId => setNodeLoading(nodeId, true));

      try {
        switch (contextType) {
          case 'workspace':
            return await batchDeleteWorkspaceItems(nodeIds);
          case 'upload':
            return await batchDeleteUploadItems(nodeIds);
          default:
            throw new Error(
              `Batch delete not supported for context: ${contextType}`
            );
        }
      } finally {
        nodeIds.forEach(nodeId => setNodeLoading(nodeId, false));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tree', contextType, contextId],
      });
      hideContextMenu();
    },
    onError: error => {
      console.error('Failed to batch delete items:', error);
      hideContextMenu();
    },
  });

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // Folder operations
    createFolder: createFolderMutation.mutateAsync,
    createFolderAsync: createFolderMutation.mutateAsync,
    isCreatingFolder: createFolderMutation.isPending,

    // Item operations
    deleteItem: deleteFolderMutation.mutateAsync,
    deleteItemAsync: deleteFolderMutation.mutateAsync,
    isDeletingItem: deleteFolderMutation.isPending,

    moveItem: moveItemMutation.mutateAsync,
    moveItemAsync: moveItemMutation.mutateAsync,
    isMovingItem: moveItemMutation.isPending,

    renameItem: renameItemMutation.mutateAsync,
    renameItemAsync: renameItemMutation.mutateAsync,
    isRenamingItem: renameItemMutation.isPending,

    downloadItem: downloadItemMutation.mutateAsync,
    downloadItemAsync: downloadItemMutation.mutateAsync,
    isDownloadingItem: downloadItemMutation.isPending,

    // Batch operations
    batchMove: batchMoveMutation.mutateAsync,
    batchMoveAsync: batchMoveMutation.mutateAsync,
    isBatchMoving: batchMoveMutation.isPending,

    batchDelete: batchDeleteMutation.mutateAsync,
    batchDeleteAsync: batchDeleteMutation.mutateAsync,
    isBatchDeleting: batchDeleteMutation.isPending,

    // State helpers
    selectNode,
    toggleNode,

    // Loading state
    isLoading:
      createFolderMutation.isPending ||
      deleteFolderMutation.isPending ||
      moveItemMutation.isPending ||
      renameItemMutation.isPending ||
      downloadItemMutation.isPending ||
      batchMoveMutation.isPending ||
      batchDeleteMutation.isPending,
  };
};

// =============================================================================
// MOCK IMPLEMENTATIONS - Replace with actual API calls
// =============================================================================

// Workspace operations
const createWorkspaceFolder = async (
  workspaceId: DatabaseId,
  data: { name: string; parentId?: DatabaseId }
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: `folder-${Date.now()}`,
    name: data.name,
    parentId: data.parentId,
  };
};

const deleteWorkspaceItem = async (nodeId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId };
};

const moveWorkspaceItem = async (nodeId: DatabaseId, targetId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId, targetId };
};

const renameWorkspaceItem = async (nodeId: DatabaseId, newName: string) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId, newName };
};

const downloadWorkspaceItem = async (nodeId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId };
};

const batchMoveWorkspaceItems = async (
  nodeIds: DatabaseId[],
  targetId: DatabaseId
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { nodeIds, targetId };
};

const batchDeleteWorkspaceItems = async (nodeIds: DatabaseId[]) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { nodeIds };
};

// Files operations
const moveFileToWorkspace = async (
  nodeId: DatabaseId,
  targetId: DatabaseId
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId, targetId };
};

const downloadLinkItem = async (nodeId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId };
};

const batchMoveFilesToWorkspace = async (
  nodeIds: DatabaseId[],
  targetId: DatabaseId
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { nodeIds, targetId };
};

// Upload operations
const createUploadFolder = async (
  linkId: DatabaseId,
  data: { name: string; parentId?: DatabaseId }
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: `upload-folder-${Date.now()}`,
    name: data.name,
    parentId: data.parentId,
  };
};

const deleteUploadItem = async (nodeId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId };
};

const moveUploadItem = async (nodeId: DatabaseId, targetId: DatabaseId) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId, targetId };
};

const renameUploadItem = async (nodeId: DatabaseId, newName: string) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { id: nodeId, newName };
};

const batchMoveUploadItems = async (
  nodeIds: DatabaseId[],
  targetId: DatabaseId
) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { nodeIds, targetId };
};

const batchDeleteUploadItems = async (nodeIds: DatabaseId[]) => {
  // TODO: Implement actual API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { nodeIds };
};
