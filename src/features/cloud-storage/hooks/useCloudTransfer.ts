import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { CloudTransferRequest, CloudTransferProgress, CloudProvider } from '@/lib/services/cloud-storage';
import { CloudTransferManager } from '../lib/transfer-manager';
import { useState, useCallback } from 'react';

export function useCloudTransfer() {
  const { getToken } = useAuth();
  const [progress, setProgress] = useState<CloudTransferProgress | null>(null);

  const transferMutation = useMutation({
    mutationFn: async (request: CloudTransferRequest) => {
      // Get tokens for both providers
      const sourceToken = await getToken({ template: request.sourceProvider });
      const targetToken = await getToken({ template: request.targetProvider });

      if (!sourceToken || !targetToken) {
        throw new Error('Failed to get access tokens');
      }

      // Create transfer manager
      const manager = new CloudTransferManager(
        sourceToken,
        targetToken,
        request.sourceProvider,
        request.targetProvider
      );

      // Set progress callback
      manager.setProgressCallback(setProgress);

      // Start transfer
      const result = await manager.transfer(request);

      if (!result.success) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    onError: (error) => {
      console.error('Transfer failed:', error);
    },
    onSuccess: () => {
      console.log('Transfer completed successfully');
    },
  });

  const startTransfer = useCallback(
    (request: CloudTransferRequest) => {
      setProgress(null);
      transferMutation.mutate(request);
    },
    [transferMutation]
  );

  const cancelTransfer = useCallback(() => {
    // In a real implementation, we'd need to add cancellation support to CloudTransferManager
    transferMutation.reset();
    setProgress(null);
  }, [transferMutation]);

  return {
    startTransfer,
    cancelTransfer,
    isTransferring: transferMutation.isPending,
    transferError: transferMutation.error,
    progress,
  };
}