// =============================================================================
// USE FILES HOOKS - File Data Management
// =============================================================================
// 🎯 File queries and mutations with React Query
// Following three-layer architecture: Component → Hook → Action → Query

'use client';

// TODO: Add proper user feedback when notification system is implemented
// Currently using inline error handling only (matching existing hook pattern)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspaceFilesAction,
  getFilesByEmailAction,
  searchFilesAction,
  createFileRecordAction,
  updateFileMetadataAction,
  deleteFileAction,
  bulkDeleteFilesAction,
  getFileSignedUrlAction,
} from '@/lib/actions';
import type {
  CreateFileInput,
  UpdateFileMetadataInput,
  DeleteFileInput,
  BulkDeleteFilesInput,
} from '@/lib/validation';
import {
  transformActionError,
  transformQueryResult,
  createMutationErrorHandler,
  invalidateFiles,
  invalidateFolders
} from '@/lib/utils/react-query-helpers';
import { fileKeys } from '@/lib/config/query-keys';

// =============================================================================
// QUERY HOOKS (Data Fetching)
// =============================================================================

/**
 * Get all files for the authenticated user's workspace
 *
 * Used in:
 * - Workspace file grid view
 * - File browser components
 * - Dashboard file overview
 *
 * @returns Query with array of files or empty array
 *
 * @example
 * ```tsx
 * function FilesView() {
 *   const { data: files, isLoading, error } = useWorkspaceFiles();
 *
 *   if (isLoading) return <FilesSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return <div>{files?.map(file => <FileCard key={file.id} file={file} />)}</div>;
 * }
 * ```
 */
export function useWorkspaceFiles() {
  return useQuery({
    queryKey: fileKeys.lists(),
    queryFn: async () => {
      const result = await getWorkspaceFilesAction();
      return transformQueryResult(result, 'Failed to fetch files', []);
    },
    staleTime: 1 * 60 * 1000, // 1 minute - files change more frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get files filtered by uploader email
 * Core feature for email-centric file collection
 *
 * Used in:
 * - "By Email" dashboard view
 * - Email filter dropdown
 * - Client file collections
 *
 * @param uploaderEmail - Email address to filter by
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if email exists)
 * @returns Query with array of files or empty array
 *
 * @example
 * ```tsx
 * function FilesByEmailView({ email }: { email: string }) {
 *   const { data: files, isLoading } = useFilesByEmail(email);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       <h2>Files from {email}</h2>
 *       {files?.map(file => <FileCard key={file.id} file={file} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFilesByEmail(
  uploaderEmail: string | undefined | null,
  options?: { enabled?: boolean }
) {
  const isEnabled = options?.enabled !== false && !!uploaderEmail;

  return useQuery({
    queryKey: fileKeys.byEmail(uploaderEmail || 'disabled'),
    queryFn: async () => {
      if (!uploaderEmail) {
        throw new Error('Uploader email is required');
      }
      const result = await getFilesByEmailAction({ uploaderEmail });
      return transformQueryResult(result, 'Failed to fetch files', []);
    },
    enabled: isEnabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Search files by filename or uploader email
 * Cross-folder search with fuzzy matching
 *
 * Used in:
 * - Global file search bar
 * - Search results page
 * - Quick file finder
 *
 * @param query - Search query string
 * @param options - Optional configuration
 * @param options.enabled - Whether to run the query (default: true if query exists)
 * @returns Query with array of matching files or empty array
 *
 * @example
 * ```tsx
 * function FileSearch() {
 *   const [query, setQuery] = useState('');
 *   const { data: results, isLoading } = useSearchFiles(query, {
 *     enabled: query.length >= 2
 *   });
 *
 *   return (
 *     <div>
 *       <input value={query} onChange={e => setQuery(e.target.value)} />
 *       {isLoading && <Spinner />}
 *       {results?.map(file => <FileCard key={file.id} file={file} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearchFiles(
  query: string | undefined | null,
  options?: { enabled?: boolean }
) {
  const isEnabled = options?.enabled !== false && !!query;

  return useQuery({
    queryKey: fileKeys.search(query || 'disabled'),
    queryFn: async () => {
      if (!query) {
        throw new Error('Search query is required');
      }
      const result = await searchFilesAction({ query });
      return transformQueryResult(result, 'Failed to search files', []);
    },
    enabled: isEnabled,
    staleTime: 30 * 1000, // 30 seconds - search results can change
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get signed URL for file preview/download
 * Returns temporary URL for accessing files in private storage
 *
 * Used in:
 * - FileThumbnail (image previews)
 * - FilePreviewModal (full file display)
 * - File download functionality
 *
 * Features:
 * - URLs expire after 24 hours
 * - Automatic ownership verification
 * - Only fetches when enabled (optimize for non-images)
 *
 * @param fileId - UUID of the file to access
 * @param options - Optional configuration
 * @param options.enabled - Whether to fetch URL (default: true)
 * @returns Query with signed URL or undefined
 *
 * @example
 * ```tsx
 * function ImageThumbnail({ file }: { file: File }) {
 *   const isImage = file.mimeType.startsWith('image/');
 *   const { data: signedUrl, isLoading } = useFileSignedUrl(file.id, {
 *     enabled: isImage
 *   });
 *
 *   if (!isImage) return <FileIcon />;
 *   if (isLoading) return <Skeleton />;
 *   if (signedUrl) return <img src={signedUrl} alt={file.filename} />;
 *   return <FileIcon />;
 * }
 * ```
 */
export function useFileSignedUrl(
  fileId: string,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: fileKeys.signedUrl(fileId),
    queryFn: async () => {
      const result = await getFileSignedUrlAction({ fileId });
      return transformQueryResult(result, 'Failed to generate file URL', undefined);
    },
    enabled: enabled && !!fileId,
    staleTime: 20 * 60 * 1000, // 20 minutes - URL valid for 24h, refresh periodically
    gcTime: 25 * 60 * 1000, // 25 minutes
  });
}

// =============================================================================
// MUTATION HOOKS (Data Modifications)
// =============================================================================

/**
 * Create a file record after storage upload
 * Called after successful file upload to storage
 *
 * Used in:
 * - File upload flows
 * - useUppyUpload hook (verify step)
 * - Drag-and-drop upload handlers
 *
 * Features:
 * - Toast notifications on success/error
 * - Automatic query invalidation (refreshes file lists)
 * - Returns created file record
 *
 * @returns Mutation for creating file records
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const createFileRecord = useCreateFileRecord();
 *
 *   const handleUploadComplete = (uploadData) => {
 *     createFileRecord.mutate({
 *       filename: uploadData.name,
 *       fileSize: uploadData.size,
 *       mimeType: uploadData.type,
 *       storagePath: uploadData.path,
 *       parentFolderId: currentFolderId
 *     });
 *   };
 *
 *   return <UploadZone onComplete={handleUploadComplete} />;
 * }
 * ```
 */
export function useCreateFileRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFileInput) => {
      const result = await createFileRecordAction(input);
      return transformActionError(result, 'Failed to create file record');
    },
    onSuccess: async (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate file caches to show new file
      await invalidateFiles(queryClient, data.id, data.parentFolderId || undefined);

      // Set the new file in cache
      queryClient.setQueryData(fileKeys.detail(data.id), data);
    },
    onError: createMutationErrorHandler('File record creation'),
    retry: false,
  });
}

/**
 * Update file metadata (filename, uploader info)
 *
 * Used in:
 * - File rename actions
 * - Edit uploader information
 * - Update file descriptions
 *
 * Features:
 * - Toast notifications on success/error
 * - Invalidates file caches
 * - Returns updated file data
 *
 * @returns Mutation for updating file metadata
 *
 * @example
 * ```tsx
 * function FileRenameForm({ file }: { file: File }) {
 *   const updateFile = useUpdateFileMetadata();
 *
 *   const handleRename = (filename: string) => {
 *     updateFile.mutate({
 *       fileId: file.id,
 *       filename
 *     });
 *   };
 *
 *   return <input onBlur={e => handleRename(e.target.value)} />;
 * }
 * ```
 */
export function useUpdateFileMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFileMetadataInput) => {
      const result = await updateFileMetadataAction(input);
      return transformActionError(result, 'Failed to update file');
    },
    onSuccess: async (data) => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate file caches
      await invalidateFiles(queryClient, data.id, data.parentFolderId || undefined);
    },
    onError: createMutationErrorHandler('File update'),
    retry: false,
  });
}

/**
 * Delete a file (both record and storage)
 *
 * Used in:
 * - File context menu
 * - File delete confirmation modal
 * - File manager bulk actions
 *
 * Features:
 * - Toast notifications on success/error
 * - Deletes from storage first (safety)
 * - Only removes DB record if storage delete succeeds
 * - Automatic query invalidation
 *
 * @returns Mutation for deleting files
 *
 * @example
 * ```tsx
 * function DeleteFileButton({ fileId }: { fileId: string }) {
 *   const deleteFile = useDeleteFile();
 *
 *   const handleDelete = () => {
 *     if (confirm('Delete file?')) {
 *       deleteFile.mutate({ fileId });
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete}>Delete</Button>;
 * }
 * ```
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteFileInput) => {
      const result = await deleteFileAction(input);
      return transformActionError(result, 'Failed to delete file');
    },
    onSuccess: async () => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate all file caches
      await invalidateFiles(queryClient);

      // Invalidate folder caches (file counts may have changed)
      await invalidateFolders(queryClient);
    },
    onError: createMutationErrorHandler('File deletion'),
    retry: false,
  });
}

/**
 * Bulk delete files
 *
 * Used in:
 * - Multi-select file deletion
 * - Bulk file operations
 * - Cleanup actions
 *
 * Features:
 * - Toast notifications on success/error
 * - Partial success handling (reports count of deleted files)
 * - Deletes from storage first (safety)
 * - Only removes DB records for successfully deleted files
 *
 * @returns Mutation for bulk deleting files
 *
 * @example
 * ```tsx
 * function FileManager() {
 *   const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
 *   const bulkDelete = useBulkDeleteFiles();
 *
 *   const handleBulkDelete = () => {
 *     bulkDelete.mutate(
 *       { fileIds: selectedFiles },
 *       {
 *         onSuccess: (result) => {
 *           toast.success(`Deleted ${result.deletedCount} files`);
 *           setSelectedFiles([]);
 *         }
 *       }
 *     );
 *   };
 *
 *   return <Button onClick={handleBulkDelete}>Delete Selected</Button>;
 * }
 * ```
 */
export function useBulkDeleteFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkDeleteFilesInput) => {
      const result = await bulkDeleteFilesAction(input);
      return transformActionError(result, 'Failed to delete files');
    },
    onSuccess: async () => {
      // TODO: Add success notification when notification system is implemented
      // Invalidate all file caches
      await invalidateFiles(queryClient);

      // Invalidate folder caches (file counts may have changed)
      await invalidateFolders(queryClient);
    },
    onError: createMutationErrorHandler('Bulk file deletion'),
    retry: false,
  });
}
