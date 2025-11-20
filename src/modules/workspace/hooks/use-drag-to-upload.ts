import { useState, useCallback, useRef } from 'react';
import { useUppyUpload } from '@/hooks/utility/use-uppy-upload';
import { useCreateFileRecord } from '@/hooks/data/use-files';
import { toast } from 'sonner';
import { isFileSizeValid } from '@/lib/utils/file-helpers';
import { VALIDATION_LIMITS } from '@/lib/constants/validation';

/**
 * Drag-to-Upload Hook Options
 */
export interface UseDragToUploadOptions {
  /** Current folder ID (where files will be uploaded) */
  currentFolderId: string | null;
  /** Workspace ID for upload path */
  workspaceId: string;
  /** Callback when upload starts (optional) */
  onUploadStart?: () => void;
  /** Callback when upload succeeds (optional) */
  onUploadSuccess?: (filename: string) => void;
  /** Callback when upload fails (optional) */
  onUploadError?: (filename: string, error: string) => void;
}

/**
 * Drag-to-Upload Hook
 *
 * Enables users to drag files from their OS file explorer directly onto the workspace
 * to upload them to the current folder.
 *
 * Features:
 * - Detects OS file drag (dragover/drop events)
 * - Validates file size (max 100MB per file)
 * - Sequential upload with progress feedback
 * - Automatic duplicate detection (via initiateUploadAction)
 * - Toast notifications for success/error
 *
 * @example
 * ```tsx
 * const { handleDragOver, handleDrop, isDragging } = useDragToUpload({
 *   currentFolderId: folderId,
 *   workspaceId: workspace.id,
 * });
 *
 * <div
 *   onDragOver={handleDragOver}
 *   onDrop={handleDrop}
 *   className={isDragging ? 'drag-active' : ''}
 * >
 *   Workspace content
 * </div>
 * ```
 */
export function useDragToUpload(options: UseDragToUploadOptions) {
  const {
    currentFolderId,
    workspaceId,
    onUploadStart,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const dragCounter = useRef(0); // Track nested drag events to prevent flickering

  // Upload infrastructure
  const uppyUpload = useUppyUpload({
    bucket: process.env.NEXT_PUBLIC_SUPABASE_UPLOADS_BUCKET_NAME || 'foldly-uploads',
    authMode: 'authenticated',
  });
  const createFileRecord = useCreateFileRecord();

  /**
   * Handle dragenter event - Detect when files enter the drop zone
   * CRITICAL: Must preventDefault() to enable drop event
   */
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current++;

    // Only show drag state if files are being dragged (not dnd-kit items)
    const hasFiles = event.dataTransfer.types.includes('Files');
    if (hasFiles && dragCounter.current === 1) {
      setIsDragging(true);
    }
  }, []);

  /**
   * Handle dragover event - Required to enable drop
   * CRITICAL: Must preventDefault() on every dragover event
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    // Set dropEffect to 'copy' to show the correct cursor
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  /**
   * Handle dragleave event - Hide overlay when leaving drop zone
   * Uses counter to prevent flickering when dragging over child elements
   */
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    dragCounter.current--;

    // Only hide when completely leaving the drop zone (counter reaches 0)
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  /**
   * Handle drop event - Upload files
   */
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Reset drag state and counter
      dragCounter.current = 0;
      setIsDragging(false);

      // Extract files from drop event
      const { files } = event.dataTransfer;
      if (!files || files.length === 0) {
        return;
      }

      const fileArray = Array.from(files);

      // Check for folders/directories (not supported yet)
      const folders = fileArray.filter((file) => {
        // Folders typically have empty type and zero/small size
        // This is a heuristic - not 100% accurate but catches most cases
        return file.type === '' && file.size === 0;
      });

      if (folders.length > 0) {
        setHasError(true);
        toast.error('Folder uploads are not supported. Please upload individual files.');

        // Clear error after 3 seconds
        setTimeout(() => {
          setHasError(false);
        }, 3000);

        return;
      }

      // Validate all files first
      const maxSize = VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES;
      const invalidFiles = fileArray.filter((file) => !isFileSizeValid(file, maxSize));

      if (invalidFiles.length > 0) {
        const maxSizeMB = maxSize / (1024 * 1024);
        toast.error(
          `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} exceed the ${maxSizeMB}MB size limit`
        );
        return;
      }

      // Start upload
      setIsUploading(true);
      onUploadStart?.();

      const uploadPath = `uploads/${workspaceId}/${currentFolderId || 'root'}`;
      let successCount = 0;
      let errorCount = 0;

      // Upload files sequentially (easier error handling)
      for (const file of fileArray) {
        try {
          // 1. Upload to storage (returns unique filename after duplicate detection)
          const uploadResult = await uppyUpload.upload(file, {
            path: uploadPath,
            parentFolderId: currentFolderId,
          });

          // 2. Create database record (use unique filename from upload)
          await createFileRecord.mutateAsync({
            filename: uploadResult.uniqueFileName,
            storagePath: uploadResult.storagePath,
            mimeType: file.type || 'application/octet-stream',
            fileSize: file.size,
            parentFolderId: currentFolderId,
            uploaderEmail: null, // Owner upload (not external user)
            uploaderName: null,
          });

          successCount++;
          onUploadSuccess?.(file.name);
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          errorCount++;
          onUploadError?.(file.name, (error as Error).message || 'Upload failed');
        }
      }

      setIsUploading(false);

      // Show result toast
      if (successCount > 0) {
        toast.success(
          `Uploaded ${successCount} file${successCount > 1 ? 's' : ''} successfully`
        );
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}`
        );
      }
    },
    [
      currentFolderId,
      workspaceId,
      uppyUpload,
      createFileRecord,
      onUploadStart,
      onUploadSuccess,
      onUploadError,
    ]
  );

  return {
    isDragging,
    isUploading,
    hasError,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
