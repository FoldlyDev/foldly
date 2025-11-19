// =============================================================================
// USE FILE-FOLDER HOOKS - Mixed File and Folder Operations
// =============================================================================
// 🎯 React Query hooks for operations that work with both files and folders
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkDownloadMixedAction,
  moveMixedAction,
  deleteMixedAction,
} from '@/lib/actions';
import type {
  BulkDownloadMixedInput,
  MoveMixedInput,
  DeleteMixedInput,
} from '@/lib/validation';
import {
  transformActionError,
  createMutationErrorHandler,
  invalidateFiles,
  invalidateFolders,
  invalidateLinks,
} from '@/lib/utils/react-query-helpers';
import { fileKeys, folderKeys } from '@/lib/config/query-keys';

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Bulk download files and folders as a single ZIP archive (mixed selection)
 * Creates ZIP with selected files at root + selected folders with structure
 *
 * Used in:
 * - Workspace bulk download (multi-select files/folders)
 * - Selection toolbar download action
 *
 * Features:
 * - Single ZIP with mixed content
 * - Files appear at root level
 * - Folders preserve hierarchy
 * - Toast notifications on success/error
 * - No cache invalidation (read-only operation)
 *
 * ZIP Structure Example:
 * ```
 * download.zip
 * ├── file1.pdf          (selected file - root)
 * ├── file2.jpg          (selected file - root)
 * └── FolderA/           (selected folder - with structure)
 *     ├── doc.pdf
 *     └── nested/
 *         └── image.png
 * ```
 *
 * @returns Mutation for bulk downloading mixed files/folders
 *
 * @example
 * ```tsx
 * function BulkDownloadButton({ selectedFiles, selectedFolders }) {
 *   const bulkDownload = useBulkDownloadMixed();
 *
 *   const handleDownload = () => {
 *     bulkDownload.mutate(
 *       {
 *         fileIds: Array.from(selectedFiles),
 *         folderIds: Array.from(selectedFolders)
 *       },
 *       {
 *         onSuccess: (zipData) => {
 *           // Convert number array to Blob
 *           const uint8Array = new Uint8Array(zipData);
 *           const blob = new Blob([uint8Array], { type: 'application/zip' });
 *
 *           // Trigger download
 *           const link = document.createElement('a');
 *           link.href = URL.createObjectURL(blob);
 *           link.download = `download-${new Date().toISOString().split('T')[0]}.zip`;
 *           link.click();
 *           URL.revokeObjectURL(link.href);
 *         }
 *       }
 *     );
 *   };
 *
 *   return <Button onClick={handleDownload}>Download Selected</Button>;
 * }
 * ```
 */
export function useBulkDownloadMixed() {
  return useMutation({
    mutationFn: async (input: BulkDownloadMixedInput) => {
      const result = await bulkDownloadMixedAction(input);
      return transformActionError(result, 'Failed to download items');
    },
    onError: createMutationErrorHandler('Bulk download'),
    retry: false,
  });
}

/**
 * Move files and folders to a new parent folder (mixed selection)
 *
 * Used in:
 * - Workspace bulk move operations
 * - Selection toolbar move action
 * - Drag-and-drop multi-selection
 *
 * Features:
 * - Toast notifications on success/error
 * - Prevents circular references
 * - Validates name uniqueness
 * - Automatic cache invalidation for both files and folders
 *
 * @returns Mutation for moving mixed files/folders
 *
 * @example
 * ```tsx
 * function MoveSelectionButton({ selectedFiles, selectedFolders }) {
 *   const moveMixed = useMoveMixed();
 *
 *   const handleMove = (targetFolderId: string | null) => {
 *     moveMixed.mutate(
 *       {
 *         fileIds: Array.from(selectedFiles),
 *         folderIds: Array.from(selectedFolders),
 *         targetFolderId
 *       },
 *       {
 *         onSuccess: (result) => {
 *           toast.success(
 *             `Moved ${result.movedFileCount} files and ${result.movedFolderCount} folders`
 *           );
 *         }
 *       }
 *     );
 *   };
 *
 *   return <FolderPicker onSelect={handleMove} />;
 * }
 * ```
 */
export function useMoveMixed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MoveMixedInput) => {
      const result = await moveMixedAction(input);
      return transformActionError(result, 'Failed to move items');
    },
    // Capture old parent IDs before mutation executes
    onMutate: async (variables) => {
      console.log('[useMoveMixed] Starting mutation, capturing old parent IDs', {
        folderIds: variables.folderIds,
        fileIds: variables.fileIds
      });

      // Find old parent IDs for ALL folders being moved
      const queries = queryClient.getQueriesData({ queryKey: folderKeys.all });
      const folderOldParents = new Map<string, string | null>();

      for (const [, data] of queries) {
        if (Array.isArray(data)) {
          for (const folderId of variables.folderIds) {
            const folder = data.find((f: any) => f.id === folderId);
            if (folder) {
              folderOldParents.set(folderId, folder.parentFolderId);
            }
          }
        }
      }

      // Find old parent IDs for ALL files being moved
      const fileQueries = queryClient.getQueriesData({ queryKey: fileKeys.all });
      const fileOldParents = new Map<string, string | null>();

      for (const [, data] of fileQueries) {
        if (Array.isArray(data)) {
          for (const fileId of variables.fileIds) {
            const file = data.find((f: any) => f.id === fileId);
            if (file) {
              fileOldParents.set(fileId, file.parentFolderId);
            }
          }
        }
      }

      console.log('[useMoveMixed] Captured old parent IDs', {
        folderOldParents: Array.from(folderOldParents.entries()),
        fileOldParents: Array.from(fileOldParents.entries())
      });

      return { folderOldParents, fileOldParents };
    },
    onSuccess: async (data, variables, context) => {
      // TODO: Add success notification when notification system is implemented
      const targetFolderId = variables.targetFolderId;

      // Collect all unique parent IDs that were affected
      const affectedParentIds = new Set<string | null>();

      // Add source parents for folders
      if (context?.folderOldParents) {
        for (const oldParentId of context.folderOldParents.values()) {
          affectedParentIds.add(oldParentId);
        }
      }

      // Add source parents for files
      if (context?.fileOldParents) {
        for (const oldParentId of context.fileOldParents.values()) {
          affectedParentIds.add(oldParentId);
        }
      }

      // Add destination parent
      affectedParentIds.add(targetFolderId);

      console.log('[useMoveMixed] Move successful, starting targeted cache invalidation', {
        result: data,
        affectedParentIds: Array.from(affectedParentIds)
      });

      // Targeted invalidation - ONLY affected parent folders
      try {
        const invalidationPromises = [
          // Invalidate ALL affected parent folders (source + destination)
          ...Array.from(affectedParentIds).map((parentId) =>
            queryClient.invalidateQueries({
              queryKey: folderKeys.byParent(parentId),
            }).then(() => console.log('[useMoveMixed] Invalidated parent folder', { parentId }))
          ),

          // Invalidate workspace folders query (needed for folder count computation)
          queryClient.invalidateQueries({
            queryKey: folderKeys.all,
            exact: true,
          }).then(() => console.log('[useMoveMixed] Invalidated workspace folders query')),

          // Invalidate affected file folder queries
          ...Array.from(affectedParentIds).map((parentId) =>
            queryClient.invalidateQueries({
              queryKey: fileKeys.byFolder(parentId),
            }).then(() => console.log('[useMoveMixed] Invalidated file folder', { parentId }))
          ),

          // Invalidate file lists query (for file count updates)
          queryClient.invalidateQueries({
            queryKey: fileKeys.all,
            exact: true,
          }).then(() => console.log('[useMoveMixed] Invalidated file lists query')),
        ];

        await Promise.all(invalidationPromises);
        console.log('[useMoveMixed] Targeted cache invalidation complete');
      } catch (error) {
        console.error('[useMoveMixed] Cache invalidation error:', error);
      }
    },
    onError: createMutationErrorHandler('Bulk move'),
    retry: false,
  });
}

/**
 * Delete files and folders (mixed selection)
 *
 * Used in:
 * - Workspace bulk delete operations
 * - Selection toolbar delete action
 * - Context menu bulk delete
 *
 * Features:
 * - Toast notifications on success/error
 * - Storage-first deletion for files (billing integrity)
 * - DB CASCADE deletion for folders (no storage)
 * - Partial success handling (reports counts)
 * - Automatic cache invalidation for both files and folders
 *
 * @returns Mutation for deleting mixed files/folders
 *
 * @example
 * ```tsx
 * function DeleteSelectionButton({ selectedFiles, selectedFolders }) {
 *   const deleteMixed = useDeleteMixed();
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete selected items?')) {
 *       deleteMixed.mutate(
 *         {
 *           fileIds: Array.from(selectedFiles),
 *           folderIds: Array.from(selectedFolders)
 *         },
 *         {
 *           onSuccess: (result) => {
 *             toast.success(
 *               `Deleted ${result.deletedFileCount} files and ${result.deletedFolderCount} folders`
 *             );
 *           }
 *         }
 *       );
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteMixed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteMixedInput) => {
      const result = await deleteMixedAction(input);
      return transformActionError(result, 'Failed to delete items');
    },
    onSuccess: async () => {
      // TODO: Add success notification when notification system is implemented

      // Cross-module invalidation: Deleting linked folders deactivates their links
      // Invalidate files, folders, and links (optimistic update)
      await Promise.all([
        invalidateFiles(queryClient),
        invalidateFolders(queryClient, undefined, { invalidateFiles: true }),
        invalidateLinks(queryClient), // Linked folders deleted → links become inactive
      ]);
    },
    onError: createMutationErrorHandler('Bulk delete'),
    retry: false,
  });
}
