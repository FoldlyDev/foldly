'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  connectCloudProvider, 
  disconnectCloudProvider,
  getCloudProviderToken 
} from '@/lib/services/cloud-storage/actions/cloud-actions';
import { getCloudStorageStatus } from '@/lib/services/cloud-storage/actions/oauth-actions';
import { GoogleDriveProvider } from '@/lib/services/cloud-storage/providers/google-drive';
import { OneDriveProvider } from '@/lib/services/cloud-storage/providers/onedrive';
import type { CloudProvider, CloudFile, CloudProviderApi } from '@/lib/services/cloud-storage/providers/types';

interface UseCloudStorageOptions {
  provider: CloudProvider['id'];
  autoConnect?: boolean;
}

interface UseCloudStorageResult {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Provider info
  provider: CloudProvider['id'];
  email?: string | undefined;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // File operations
  files: CloudFile[];
  isLoadingFiles: boolean;
  filesError: string | null;
  
  listFiles: (folderId?: string) => Promise<void>;
  uploadFile: (file: File, folderId?: string) => Promise<CloudFile | null>;
  downloadFile: (fileId: string) => Promise<Blob | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  createFolder: (name: string, parentId?: string) => Promise<CloudFile | null>;
  moveFile: (fileId: string, newParentId: string) => Promise<boolean>;
  searchFiles: (query: string) => Promise<CloudFile[]>;
  
  // Provider API instance
  api: CloudProviderApi | null;
}

export function useCloudStorage({
  provider,
  autoConnect = false
}: UseCloudStorageOptions): UseCloudStorageResult {
  const queryClient = useQueryClient();
  const [api, setApi] = useState<CloudProviderApi | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const isInitializedRef = useRef(false);

  // Query for connection status
  const { data: connectionStatus } = useQuery({
    queryKey: ['cloud-storage', 'status'],
    queryFn: getCloudStorageStatus,
    refetchInterval: 60000, // Refresh every minute
  });

  const providerKey = provider === 'google-drive' ? 'google' : 'microsoft';
  const hasOAuthToken = connectionStatus?.[providerKey]?.connected || false;
  const email = connectionStatus?.[providerKey]?.email;

  // Real connection status: has OAuth AND API initialized
  const isConnected = hasOAuthToken && !!api;

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      setConnectionError(null);
      const result = await connectCloudProvider(provider);
      
      if (!result.success) {
        if (result.needsConnection) {
          throw new Error('Please connect your account through your user profile settings');
        }
        throw new Error(result.error || 'Connection failed');
      }
      
      if (!result.token) {
        throw new Error('No access token received');
      }

      // Create provider instance with token
      const providerInstance = provider === 'google-drive'
        ? new GoogleDriveProvider(result.token)
        : new OneDriveProvider(result.token);
      
      setApi(providerInstance);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-storage', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['cloud-storage', provider, 'files'] });
    },
    onError: (error: Error) => {
      setConnectionError(error.message);
      setApi(null);
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const result = await disconnectCloudProvider(provider);
      if (!result.success) {
        throw new Error(result.error || 'Disconnection failed');
      }
      setApi(null);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-storage', 'status'] });
      queryClient.removeQueries({ queryKey: ['cloud-storage', provider] });
    },
  });

  // Files query - only runs when API is ready
  const filesQuery = useQuery<CloudFile[], Error>({
    queryKey: ['cloud-storage', provider, 'files'],
    queryFn: async () => {
      if (!api) {
        throw new Error('Provider not initialized');
      }

      const result = await api.getFiles();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!api, // Only query when API is initialized
    retry: 1,
  });

  // Handle file errors separately  
  useEffect(() => {
    if (filesQuery.error) {
      setFilesError(filesQuery.error.message);
    }
  }, [filesQuery.error]);

  // Initialize API on mount if OAuth is connected and autoConnect is enabled
  useEffect(() => {
    const initializeApi = async () => {
      if (!autoConnect || isInitializedRef.current || !hasOAuthToken || api || connectMutation.isPending) {
        return;
      }

      isInitializedRef.current = true;

      // Get token and create API instance
      const tokenResult = await getCloudProviderToken(provider);
      if (!tokenResult.success || !tokenResult.token) {
        setConnectionError('Failed to get access token');
        return;
      }

      // Create provider instance
      const providerInstance = provider === 'google-drive'
        ? new GoogleDriveProvider(tokenResult.token)
        : new OneDriveProvider(tokenResult.token);

      setApi(providerInstance);
    };

    initializeApi();
  }, [autoConnect, hasOAuthToken, api, provider, connectMutation.isPending]);

  // File operations
  const listFiles = useCallback(async (folderId?: string) => {
    if (!api) {
      setFilesError('Not connected');
      return;
    }

    setFilesError(null);

    // If no folderId, refresh the main files list
    if (!folderId) {
      queryClient.invalidateQueries({
        queryKey: ['cloud-storage', provider, 'files']
      });
      return;
    }

    // For specific folder, fetch its contents
    const result = await api.getFiles(folderId);

    if (!result.success) {
      setFilesError(result.error.message);
      return;
    }

    // Update the files list with the new folder contents
    const currentFiles = queryClient.getQueryData<CloudFile[]>(['cloud-storage', provider, 'files']) || [];
    const updatedFiles = [...currentFiles, ...result.data.filter(
      newFile => !currentFiles.some(existing => existing.id === newFile.id)
    )];

    queryClient.setQueryData(
      ['cloud-storage', provider, 'files'],
      updatedFiles
    );
  }, [api, provider, queryClient]);

  const uploadFile = useCallback(async (file: File, folderId?: string) => {
    if (!api) {
      setFilesError('Not connected');
      return null;
    }
    
    const result = await api.uploadFile(file, folderId);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return null;
    }
    
    // Refresh files list
    queryClient.invalidateQueries({ 
      queryKey: ['cloud-storage', provider, 'files'] 
    });
    
    return result.data;
  }, [api, provider, queryClient]);

  const downloadFile = useCallback(async (fileId: string) => {
    if (!api) {
      setFilesError('Not connected');
      return null;
    }
    
    const result = await api.downloadFile(fileId);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return null;
    }
    
    return result.data;
  }, [api]);

  const deleteFile = useCallback(async (fileId: string) => {
    if (!api) {
      setFilesError('Not connected');
      return false;
    }
    
    const result = await api.deleteFile(fileId);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return false;
    }
    
    // Refresh files list
    queryClient.invalidateQueries({ 
      queryKey: ['cloud-storage', provider, 'files'] 
    });
    
    return true;
  }, [api, provider, queryClient]);

  const createFolder = useCallback(async (name: string, parentId?: string) => {
    if (!api) {
      setFilesError('Not connected');
      return null;
    }
    
    const result = await api.createFolder(name, parentId);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return null;
    }
    
    // Refresh files list
    queryClient.invalidateQueries({ 
      queryKey: ['cloud-storage', provider, 'files'] 
    });
    
    return result.data;
  }, [api, provider, queryClient]);

  const moveFile = useCallback(async (fileId: string, newParentId: string) => {
    if (!api) {
      setFilesError('Not connected');
      return false;
    }
    
    const result = await api.moveFile(fileId, newParentId);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return false;
    }
    
    // Refresh files list
    queryClient.invalidateQueries({ 
      queryKey: ['cloud-storage', provider, 'files'] 
    });
    
    return true;
  }, [api, provider, queryClient]);

  const searchFiles = useCallback(async (query: string) => {
    if (!api) {
      setFilesError('Not connected');
      return [];
    }
    
    const result = await api.searchFiles(query);
    
    if (!result.success) {
      setFilesError(result.error.message);
      return [];
    }
    
    return result.data;
  }, [api]);

  return {
    // Connection state
    isConnected,
    isConnecting: connectMutation.isPending,
    connectionError,
    
    // Provider info
    provider,
    email,
    
    // Actions
    connect: async () => { 
      await connectMutation.mutateAsync();
    },
    disconnect: async () => {
      await disconnectMutation.mutateAsync();
    },
    
    // File operations
    files: filesQuery.data || [],
    isLoadingFiles: filesQuery.isLoading || filesQuery.isFetching,
    filesError,
    
    listFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    moveFile,
    searchFiles,
    
    // Provider API instance
    api,
  };
}