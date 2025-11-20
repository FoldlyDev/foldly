import type { DragEndEvent } from '@dnd-kit/core';
import { useMoveFile } from '@/hooks/data/use-files';
import { useMoveMixed } from '@/hooks/data/use-file-folder';
import { toast } from 'sonner';
import type { UseFileSelectionReturn } from './use-file-selection';
import type { UseFolderSelectionReturn } from './use-folder-selection';

/**
 * File Drag-and-Drop Hook Options
 */
export interface UseFileDragDropOptions {
  /** File selection state for multi-select drag */
  fileSelection: UseFileSelectionReturn;
  /** Folder selection state for multi-select drag */
  folderSelection: UseFolderSelectionReturn;
  /** Callback after successful multi-select move (to clear selections) */
  onMultiMoveSuccess?: () => void;
}

/**
 * File Drag-and-Drop Hook
 *
 * Handles drag-and-drop operations for files in the workspace.
 * Supports both single file drag and multi-select drag.
 *
 * Multi-select behavior:
 * - If dragging a selected file → moves ALL selected files + folders
 * - If dragging an unselected file → moves only that file (single drag)
 *
 * @example
 * ```tsx
 * const { handleFileDragEnd } = useFileDragDrop({
 *   fileSelection,
 *   folderSelection,
 *   onMultiMoveSuccess: () => {
 *     fileSelection.clearSelection();
 *     folderSelection.clearSelection();
 *   },
 * });
 *
 * <DndContext onDragEnd={handleFileDragEnd}>
 *   <FileCard file={file} />
 * </DndContext>
 * ```
 */
export function useFileDragDrop(options: UseFileDragDropOptions) {
  const moveMutation = useMoveFile();
  const moveMixedMutation = useMoveMixed();

  const handleFileDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // No drop target or dropped on self - do nothing
    if (!over || active.id === over.id) {
      return;
    }

    // Extract drag data
    const activeData = active.data.current;
    const overData = over.data.current;

    // Validate: must be dragging a file
    if (activeData?.type !== 'file') {
      return;
    }

    // Validate: must drop onto a folder or root
    if (overData?.type !== 'folder' && over.id !== 'root') {
      toast.error('Files can only be moved into folders');
      return;
    }

    const fileId = active.id as string;
    const targetFolderId = over.id === 'root' ? null : (over.id as string);
    const targetName = targetFolderId ? overData?.folder?.name : 'Root';

    // Check if dragging a selected file (multi-select drag)
    const isDraggingSelected = options.fileSelection.isFileSelected(fileId);
    const hasSelection =
      options.fileSelection.selectedCount > 0 ||
      options.folderSelection.selectedCount > 0;

    if (isDraggingSelected && hasSelection) {
      // Multi-select drag: Move ALL selected files + folders
      const fileIds = Array.from(options.fileSelection.selectedFiles);
      const folderIds = Array.from(options.folderSelection.selectedFolders);
      const totalCount = fileIds.length + folderIds.length;

      // Clear selections IMMEDIATELY on drop (Google Drive behavior)
      options.onMultiMoveSuccess?.();

      try {
        await moveMixedMutation.mutateAsync({
          fileIds,
          folderIds,
          targetFolderId,
        });

        // Success toast with count
        toast.success(`Moved ${totalCount} item${totalCount > 1 ? 's' : ''} to ${targetName}`);
      } catch (error) {
        // Error already handled by mutation's onError
        toast.error((error as Error).message || 'Failed to move items');
      }
    } else {
      // Single file drag (existing behavior)
      try {
        await moveMutation.mutateAsync({
          fileId,
          newParentId: targetFolderId,
        });
        // Success - show toast (cache already invalidated by mutation)
        toast.success(`Moved to ${targetName}`);
      } catch (error) {
        // Error already handled by mutation's onError, just show toast
        toast.error((error as Error).message || 'Failed to move file');
      }
    }
  };

  return {
    handleFileDragEnd,
    isMoving: moveMutation.isPending || moveMixedMutation.isPending,
  };
}
