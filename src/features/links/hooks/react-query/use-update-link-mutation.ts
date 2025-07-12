/**
 * React Query mutation hook for updating links
 *
 * Provides optimistic updates, error handling, and query invalidation
 * for updating existing links.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLinkAction } from '../../lib/actions/update';
import { linksQueryKeys } from '../../lib/query-keys';
import type { Link, DatabaseId } from '@/lib/supabase/types';
import type { UpdateLinkActionData } from '../../lib/validations';
import { toast } from 'sonner';

interface UseUpdateLinkMutationOptions {
  onSuccess?: (data: Link) => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

interface UseUpdateLinkMutationResult {
  mutate: (data: UpdateLinkActionData) => void;
  mutateAsync: (data: UpdateLinkActionData) => Promise<Link>;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: Link | undefined;
  reset: () => void;
}

/**
 * Hook for updating links with optimistic updates
 */
export function useUpdateLinkMutation(
  options: UseUpdateLinkMutationOptions = {}
): UseUpdateLinkMutationResult {
  const queryClient = useQueryClient();
  const { onSuccess, onError, optimistic = true } = options;

  const mutation = useMutation({
    mutationFn: async (input: UpdateLinkActionData): Promise<Link> => {
      const result = await updateLinkAction(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update link');
      }

      if (!result.data) {
        throw new Error('No data returned from update action');
      }

      return result.data;
    },

    onMutate: async (input: UpdateLinkActionData) => {
      if (!optimistic) return;

      const linkId = input.id;
      const { id, ...updates } = input;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: linksQueryKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: linksQueryKeys.detail(linkId),
      });

      // Snapshot the previous values
      const previousLinks = queryClient.getQueryData(linksQueryKeys.list());
      const previousLink = queryClient.getQueryData(
        linksQueryKeys.detail(linkId)
      );

      // Optimistically update the list cache
      if (previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), (old: any) =>
          old?.map((link: Link) =>
            link.id === linkId
              ? { ...link, ...updates, updatedAt: new Date() }
              : link
          )
        );
      }

      // Optimistically update the detail cache
      if (previousLink) {
        queryClient.setQueryData(linksQueryKeys.detail(linkId), (old: any) =>
          old ? { ...old, ...updates, updatedAt: new Date() } : old
        );
      }

      return { previousLinks, previousLink };
    },

    onError: (error, variables, context) => {
      // Roll back optimistic updates
      if (context?.previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), context.previousLinks);
      }
      if (context?.previousLink) {
        queryClient.setQueryData(
          linksQueryKeys.detail(variables.id),
          context.previousLink
        );
      }

      toast.error(error.message || 'Failed to update link');
      onError?.(error);
    },

    onSuccess: (data, variables, context) => {
      // Invalidate and refetch to get the real data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: linksQueryKeys.detail(variables.id),
      });

      toast.success('Link updated successfully');
      onSuccess?.(data);
    },

    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: linksQueryKeys.detail(variables.id),
      });
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
 * Hook for updating a specific link by ID
 */
export function useUpdateLinkById(
  linkId: DatabaseId,
  options: UseUpdateLinkMutationOptions = {}
) {
  const mutation = useUpdateLinkMutation(options);

  const updateLink = (updates: Partial<UpdateLinkActionData>) => {
    mutation.mutate({ id: linkId, ...updates });
  };

  const updateLinkAsync = (updates: Partial<UpdateLinkActionData>) => {
    return mutation.mutateAsync({ id: linkId, ...updates });
  };

  return {
    ...mutation,
    updateLink,
    updateLinkAsync,
  };
}
