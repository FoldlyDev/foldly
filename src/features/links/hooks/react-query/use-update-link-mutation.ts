/**
 * React Query mutation hook for updating links
 *
 * Provides optimistic updates, error handling, and query invalidation
 * for updating existing links.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLinkAction } from '../../lib/actions/update';
import { linksQueryKeys } from '../../lib/query-keys';
import { filesQueryKeys } from '@/features/files/lib/query-keys';
import { storageQueryKeys } from '@/features/workspace/hooks/use-storage-tracking';
import type { Link, DatabaseId } from '@/lib/database/types';
import type { UpdateLinkActionData } from '../../lib/validations';
import { NotificationEventType } from '@/features/notifications/core';
import { useEventBus } from '@/features/notifications/hooks/use-event-bus';

interface UseUpdateLinkMutationOptions {
  onSuccess?: (result: UpdateLinkResult) => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

interface UpdateLinkResult {
  data: Link;
  meta?:
    | {
        isCascadeUpdate?: boolean;
        affectedLinksCount?: number;
        affectedLinkIds?: string[];
      }
    | undefined;
}

interface UseUpdateLinkMutationResult {
  mutate: (data: UpdateLinkActionData) => void;
  mutateAsync: (data: UpdateLinkActionData) => Promise<UpdateLinkResult>;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  data: UpdateLinkResult | undefined;
  reset: () => void;
}

/**
 * Hook for updating links with optimistic updates
 */
export function useUpdateLinkMutation(
  options: UseUpdateLinkMutationOptions = {}
): UseUpdateLinkMutationResult {
  const queryClient = useQueryClient();
  const { emit } = useEventBus();
  const { onSuccess, onError, optimistic = true } = options;

  const mutation = useMutation({
    mutationFn: async (
      input: UpdateLinkActionData
    ): Promise<UpdateLinkResult> => {
      const result = await updateLinkAction(input);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update link');
      }

      if (!result.data) {
        throw new Error('No data returned from update action');
      }

      return {
        data: result.data,
        meta: result.meta || undefined,
      };
    },

    onMutate: async (input: UpdateLinkActionData) => {
      if (!optimistic) return;

      const linkId = input.id;
      const { id, ...updates } = input;

      // Skip optimistic updates for base link slug changes (cascade operations)
      // as we can't predict which links will be affected
      const isBaseSlugChange = updates.slug !== undefined;
      if (isBaseSlugChange) {
        // Just cancel queries for now, no optimistic updates for cascade
        await queryClient.cancelQueries({ queryKey: linksQueryKeys.lists() });
        return { skipOptimistic: true };
      }

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
      // Roll back optimistic updates (only if we made them)
      if (context && !context.skipOptimistic) {
        if (context.previousLinks) {
          queryClient.setQueryData(
            linksQueryKeys.list(),
            context.previousLinks
          );
        }
        if (context.previousLink) {
          queryClient.setQueryData(
            linksQueryKeys.detail(variables.id),
            context.previousLink
          );
        }
      }

      // Emit error event
      emit(NotificationEventType.LINK_UPDATE_ERROR, {
        linkId: variables.id,
        linkTitle: variables.title || 'Link',
        error: error.message || 'Failed to update link',
      });
      onError?.(error);
    },

    onSuccess: (result, variables, context) => {
      // Handle cascade updates with comprehensive cache invalidation
      if (result.meta?.isCascadeUpdate) {
        // Invalidate all link queries for cascade updates
        queryClient.invalidateQueries({
          queryKey: ['links'],
          exact: false,
        });

        const affectedCount = result.meta.affectedLinksCount || 0;
        // Emit success event for cascade update
        emit(NotificationEventType.LINK_UPDATE_SUCCESS, {
          linkId: variables.id,
          linkTitle: `Base link updated - ${affectedCount} links updated`,
        });
      } else {
        // Regular single link update
        queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: linksQueryKeys.detail(variables.id),
        });

        // Emit success event for regular update
        emit(NotificationEventType.LINK_UPDATE_SUCCESS, {
          linkId: variables.id,
          linkTitle: variables.title || result.data?.title || 'Link',
        });
      }
      
      // Invalidate storage queries to reflect any changes in storage usage
      queryClient.invalidateQueries({ queryKey: storageQueryKeys.all });
      
      // Invalidate files feature queries to ensure updates are reflected there
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.linksWithFiles() });
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.all });

      onSuccess?.(result);
    },

    onSettled: (result, error, variables) => {
      // Handle settled state based on whether it was a cascade update
      if (result?.meta?.isCascadeUpdate) {
        // For cascade updates, invalidate all link-related queries
        queryClient.invalidateQueries({
          queryKey: ['links'],
          exact: false,
        });
      } else {
        // For regular updates, invalidate specific queries
        queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
        queryClient.invalidateQueries({
          queryKey: linksQueryKeys.detail(variables.id),
        });
      }
      
      // Always invalidate files feature queries regardless of success/error
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.linksWithFiles() });
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
