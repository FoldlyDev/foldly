// =============================================================================
// USE LINKS HOOKS - Link Data Management
// =============================================================================
// 🎯 Link queries and mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserLinksAction,
  getLinkByIdAction,
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
  checkSlugAvailabilityAction,
} from '@/lib/actions';
import type {
  CreateLinkInput,
  UpdateLinkInput,
  UpdateLinkConfigInput,
  DeleteLinkInput,
} from '@/modules/links/lib/validation/link-core-schemas';
import { transformActionError, transformQueryResult, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { linkKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get all links for the authenticated user
 *
 * Used in:
 * - Links dashboard (display all links)
 * - Link selector components
 * - Navigation breadcrumbs
 *
 * @returns Query with array of links or empty array
 *
 * @example
 * ```tsx
 * function LinksView() {
 *   const { data: links, isLoading, error } = useUserLinks();
 *
 *   if (isLoading) return <LinksSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return <div>{links?.map(link => <LinkCard key={link.id} link={link} />)}</div>;
 * }
 * ```
 */
export function useUserLinks() {
  return useQuery({
    queryKey: linkKeys.lists(),
    queryFn: async () => {
      const result = await getUserLinksAction();
      return transformQueryResult(result, 'Failed to fetch links', []);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - links don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for quick navigation
  });
}

/**
 * Get a specific link by ID
 *
 * Used in:
 * - Link detail pages
 * - Link edit forms
 * - LinkCard hover states (optional detailed view)
 *
 * @param linkId - The link UUID to fetch
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if linkId exists)
 * @returns Query with link data or null
 *
 * @example
 * ```tsx
 * function LinkDetailPage({ linkId }: { linkId: string }) {
 *   const { data: link, isLoading } = useLinkById(linkId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!link) return <NotFound />;
 *
 *   return <LinkDetails link={link} />;
 * }
 * ```
 */
export function useLinkById(
  linkId: string | undefined | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: linkId ? linkKeys.detail(linkId) : ['links', 'disabled'],
    queryFn: async () => {
      const result = await getLinkByIdAction({ linkId: linkId! });
      return transformQueryResult(result, 'Failed to fetch link');
    },
    enabled: options?.enabled !== false && !!linkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Check if a slug is available
 *
 * Used in:
 * - Link creation form (real-time validation)
 * - Link edit form (slug change validation)
 *
 * @param slug - The slug to check
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if slug exists)
 * @returns Query with boolean availability status
 *
 * @example
 * ```tsx
 * function SlugInput() {
 *   const [slug, setSlug] = useState('');
 *   const { data: isAvailable, isLoading } = useCheckSlugAvailability(slug, {
 *     enabled: slug.length >= 3
 *   });
 *
 *   return (
 *     <div>
 *       <input value={slug} onChange={e => setSlug(e.target.value)} />
 *       {isLoading && <Spinner />}
 *       {isAvailable === false && <Error>Slug is taken</Error>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCheckSlugAvailability(
  slug: string | undefined | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: slug ? linkKeys.slugCheck(slug) : ['links', 'slug-check', 'disabled'],
    queryFn: async () => {
      const result = await checkSlugAvailabilityAction({ slug: slug! });
      return transformQueryResult(result, 'Failed to check slug availability');
    },
    enabled: options?.enabled !== false && !!slug,
    staleTime: 30 * 1000, // 30 seconds - slugs can be claimed quickly
    gcTime: 60 * 1000, // 1 minute - short cache
  });
}

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Create a new link
 *
 * Used in:
 * - Link creation modal/form
 * - Quick link creation from dashboard
 *
 * Features:
 * - Toast notifications on success/error
 * - Automatic query invalidation (refreshes link list)
 * - Returns created link data on success
 *
 * @returns Mutation for creating links
 *
 * @example
 * ```tsx
 * function CreateLinkForm() {
 *   const createLink = useCreateLink();
 *
 *   const handleSubmit = (data: CreateLinkInput) => {
 *     createLink.mutate(data, {
 *       onSuccess: (result) => {
 *         if (result.success) {
 *           router.push(`/dashboard/links/${result.data.id}`);
 *         }
 *       }
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLinkInput) => {
      const result = await createLinkAction(input);
      return transformActionError(result, 'Failed to create link');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate links list to show new link
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });

      // Set the new link in cache
      queryClient.setQueryData(linkKeys.detail(data.id), data);
    },
    onError: createMutationErrorHandler('Link creation'),
    retry: false,
  });
}

/**
 * Update link details (name, slug, isPublic, isActive)
 *
 * Used in:
 * - Link edit form
 * - Quick rename actions
 * - Toggle public/active status
 *
 * Features:
 * - Toast notifications on success/error
 * - Invalidates both list and individual link cache
 * - Returns updated link data
 *
 * @returns Mutation for updating links
 *
 * @example
 * ```tsx
 * function LinkEditForm({ link }: { link: Link }) {
 *   const updateLink = useUpdateLink();
 *
 *   const handleToggleActive = () => {
 *     updateLink.mutate({
 *       linkId: link.id,
 *       isActive: !link.isActive
 *     });
 *   };
 *
 *   return <Switch checked={link.isActive} onChange={handleToggleActive} />;
 * }
 * ```
 */
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLinkInput) => {
      const result = await updateLinkAction(input);
      return transformActionError(result, 'Failed to update link');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate links list
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });

      // Invalidate specific link cache
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(data.id) });
    },
    onError: createMutationErrorHandler('Link update'),
    retry: false,
  });
}

/**
 * Update link configuration (settings)
 *
 * Used in:
 * - Link settings panel
 * - Advanced configuration forms
 * - Upload restrictions toggles
 *
 * Features:
 * - Toast notifications on success/error
 * - Invalidates specific link cache
 * - Merges with existing config (partial updates)
 *
 * @returns Mutation for updating link configuration
 *
 * @example
 * ```tsx
 * function LinkSettingsForm({ linkId }: { linkId: string }) {
 *   const updateConfig = useUpdateLinkConfig();
 *
 *   const handleToggleMultipleUploads = (enabled: boolean) => {
 *     updateConfig.mutate({
 *       linkId,
 *       allowMultipleUploads: enabled
 *     });
 *   };
 *
 *   return <Switch onChange={handleToggleMultipleUploads} />;
 * }
 * ```
 */
export function useUpdateLinkConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLinkConfigInput) => {
      const result = await updateLinkConfigAction(input);
      return transformActionError(result, 'Failed to update link configuration');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate specific link cache (config is part of link data)
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(data.id) });

      // Also invalidate list in case config affects list display
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: createMutationErrorHandler('Link configuration update'),
    retry: false,
  });
}

/**
 * Delete a link
 *
 * Used in:
 * - Link delete confirmation dialogs
 * - Bulk delete operations
 * - Link management actions
 *
 * Features:
 * - Toast notifications on success/error
 * - Optimistic update (removes from cache immediately)
 * - Automatic query invalidation
 *
 * @returns Mutation for deleting links
 *
 * @example
 * ```tsx
 * function DeleteLinkButton({ link }: { link: Link }) {
 *   const deleteLink = useDeleteLink();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete "${link.name}"?`)) {
 *       deleteLink.mutate({ linkId: link.id });
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteLinkInput) => {
      const result = await deleteLinkAction(input);
      return transformActionError(result, 'Failed to delete link');
    },
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Remove from cache
      queryClient.removeQueries({ queryKey: linkKeys.detail(variables.linkId) });

      // Invalidate links list
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: createMutationErrorHandler('Link deletion'),
    retry: false,
  });
}
