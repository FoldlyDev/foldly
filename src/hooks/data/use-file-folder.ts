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
    onSuccess: async () => {
      // TODO: Add success notification when notification system is implemented

      // Invalidate both files and folders (structure changed)
      // Use broad invalidation for consistency
      await invalidateFiles(queryClient);
      await invalidateFolders(queryClient);
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
