/**
 * React Query mutation hook for deleting links
 *
 * Provides optimistic updates, error handling, and query invalidation
 * for deleting links.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteLinkAction } from '../../lib/actions/delete';
import { linksQueryKeys } from '../../lib/query-keys';
import { filesQueryKeys } from '@/features/files/lib/query-keys';
import type { Link, DatabaseId } from '@/lib/database/types';
import { NotificationEventType } from '@/features/notifications/core';
import { useEventBus } from '@/features/notifications/hooks/use-event-bus';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';

interface UseDeleteLinkMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

interface UseDeleteLinkMutationResult {
  mutate: (linkId: DatabaseId) => void;
  mutateAsync: (linkId: DatabaseId) => Promise<void>;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for deleting links with optimistic updates
 */
export function useDeleteLinkMutation(
  options: UseDeleteLinkMutationOptions = {}
): UseDeleteLinkMutationResult {
  const queryClient = useQueryClient();
  const { emit } = useEventBus();
  const { onSuccess, onError, optimistic = true } = options;

  const mutation = useMutation({
    mutationFn: async (linkId: DatabaseId): Promise<void> => {
      const result = await deleteLinkAction(linkId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete link');
      }
    },

    onMutate: async (linkId: DatabaseId) => {
      if (!optimistic) return;

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

      // Optimistically remove from list cache
      if (previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), (old: any) =>
          old?.filter((link: Link) => link.id !== linkId)
        );
      }

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: linksQueryKeys.detail(linkId) });

      return { previousLinks, previousLink };
    },

    onError: (error, linkId, context) => {
      // Roll back optimistic updates
      if (context?.previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), context.previousLinks);
      }
      if (context?.previousLink) {
        queryClient.setQueryData(
          linksQueryKeys.detail(linkId),
          context.previousLink
        );
      }

      // Emit error event instead of direct toast
      emit(NotificationEventType.LINK_DELETE_ERROR, {
        linkId: linkId as string,
        linkTitle: 'Link',
        error: error.message || 'Failed to delete link',
      });
      onError?.(error);
    },

    onSuccess: async (data, linkId, context) => {
      // Invalidate and refetch to get the real data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.stats() });

      // Remove the specific link query
      queryClient.removeQueries({ queryKey: linksQueryKeys.detail(linkId) });
      
      // Invalidate storage tracking queries since deleting a link frees up storage
      queryClient.invalidateQueries({ queryKey: ['storage', 'tracking'] });
      
      // Invalidate files feature queries to ensure deleted link is removed there
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.links() });
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.all });

      // Invalidate workspace queries to update the hasGeneratedLink flag on folders
      // This is important for generated links to remove the icon from folders
      console.log('[Delete Link] Invalidating workspace queries...');
      await queryClient.invalidateQueries({
        queryKey: ['workspace', 'data'],
      });
      console.log('[Delete Link] Workspace queries invalidated');

      // Emit success event for notification
      emit(NotificationEventType.LINK_DELETE_SUCCESS, {
        linkId: linkId as string,
        linkTitle: 'Link',
      });
      onSuccess?.();
    },

    onSettled: (data, error, linkId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      
      // Also invalidate files feature queries
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.links() });
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.all });
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}

/**
 * Hook for deleting a specific link with confirmation
 */
export function useDeleteLinkWithConfirmation(
  options: UseDeleteLinkMutationOptions = {}
) {
  const mutation = useDeleteLinkMutation(options);

  const deleteLink = (linkId: DatabaseId, linkTitle?: string) => {
    const confirmMessage = linkTitle
      ? `Are you sure you want to delete "${linkTitle}"?`
      : 'Are you sure you want to delete this link?';

    if (window.confirm(confirmMessage)) {
      mutation.mutate(linkId);
    }
  };

  const deleteLinkAsync = async (linkId: DatabaseId, linkTitle?: string) => {
    const confirmMessage = linkTitle
      ? `Are you sure you want to delete "${linkTitle}"?`
      : 'Are you sure you want to delete this link?';

    if (window.confirm(confirmMessage)) {
      return mutation.mutateAsync(linkId);
    }
  };

  return {
    ...mutation,
    deleteLink,
    deleteLinkAsync,
  };
}
