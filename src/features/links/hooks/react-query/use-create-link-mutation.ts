/**
 * React Query mutation hook for creating links
 *
 * Provides optimistic updates, error handling, and query invalidation
 * for creating new links with a great user experience.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLinkAction } from '../../lib/actions/create';
import { linksQueryKeys } from '../../lib/query-keys';
import { filesQueryKeys } from '@/features/files/lib/query-keys';
import type { Link, LinkWithStats } from '@/lib/database/types/links';
import type { CreateLinkActionData } from '../../lib/validations';
import { toast } from 'sonner';

interface UseCreateLinkMutationOptions {
  onSuccess?: (data: Link) => void;
  onError?: (error: Error) => void;
  optimistic?: boolean;
}

interface UseCreateLinkMutationResult {
  mutate: (data: CreateLinkActionData & { brandingImageFile?: File }) => void;
  mutateAsync: (data: CreateLinkActionData & { brandingImageFile?: File }) => Promise<Link>;
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
    mutationFn: async (input: CreateLinkActionData & { brandingImageFile?: File }): Promise<Link> => {
      // Check if we have a branding image file to upload
      const hasBrandingImage = input.brandingImageFile && input.branding?.enabled;
      
      // First, create the link without the image
      const { brandingImageFile, ...linkData } = input;
      const result = await createLinkAction(linkData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create link');
      }

      if (!result.data) {
        throw new Error('No data returned from create action');
      }

      // If we have a branding image, upload it via API route
      if (hasBrandingImage && brandingImageFile) {
        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', brandingImageFile);
          formData.append('linkId', result.data.id);
          formData.append('enabled', String(input.branding?.enabled || false));
          if (input.branding?.color) {
            formData.append('color', input.branding.color);
          }

          // Upload to API route
          const uploadResponse = await fetch('/api/links/branding/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success && uploadResult.data?.link) {
            // Return the updated link with branding
            return uploadResult.data.link;
          }
        } catch (uploadError) {
          console.error('Failed to upload branding image:', uploadError);
          // Still return the created link even if image upload failed
        }
      }

      return result.data;
    },

    onMutate: async (input: CreateLinkActionData & { brandingImageFile?: File }) => {
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
          branding: input.branding ? {
            enabled: input.branding.enabled,
            ...(input.branding.color && { color: input.branding.color }),
            // Note: imageUrl and imagePath will be set after actual upload
          } : { enabled: false },
          createdAt: new Date(),
          updatedAt: new Date(),
          totalUploads: 0,
          totalFiles: 0,
          totalSize: 0,
          lastUploadAt: null,
          storageUsed: 0,
          storageLimit: 1000000000, // 1GB default
          unreadUploads: 0,
          lastNotificationAt: null,
          sourceFolderId: null,
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

    onError: (error, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLinks) {
        queryClient.setQueryData(linksQueryKeys.list(), context.previousLinks);
      }

      toast.error(error.message || 'Failed to create link');
      onError?.(error);
    },

    onSuccess: (data) => {
      // Update the cache with the complete link data (including imageUrl if uploaded)
      queryClient.setQueryData(linksQueryKeys.list(), (old: LinkWithStats[] | undefined) => {
        if (!old) return [data as LinkWithStats];
        
        // Replace the optimistic link with the real one
        const updated = old.map(link => {
          // Check if this is the optimistic link (temp ID) or matching real ID
          if (link.id.startsWith('temp-') || link.id === data.id) {
            // Return the real link with stats
            return {
              ...data,
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
            } as LinkWithStats;
          }
          return link;
        });
        
        // If we didn't find a match, add it to the beginning
        const hasMatch = updated.some(link => link.id === data.id);
        if (!hasMatch) {
          return [{
            ...data,
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
          } as LinkWithStats, ...old];
        }
        
        return updated;
      });
      
      // Invalidate and refetch queries to get the real data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.stats() });
      
      // Invalidate files feature queries to ensure new link appears there
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.linksWithFiles() });
      queryClient.invalidateQueries({ queryKey: filesQueryKeys.all });

      // Don't show toast here - let the calling code handle it
      // This prevents double toasts when using quick start or other features
      onSuccess?.(data);
    },

    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: linksQueryKeys.lists() });
      
      // Also invalidate files feature queries
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
 * Hook for creating links with form integration
 */
export function useCreateLinkForm(options: UseCreateLinkMutationOptions = {}) {
  const mutation = useCreateLinkMutation(options);

  const handleSubmit = async (data: CreateLinkActionData & { brandingImageFile?: File }) => {
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
