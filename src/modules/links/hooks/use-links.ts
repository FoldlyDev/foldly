// =============================================================================
// USE LINKS HOOKS - Link Management Hooks
// =============================================================================
// 🎯 React Query hooks for link operations
// Wraps link actions with React Query for state management

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching onboarding pattern)

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getUserLinksAction,
  getLinkByIdAction,
  createLinkAction,
  updateLinkAction,
  updateLinkConfigAction,
  deleteLinkAction,
  checkSlugAvailabilityAction,
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
  getLinkPermissionsAction,
} from '@/lib/actions';
import type {
  CreateLinkInput,
  UpdateLinkInput,
  UpdateLinkConfigInput,
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from '../lib/validation/link-schemas';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const linkKeys = {
  all: ['links'] as const,
  lists: () => [...linkKeys.all, 'list'] as const,
  list: (filters: string) => [...linkKeys.lists(), { filters }] as const,
  details: () => [...linkKeys.all, 'detail'] as const,
  detail: (id: string) => [...linkKeys.details(), id] as const,
  permissions: (linkId: string) => [...linkKeys.detail(linkId), 'permissions'] as const,
};

// =============================================================================
// 1. GET USER LINKS
// =============================================================================

/**
 * Hook to fetch all links for the authenticated user's workspace
 *
 * @returns Query with user's links
 *
 * @example
 * ```typescript
 * const { data: links, isLoading } = useUserLinks();
 * ```
 */
export function useUserLinks() {
  return useQuery({
    queryKey: linkKeys.lists(),
    queryFn: async () => {
      const result = await getUserLinksAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch links');
      }
      return result.data || [];
    },
    staleTime: 60000, // 1 minute - links don't change frequently
  });
}

// =============================================================================
// 2. GET LINK BY ID
// =============================================================================

/**
 * Hook to fetch a single link by ID with permissions
 *
 * @param linkId - Link ID
 * @param options - Query options
 * @returns Query with link data
 *
 * @example
 * ```typescript
 * const { data: link, isLoading } = useLinkById('link_123');
 * ```
 */
export function useLinkById(linkId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: linkKeys.detail(linkId || ''),
    queryFn: async () => {
      if (!linkId) throw new Error('Link ID is required');

      const result = await getLinkByIdAction({ linkId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch link');
      }
      return result.data;
    },
    enabled: !!linkId && (options?.enabled ?? true),
    staleTime: 60000, // 1 minute - link details don't change frequently
  });
}

// =============================================================================
// 3. CREATE LINK
// =============================================================================

/**
 * Hook to create a new link
 *
 * Features:
 * - Validates slug availability
 * - Creates owner permission automatically
 * - Invalidates links list on success
 *
 * @returns Mutation to create link
 *
 * @example
 * ```typescript
 * const { mutate: createLink, isPending } = useCreateLink();
 *
 * createLink({
 *   name: 'Tax Documents 2024',
 *   slug: 'tax-docs-2024',
 *   isPublic: false
 * });
 * ```
 */
export function useCreateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLinkInput) => {
      const result = await createLinkAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to create link');
        // Attach metadata for components to access (e.g., rate limit info)
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return result.data!;
    },
    retry: false, // Never retry mutations
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate links list to refetch
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      // Error is now accessible via mutation.error in components
      console.error('Link creation failed:', error.message);
    },
  });
}

// =============================================================================
// 4. UPDATE LINK
// =============================================================================

/**
 * Hook to update link details
 *
 * Features:
 * - Validates slug availability if slug is changing
 * - Invalidates link queries on success
 *
 * @returns Mutation to update link
 *
 * @example
 * ```typescript
 * const { mutate: updateLink, isPending } = useUpdateLink();
 *
 * updateLink({
 *   linkId: 'link_123',
 *   name: 'Updated Name',
 *   isActive: false
 * });
 * ```
 */
export function useUpdateLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLinkInput) => {
      const result = await updateLinkAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to update link');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return result.data!;
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate specific link and list
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Link update failed:', error.message);
    },
  });
}

// =============================================================================
// 5. UPDATE LINK CONFIGURATION
// =============================================================================

/**
 * Hook to update link configuration settings
 *
 * Features:
 * - Updates link config (notifyOnUpload, customMessage, requiresName)
 * - Invalidates link queries on success
 *
 * @returns Mutation to update link config
 *
 * @example
 * ```typescript
 * const { mutate: updateConfig, isPending } = useUpdateLinkConfig();
 *
 * updateConfig({
 *   linkId: 'link_123',
 *   config: {
 *     notifyOnUpload: true,
 *     customMessage: 'Please upload your documents here'
 *   }
 * });
 * ```
 */
export function useUpdateLinkConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLinkConfigInput) => {
      const result = await updateLinkConfigAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to update link config');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return result.data!;
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate specific link and list
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Link config update failed:', error.message);
    },
  });
}

// =============================================================================
// 6. DELETE LINK
// =============================================================================

/**
 * Hook to delete a link
 *
 * Features:
 * - Deletes link and its permissions
 * - Preserves files/folders (sets link_id to NULL)
 * - Invalidates queries on success
 *
 * @returns Mutation to delete link
 *
 * @example
 * ```typescript
 * const { mutate: deleteLink, isPending } = useDeleteLink();
 *
 * deleteLink('link_123');
 * ```
 */
export function useDeleteLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const result = await deleteLinkAction({ linkId });

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to delete link');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return { linkId };
    },
    retry: false, // Never retry mutations
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(data.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.lists() });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Link deletion failed:', error.message);
    },
  });
}

// =============================================================================
// 7. CHECK SLUG AVAILABILITY
// =============================================================================

/**
 * Hook to check if a slug is available
 * Useful for real-time validation in forms
 *
 * @param slug - Slug to check
 * @param options - Query options
 * @returns Query with availability status
 *
 * @example
 * ```typescript
 * const { data: isAvailable, isLoading } = useCheckSlugAvailability('my-slug');
 * ```
 */
export function useCheckSlugAvailability(
  slug: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...linkKeys.all, 'slug-check', slug] as const,
    queryFn: async () => {
      if (!slug) return null;

      const result = await checkSlugAvailabilityAction({ slug });
      if (!result.success) {
        return null;
      }
      return result.data;
    },
    enabled: !!slug && (options?.enabled ?? true),
    // Disable retries for availability checks
    retry: false,
    // Cache for 30 seconds
    staleTime: 30000,
  });
}

// =============================================================================
// 8. GET LINK PERMISSIONS
// =============================================================================

/**
 * Hook to fetch all permissions for a link
 *
 * @param linkId - Link ID
 * @param options - Query options
 * @returns Query with permissions list
 *
 * @example
 * ```typescript
 * const { data: permissions, isLoading } = useGetLinkPermissions('link_123');
 * ```
 */
export function useGetLinkPermissions(
  linkId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: linkKeys.permissions(linkId || ''),
    queryFn: async () => {
      if (!linkId) throw new Error('Link ID is required');

      const result = await getLinkPermissionsAction({ linkId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch permissions');
      }
      return result.data || [];
    },
    enabled: !!linkId && (options?.enabled ?? true),
    staleTime: 60000, // 1 minute - permissions don't change frequently
  });
}

// =============================================================================
// 9. ADD PERMISSION
// =============================================================================

/**
 * Hook to add a permission to a link
 *
 * Features:
 * - Validates email format
 * - Prevents duplicate permissions
 * - Invalidates permissions query on success
 *
 * @returns Mutation to add permission
 *
 * @example
 * ```typescript
 * const { mutate: addPermission, isPending } = useAddPermission();
 *
 * addPermission({
 *   linkId: 'link_123',
 *   email: 'collaborator@example.com',
 *   role: 'editor'
 * });
 * ```
 */
export function useAddPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPermissionInput) => {
      const result = await addPermissionAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to add permission');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return result.data!;
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: linkKeys.permissions(variables.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Add permission failed:', error.message);
    },
  });
}

// =============================================================================
// 10. REMOVE PERMISSION
// =============================================================================

/**
 * Hook to remove a permission from a link
 *
 * Features:
 * - Prevents removing owner permissions
 * - Invalidates permissions query on success
 *
 * @returns Mutation to remove permission
 *
 * @example
 * ```typescript
 * const { mutate: removePermission, isPending } = useRemovePermission();
 *
 * removePermission({
 *   linkId: 'link_123',
 *   email: 'collaborator@example.com'
 * });
 * ```
 */
export function useRemovePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemovePermissionInput) => {
      const result = await removePermissionAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to remove permission');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return data; // Return input for onSuccess
    },
    retry: false, // Never retry mutations
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: linkKeys.permissions(data.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(data.linkId) });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Remove permission failed:', error.message);
    },
  });
}

// =============================================================================
// 11. UPDATE PERMISSION
// =============================================================================

/**
 * Hook to update a permission role
 *
 * Features:
 * - Prevents modifying owner permissions
 * - Invalidates permissions query on success
 *
 * @returns Mutation to update permission
 *
 * @example
 * ```typescript
 * const { mutate: updatePermission, isPending } = useUpdatePermission();
 *
 * updatePermission({
 *   linkId: 'link_123',
 *   email: 'collaborator@example.com',
 *   role: 'viewer'
 * });
 * ```
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePermissionInput) => {
      const result = await updatePermissionAction(data);

      // Transform server error response into React Query error
      if (!result.success) {
        const error = new Error(result.error || 'Failed to update permission');
        (error as any).blocked = result.blocked;
        (error as any).resetAt = result.resetAt;
        throw error;
      }

      return result.data!;
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: linkKeys.permissions(variables.linkId) });
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
    },
    onError: (error: Error) => {
      // TODO: Add error notification when notification system is implemented
      console.error('Update permission failed:', error.message);
    },
  });
}
