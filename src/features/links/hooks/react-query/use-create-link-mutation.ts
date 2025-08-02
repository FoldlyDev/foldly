/**
 * React Query mutation hook for creating links
 *
 * Provides optimistic updates, error handling, and query invalidation
 * for creating new links with a great user experience.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLinkAction } from '../../lib/actions/create';
import { linksQueryKeys } from '../../lib/query-keys';
import type { Link, LinkWithStats } from '@/lib/database/types/links';
import type { ActionResult, CreateLinkActionData } from '../../lib/validations';
import { toast } from 'sonner';

interface UseCreateLinkMutationOptions {
  onSuccess?: (data: Link) => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

interface UseCreateLinkMutationResult {
  mutate: (data: CreateLinkActionData) => void;
  mutateAsync: (data: CreateLinkActionData) => Promise<Link>;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: Link | undefined;
  reset: () => void;
}

/**
 * Hook for creating new links with optimistic updates
 */
export function useCreateLinkMutation(
  options: UseCreateLinkMutationOptions = {}
): UseCreateLinkMutationResult {
  const queryClient = useQueryClient();
  const { onSuccess, onError, optimistic = true } = options;

  const mutation = useMutation({
    mutationFn: async (input: CreateLinkActionData): Promise<Link> => {
      const result = await createLinkAction(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create link');
      }

      if (!result.data) {
        throw new Error('No data returned from create action');
      }

      return result.data;
    },

    onMutate: async (input: CreateLinkActionData) => {
      if (!optimistic) return;

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: linksQueryKeys.lists() });

      // Snapshot the previous value
      const previousLinks = queryClient.getQueryData(linksQueryKeys.list());

      // Optimistically update the cache
      if (previousLinks) {
        const optimisticLink: LinkWithStats = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId: 'temp-user-id',
          workspaceId: 'temp-workspace-id',
          slug: (input as any).slug || 'username', // Use input slug or default fallback
          linkType: input.topic ? 'custom' : 'base',
          passwordHash: null,
          ...input,
          topic: input.topic || null,
          description: input.description || null,
          allowedFileTypes: input.allowedFileTypes || null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          brandColor: input.brandColor || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalUploads: 0,
          totalFiles: 0,
          totalSize: 0,
          lastUploadAt: null,
          storageUsed: 0,
          storageLimit: 1000000000, // 1GB default
          stats: {
            fileCount: 0,
            batchCount: 0,
            folderCount: 0,
            totalViewCount: 0,
            uniqueViewCount: 0,
            averageFileSize: 0,
            storageUsedPercentage: 0,
            isNearLimit: false,
          },
        };

        queryClient.setQueryData(linksQueryKeys.list(), (old: any) => [
          optimisticLink,
          ...(old || []),
        ]);
      }

      // Return a context object with the snapshotted value
      return { previousLinks };
    },

    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), context.previousLinks);
      }

      toast.error(error.message || 'Failed to create link');
      onError?.(error);
    },

    onSuccess: (data, variables, context) => {
      // Invalidate and refetch queries to get the real data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.stats() });

      toast.success('Link created successfully');
      onSuccess?.(data);
    },

    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Hook for creating links with form integration
 */
export function useCreateLinkForm(options: UseCreateLinkMutationOptions = {}) {
  const mutation = useCreateLinkMutation(options);

  const handleSubmit = async (data: CreateLinkActionData) => {
    try {
      await mutation.mutateAsync(data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  return {
    ...mutation,
    handleSubmit,
  };
}
