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
  getWorkspaceFoldersAction,
  getFoldersByParentAction,
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
} from '@/lib/validation';
import {
  transformActionError,
  transformQueryResult,
  createMutationErrorHandler,
  invalidateFolders
} from '@/lib/utils/react-query-helpers';
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
 * Get ALL folders in the workspace (all nesting levels)
 * Used for folder count computations that require the full folder tree
 *
 * Used in:
 * - Workspace dashboard (computeFolderCounts to count subfolders)
 * - Any component that needs complete folder hierarchy data
 *
 * @returns Query with array of ALL workspace folders or empty array
 *
 * @example
 * ```tsx
 * function WorkspaceView() {
 *   const { data: files } = useWorkspaceFiles();
 *   const { data: allFolders } = useWorkspaceFolders();
 *
 *   const folderCounts = useMemo(
 *     () => computeFolderCounts(files, allFolders),
 *     [files, allFolders]
 *   );
 *
 *   return <FolderGrid folders={folders} counts={folderCounts} />;
 * }
 * ```
 */
export function useWorkspaceFolders() {
  return useQuery({
    queryKey: folderKeys.all,
    queryFn: async () => {
      const result = await getWorkspaceFoldersAction();
      return transformQueryResult(result, 'Failed to fetch workspace folders', []);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - folders don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for quick navigation
  });
}

/**
 * Get folders by parent (root or child folders)
 * Universal hook for folder navigation
 *
 * Used in:
 * - Workspace folder grid with folder navigation
 * - Folder browser with current folder context
 *
 * @param parentFolderId - Parent folder ID (null for root folders)
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true)
 * @returns Query with array of folders at the specified location
 *
 * @example
 * ```tsx
 * function FoldersView({ currentFolderId }: { currentFolderId: string | null }) {
 *   const { data: folders, isLoading } = useFoldersByParent(currentFolderId);
 *
 *   if (isLoading) return <FoldersSkeleton />;
 *
 *   return <div>{folders?.map(folder => <FolderCard key={folder.id} folder={folder} />)}</div>;
 * }
 * ```
 */
export function useFoldersByParent(
  parentFolderId: string | null,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: folderKeys.byParent(parentFolderId),
    queryFn: async () => {
      console.log('[useFoldersByParent] Fetching folders for parent:', parentFolderId);
      const result = await getFoldersByParentAction({ parentFolderId });
      const folders = transformQueryResult(result, 'Failed to fetch folders', []);
      console.log('[useFoldersByParent] Fetched folders:', { parentFolderId, count: folders.length });
      return folders;
    },
    enabled,
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    placeholderData: (previousData) => previousData, // Keep previous breadcrumb while loading
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
    onSuccess: async (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate folder caches to show new folder
      await invalidateFolders(queryClient, data.id);

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
    onSuccess: async (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate folder caches (lists, detail, hierarchy)
      await invalidateFolders(queryClient, data.id);
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
    // Capture old parent ID before mutation executes
    onMutate: async (variables) => {
      console.log('[useMoveFolder] Starting mutation, capturing old parent ID', { folderId: variables.folderId });

      // Find the folder in the current cache to get its old parent ID
      const queries = queryClient.getQueriesData({ queryKey: folderKeys.all });

      let oldParentId: string | null = null;
      for (const [, data] of queries) {
        if (Array.isArray(data)) {
          const folder = data.find((f: any) => f.id === variables.folderId);
          if (folder) {
            oldParentId = folder.parentFolderId;
            console.log('[useMoveFolder] Found old parent ID in cache', { oldParentId });
            break;
          }
        }
      }

      return { oldParentId };
    },
    onSuccess: async (data, variables, context) => {
      // TODO: Add success notification when notification system is implemented
      const newParentId = variables.newParentId;
      const oldParentId = context?.oldParentId;

      console.log('[useMoveFolder] Move successful, starting targeted cache invalidation', {
        movedFolder: data,
        oldParentId,
        newParentId
      });

      // Targeted invalidation - ONLY affected parent folders (not entire folder tree)
      try {
        await Promise.all([
          // Invalidate source parent folder (where folder was moved FROM)
          oldParentId !== undefined &&
            queryClient.invalidateQueries({
              queryKey: folderKeys.byParent(oldParentId),
            }).then(() => console.log('[useMoveFolder] Invalidated source parent', { oldParentId })),

          // Invalidate destination parent folder (where folder was moved TO)
          queryClient.invalidateQueries({
            queryKey: folderKeys.byParent(newParentId),
          }).then(() => console.log('[useMoveFolder] Invalidated destination parent', { newParentId })),

          // Invalidate workspace folders query (needed for folder count computation)
          queryClient.invalidateQueries({
            queryKey: folderKeys.all,
            exact: true, // Only invalidate ['folders'], not children like byParent
          }).then(() => console.log('[useMoveFolder] Invalidated workspace folders query')),

          // Invalidate file queries (folder counts may have changed)
          queryClient.invalidateQueries({
            queryKey: fileKeys.all,
            exact: true,
          }).then(() => console.log('[useMoveFolder] Invalidated file queries')),
        ].filter(Boolean));
        console.log('[useMoveFolder] Targeted cache invalidation complete');
      } catch (error) {
        console.error('[useMoveFolder] Cache invalidation error:', error);
      }
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
    onSuccess: async () => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate folders and files (structure changed, files may have been orphaned)
      await invalidateFolders(queryClient, undefined, { invalidateFiles: true });
    },
    onError: createMutationErrorHandler('Folder deletion'),
    retry: false,
  });
}
