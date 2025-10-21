// =============================================================================
// USE PERMISSIONS HOOKS - Permission Management
// =============================================================================
// 🎯 Permission queries and mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLinkPermissionsAction,
  addPermissionAction,
  removePermissionAction,
  updatePermissionAction,
} from '@/lib/actions';
import type {
  AddPermissionInput,
  RemovePermissionInput,
  UpdatePermissionInput,
} from '@/modules/links/lib/validation/link-schemas';
import { transformActionError, transformQueryResult, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { linkKeys, permissionKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get all permissions for a specific link
 *
 * Used in:
 * - Links module (permission management UI)
 * - Workspace module (view who has access to folder's link)
 *
 * @param linkId - The link UUID to fetch permissions for
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if linkId exists)
 * @returns Query with array of permissions or empty array
 *
 * @example
 * ```tsx
 * function PermissionsList({ linkId }: { linkId: string }) {
 *   const { data: permissions, isLoading } = useLinkPermissions(linkId);
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       {permissions?.map(p => (
 *         <PermissionRow key={p.id} permission={p} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useLinkPermissions(
  linkId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: linkId ? permissionKeys.byLink(linkId) : ['permissions', 'disabled'],
    queryFn: async () => {
      const result = await getLinkPermissionsAction({ linkId: linkId! });
      return transformQueryResult(result, 'Failed to fetch permissions', []);
    },
    enabled: !!linkId && (options?.enabled ?? true),
    staleTime: 60 * 1000, // 1 minute - permissions don't change frequently
  });
}

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Add a permission to a link
 *
 * Used in:
 * - Links module (full permission management)
 * - Workspace module (quick add permission from folder view)
 *
 * Features:
 * - Validates email format (server-side)
 * - Prevents duplicate permissions (server-side)
 * - Automatic query invalidation (refreshes permission list)
 * - Rate limited (10 requests/minute)
 *
 * @returns Mutation for adding permissions
 *
 * @example
 * ```tsx
 * function AddPermissionForm({ linkId }: { linkId: string }) {
 *   const addPermission = useAddPermission();
 *
 *   const handleSubmit = (email: string, role: 'viewer' | 'editor') => {
 *     addPermission.mutate({ linkId, email, role });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useAddPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPermissionInput) => {
      const result = await addPermissionAction(data);
      return transformActionError(result, 'Failed to add permission');
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: permissionKeys.byLink(variables.linkId) });

      // Also invalidate link details in case they include permission count
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
    },
    onError: createMutationErrorHandler('Permission addition'),
  });
}

/**
 * Remove a permission from a link
 *
 * Used in:
 * - Links module (permission management UI)
 * - Workspace module (remove access from folder's link)
 *
 * Features:
 * - Prevents removing owner permissions (server-side validation)
 * - Automatic query invalidation
 * - Rate limited (10 requests/minute)
 *
 * @returns Mutation for removing permissions
 *
 * @example
 * ```tsx
 * function PermissionRow({ permission, linkId }: Props) {
 *   const removePermission = useRemovePermission();
 *
 *   const handleRemove = () => {
 *     if (confirm(`Remove access for ${permission.email}?`)) {
 *       removePermission.mutate({ linkId, email: permission.email });
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {permission.email}
 *       <button onClick={handleRemove}>Remove</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRemovePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RemovePermissionInput) => {
      const result = await removePermissionAction(data);
      transformActionError(result, 'Failed to remove permission');
      // No return - action returns void
    },
    retry: false, // Never retry mutations
    onSuccess: (_, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: permissionKeys.byLink(variables.linkId) });

      // Also invalidate link details
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
    },
    onError: createMutationErrorHandler('Permission removal'),
  });
}

/**
 * Update a permission role
 *
 * Used in:
 * - Links module (change viewer to editor or vice versa)
 *
 * Features:
 * - Prevents modifying owner permissions (server-side validation)
 * - Automatic query invalidation
 * - Rate limited (10 requests/minute)
 *
 * @returns Mutation for updating permissions
 *
 * @example
 * ```tsx
 * function PermissionRoleSelect({ permission, linkId }: Props) {
 *   const updatePermission = useUpdatePermission();
 *
 *   const handleRoleChange = (newRole: 'viewer' | 'editor') => {
 *     updatePermission.mutate({
 *       linkId,
 *       email: permission.email,
 *       role: newRole
 *     });
 *   };
 *
 *   return (
 *     <select value={permission.role} onChange={e => handleRoleChange(e.target.value)}>
 *       <option value="viewer">Viewer</option>
 *       <option value="editor">Editor</option>
 *     </select>
 *   );
 * }
 * ```
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePermissionInput) => {
      const result = await updatePermissionAction(data);
      return transformActionError(result, 'Failed to update permission');
    },
    retry: false, // Never retry mutations
    onSuccess: (data, variables) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate permissions for this link
      queryClient.invalidateQueries({ queryKey: permissionKeys.byLink(variables.linkId) });

      // Also invalidate link details
      queryClient.invalidateQueries({ queryKey: linkKeys.detail(variables.linkId) });
    },
    onError: createMutationErrorHandler('Permission update'),
  });
}
