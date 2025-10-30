// =============================================================================
// USE FOLDERS HOOKS - Folder Data Management
// =============================================================================
// 🎯 Folder queries and mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRootFoldersAction,
  getFolderHierarchyAction,
  createFolderAction,
  updateFolderAction,
  moveFolderAction,
  deleteFolderAction,
} from '@/lib/actions';
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  DeleteFolderInput,
  GetFolderHierarchyInput,
} from '@/lib/validation';
import { transformActionError, transformQueryResult, createMutationErrorHandler } from '@/lib/utils/react-query-helpers';
import { folderKeys, fileKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get all root folders for the authenticated user's workspace
 *
 * Used in:
 * - Workspace dashboard (display folder tree)
 * - Folder selector components
 * - Navigation breadcrumbs
 *
 * @returns Query with array of root folders or empty array
 *
 * @example
 * ```tsx
 * function FoldersView() {
 *   const { data: folders, isLoading, error } = useRootFolders();
 *
 *   if (isLoading) return <FoldersSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return <div>{folders?.map(folder => <FolderCard key={folder.id} folder={folder} />)}</div>;
 * }
 * ```
 */
export function useRootFolders() {
  return useQuery({
    queryKey: folderKeys.lists(),
    queryFn: async () => {
      const result = await getRootFoldersAction();
      return transformQueryResult(result, 'Failed to fetch folders', []);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - folders don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for quick navigation
  });
}

/**
 * Get folder hierarchy (breadcrumb path)
 *
 * Used in:
 * - Breadcrumb navigation
 * - Folder detail pages
 * - File browser header
 *
 * @param folderId - The folder UUID to get hierarchy for
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if folderId exists)
 * @returns Query with array of folders from root to current
 *
 * @example
 * ```tsx
 * function FolderBreadcrumb({ folderId }: { folderId: string }) {
 *   const { data: hierarchy, isLoading } = useFolderHierarchy(folderId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <nav>
 *       {hierarchy?.map(folder => (
 *         <span key={folder.id}>{folder.name} / </span>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useFolderHierarchy(
  folderId: string | undefined | null,
  options?: { enabled?: boolean }
) {
  const isEnabled = options?.enabled !== false && !!folderId;

  return useQuery({
    queryKey: folderKeys.hierarchy(folderId || 'disabled'),
    queryFn: async () => {
      if (!folderId) {
        throw new Error('Folder ID is required');
      }
      const result = await getFolderHierarchyAction({ folderId });
      return transformQueryResult(result, 'Failed to fetch folder hierarchy', []);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Create a new folder
 *
 * Used in:
 * - Folder creation modal/form
 * - Quick folder creation from workspace
 *
 * Features:
 * - Toast notifications on success/error
 * - Automatic query invalidation (refreshes folder list)
 * - Returns created folder data on success
 * - Validates nesting depth (max 20 levels)
 *
 * @returns Mutation for creating folders
 *
 * @example
 * ```tsx
 * function CreateFolderForm() {
 *   const createFolder = useCreateFolder();
 *
 *   const handleSubmit = (data: CreateFolderInput) => {
 *     createFolder.mutate(data, {
 *       onSuccess: (result) => {
 *         if (result.success) {
 *           toast.success('Folder created');
 *         }
 *       }
 *     });
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      const result = await createFolderAction(input);
      return transformActionError(result, 'Failed to create folder');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate folder lists to show new folder
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });

      // Invalidate parent folder's subfolders if applicable
      if (data.parentFolderId) {
        queryClient.invalidateQueries({
          queryKey: folderKeys.subfolders(data.parentFolderId),
        });
      }

      // Set the new folder in cache
      queryClient.setQueryData(folderKeys.detail(data.id), data);
    },
    onError: createMutationErrorHandler('Folder creation'),
    retry: false,
  });
}

/**
 * Update folder details (name)
 *
 * Used in:
 * - Folder edit form
 * - Quick rename actions
 * - Inline folder renaming
 *
 * Features:
 * - Toast notifications on success/error
 * - Invalidates both list and individual folder cache
 * - Returns updated folder data
 *
 * @returns Mutation for updating folders
 *
 * @example
 * ```tsx
 * function FolderRenameForm({ folder }: { folder: Folder }) {
 *   const updateFolder = useUpdateFolder();
 *
 *   const handleRename = (name: string) => {
 *     updateFolder.mutate({
 *       folderId: folder.id,
 *       name
 *     });
 *   };
 *
 *   return <input onBlur={e => handleRename(e.target.value)} />;
 * }
 * ```
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFolderInput) => {
      const result = await updateFolderAction(input);
      return transformActionError(result, 'Failed to update folder');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate folder lists
      queryClient.invalidateQueries({ queryKey: folderKeys.lists() });

      // Invalidate specific folder cache
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(data.id) });

      // Invalidate hierarchy for this folder
      queryClient.invalidateQueries({ queryKey: folderKeys.hierarchy(data.id) });
    },
    onError: createMutationErrorHandler('Folder update'),
    retry: false,
  });
}

/**
 * Move a folder to a new parent
 *
 * Used in:
 * - Drag-and-drop folder organization
 * - Move folder modal/form
 * - Folder context menu "Move to..."
 *
 * Features:
 * - Toast notifications on success/error
 * - Prevents circular references
 * - Validates nesting depth (max 20 levels)
 * - Invalidates related caches
 *
 * @returns Mutation for moving folders
 *
 * @example
 * ```tsx
 * function MoveFolder({ folder }: { folder: Folder }) {
 *   const moveFolder = useMoveFolder();
 *
 *   const handleMove = (newParentId: string | null) => {
 *     moveFolder.mutate({
 *       folderId: folder.id,
 *       newParentId
 *     });
 *   };
 *
 *   return <FolderPicker onSelect={handleMove} />;
 * }
 * ```
 */
export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MoveFolderInput) => {
      const result = await moveFolderAction(input);
      return transformActionError(result, 'Failed to move folder');
    },
    onSuccess: (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate all folder lists (structure changed)
      queryClient.invalidateQueries({ queryKey: folderKeys.all });

      // Invalidate files in this folder (parentFolderId references may need update)
      queryClient.invalidateQueries({ queryKey: fileKeys.folder(data.id) });
    },
    onError: createMutationErrorHandler('Folder move'),
    retry: false,
  });
}

/**
 * Delete a folder
 *
 * Used in:
 * - Folder context menu
 * - Folder delete confirmation modal
 * - Bulk folder deletion
 *
 * Features:
 * - Toast notifications on success/error
 * - Cascade deletes subfolders (handled by database)
 * - Sets files' parent_folder_id to NULL (preserves files)
 * - Automatic query invalidation
 *
 * @returns Mutation for deleting folders
 *
 * @example
 * ```tsx
 * function DeleteFolderButton({ folderId }: { folderId: string }) {
 *   const deleteFolder = useDeleteFolder();
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete folder?')) {
 *       deleteFolder.mutate({ folderId });
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete}>Delete</Button>;
 * }
 * ```
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteFolderInput) => {
      const result = await deleteFolderAction(input);
      return transformActionError(result, 'Failed to delete folder');
    },
    onSuccess: () => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate all folder queries (structure changed)
      queryClient.invalidateQueries({ queryKey: folderKeys.all });

      // Invalidate file lists (files may have been orphaned)
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
    onError: createMutationErrorHandler('Folder deletion'),
    retry: false,
  });
}
