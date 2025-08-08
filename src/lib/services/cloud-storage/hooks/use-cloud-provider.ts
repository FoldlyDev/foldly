import { useAuth, useUser } from '@clerk/nextjs';
import { CloudProvider } from '../providers/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface ProviderConnection {
  provider: CloudProvider['id'];
  isConnected: boolean;
  email?: string;
  lastSync?: Date;
}

export function useCloudProvider() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  // Check connection status for all providers
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['cloud-connections', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const providers: CloudProvider['id'][] = ['google-drive', 'onedrive'];
      const connectionStatus: ProviderConnection[] = [];

      for (const provider of providers) {
        try {
          const token = await getToken({ template: provider });
          if (token) {
            connectionStatus.push({
              provider,
              isConnected: true,
              email: user.emailAddresses[0]?.emailAddress,
              lastSync: new Date(),
            });
          } else {
            connectionStatus.push({
              provider,
              isConnected: false,
            });
          }
        } catch (error) {
          connectionStatus.push({
            provider,
            isConnected: false,
          });
        }
      }

      return connectionStatus;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user,
  });

  // Connect to a provider (initiate OAuth flow)
  const connectMutation = useMutation({
    mutationFn: async (provider: CloudProvider['id']) => {
      // This would typically initiate an OAuth flow
      // For now, we'll just simulate it
      const authUrl = getAuthUrl(provider);
      window.location.href = authUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-connections'] });
    },
  });

  // Disconnect from a provider
  const disconnectMutation = useMutation({
    mutationFn: async (provider: CloudProvider['id']) => {
      // This would revoke the OAuth token
      // Implementation depends on your backend
      const response = await fetch('/api/cloud/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cloud-connections'] });
    },
  });

  // Get the auth URL for a provider
  const getAuthUrl = (provider: CloudProvider['id']): string => {
    const redirectUri = `${window.location.origin}/api/cloud/callback`;
    
    switch (provider) {
      case 'google-drive':
        const googleParams = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          prompt: 'consent',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${googleParams}`;
      
      case 'onedrive':
        const msParams = new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_MS_CLIENT_ID || '',
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'files.readwrite offline_access',
        });
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${msParams}`;
      
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  };

  // Get connection for a specific provider
  const getConnection = (provider: CloudProvider['id']): ProviderConnection | undefined => {
    return connections.find(c => c.provider === provider);
  };

  // Check if a specific provider is connected
  const isConnected = (provider: CloudProvider['id']): boolean => {
    return getConnection(provider)?.isConnected || false;
  };

  return {
    connections,
    isLoading,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    getConnection,
    isConnected,
  };
}