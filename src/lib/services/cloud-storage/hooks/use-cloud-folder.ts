import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import type { CloudProvider, CloudTreeNode, CloudFile } from '../providers/types';
import { GoogleDriveProvider } from '../providers/google-drive';
import { OneDriveProvider } from '../providers/onedrive';
import { GoogleDriveTreeAdapter } from '../adapters/google-adapter';
import { OneDriveTreeAdapter } from '../adapters/onedrive-adapter';

export function useCloudFolder(provider: CloudProvider['id']) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const getProviderAdapter = (providerId: CloudProvider['id']) => {
    switch (providerId) {
      case 'google-drive':
        return GoogleDriveTreeAdapter;
      case 'onedrive':
        return OneDriveTreeAdapter;
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  };

  const createProviderInstance = async (providerId: CloudProvider['id']) => {
    const token = await getToken({ template: providerId });
    if (!token) {
      throw new Error(`No access token for ${providerId}`);
    }

    switch (providerId) {
      case 'google-drive':
        return new GoogleDriveProvider(token);
      case 'onedrive':
        return new OneDriveProvider(token);
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }
  };

  // Query for root files
  const { data: tree = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cloud-files', provider, 'root'],
    queryFn: async () => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.getFiles();
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      const adapter = getProviderAdapter(provider);
      return adapter.buildTree(result.data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation to load folder contents
  const loadFolderMutation = useMutation({
    mutationFn: async ({ folderId }: { folderId: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.getFiles(folderId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return { folderId, files: result.data };
    },
    onSuccess: ({ folderId, files }) => {
      queryClient.setQueryData<CloudTreeNode[]>(
        ['cloud-files', provider, 'root'],
        (oldTree) => {
          if (!oldTree) return [];
          const adapter = getProviderAdapter(provider);
          return adapter.updateNodeChildren(oldTree, folderId, files);
        }
      );
    },
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async ({ query }: { query: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.searchFiles(query);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, folderId }: { file: File; folderId?: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.uploadFile(file, folderId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (newFile) => {
      // Invalidate the folder where the file was uploaded
      const parentId = newFile.parents?.[0] || 'root';
      queryClient.invalidateQueries({
        queryKey: ['cloud-files', provider, parentId],
      });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.createFolder(name, parentId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: (newFolder) => {
      // Invalidate the parent folder
      const parentId = newFolder.parents?.[0] || 'root';
      queryClient.invalidateQueries({
        queryKey: ['cloud-files', provider, parentId],
      });
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async ({ fileId }: { fileId: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.deleteFile(fileId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: () => {
      // Invalidate all queries for this provider
      queryClient.invalidateQueries({
        queryKey: ['cloud-files', provider],
      });
    },
  });

  // Move file mutation
  const moveFileMutation = useMutation({
    mutationFn: async ({ fileId, newParentId }: { fileId: string; newParentId: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.moveFile(fileId, newParentId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onSuccess: () => {
      // Invalidate all queries for this provider
      queryClient.invalidateQueries({
        queryKey: ['cloud-files', provider],
      });
    },
  });

  // Download file mutation
  const downloadFileMutation = useMutation({
    mutationFn: async ({ fileId }: { fileId: string }) => {
      const providerInstance = await createProviderInstance(provider);
      const result = await providerInstance.downloadFile(fileId);
      
      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
  });

  return {
    tree,
    isLoading,
    error,
    refetch,
    loadFolder: loadFolderMutation.mutate,
    isLoadingFolder: loadFolderMutation.isPending,
    search: searchMutation.mutate,
    searchResults: searchMutation.data,
    isSearching: searchMutation.isPending,
    uploadFile: uploadFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    createFolder: createFolderMutation.mutate,
    isCreatingFolder: createFolderMutation.isPending,
    deleteFile: deleteFileMutation.mutate,
    isDeleting: deleteFileMutation.isPending,
    moveFile: moveFileMutation.mutate,
    isMoving: moveFileMutation.isPending,
    downloadFile: downloadFileMutation.mutateAsync,
    isDownloading: downloadFileMutation.isPending,
  };
}