import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { CloudProvider } from '@/lib/services/cloud-storage';

interface ProviderSyncStatus {
  provider: CloudProvider['id'];
  isConnected: boolean;
  lastSyncedAt?: Date;
  email?: string;
}

export function useProviderSync() {
  const { user } = useUser();
  const { getToken } = useAuth();

  const checkProviderStatus = async (
    provider: CloudProvider['id']
  ): Promise<ProviderSyncStatus> => {
    try {
      const token = await getToken({ template: provider });
      
      if (!token) {
        return {
          provider,
          isConnected: false,
        };
      }

      // Get the OAuth account info from Clerk
      const oauthAccount = user?.externalAccounts.find(
        account => account.provider === provider.replace('-', '')
      );

      return {
        provider,
        isConnected: true,
        lastSyncedAt: oauthAccount?.updatedAt,
        email: oauthAccount?.emailAddress,
      };
    } catch (error) {
      console.error(`Error checking ${provider} status:`, error);
      return {
        provider,
        isConnected: false,
      };
    }
  };

  const { data: providerStatuses = [], isLoading } = useQuery({
    queryKey: ['provider-sync-status', user?.id],
    queryFn: async () => {
      const providers: CloudProvider['id'][] = ['google-drive', 'onedrive'];
      const statuses = await Promise.all(
        providers.map(provider => checkProviderStatus(provider))
      );
      return statuses;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const connectProvider = async (provider: CloudProvider['id']) => {
    // This would typically redirect to OAuth flow
    // For now, we'll use Clerk's built-in OAuth
    const redirectUrl = `/dashboard/cloud-storage?connected=${provider}`;
    
    // Trigger Clerk OAuth flow
    if (user) {
      await user.createExternalAccount({
        strategy: provider.replace('-', '') as any,
        redirectUrl,
      });
    }
  };

  const disconnectProvider = async (provider: CloudProvider['id']) => {
    // Find the external account
    const account = user?.externalAccounts.find(
      acc => acc.provider === provider.replace('-', '')
    );

    if (account) {
      await account.destroy();
    }
  };

  return {
    providerStatuses,
    isLoading,
    connectProvider,
    disconnectProvider,
    isProviderConnected: (provider: CloudProvider['id']) => {
      return providerStatuses.find(s => s.provider === provider)?.isConnected || false;
    },
  };
}