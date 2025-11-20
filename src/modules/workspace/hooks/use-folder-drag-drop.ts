import type { DragEndEvent } from '@dnd-kit/core';
import { useMoveFolder } from '@/hooks/data/use-folders';
import { useMoveMixed } from '@/hooks/data/use-file-folder';
import { toast } from 'sonner';
import type { UseFileSelectionReturn } from './use-file-selection';
import type { UseFolderSelectionReturn } from './use-folder-selection';

/**
 * Folder Drag-and-Drop Hook Options
 */
export interface UseFolderDragDropOptions {
  /** File selection state for multi-select drag */
  fileSelection: UseFileSelectionReturn;
  /** Folder selection state for multi-select drag */
  folderSelection: UseFolderSelectionReturn;
  /** Callback after successful multi-select move (to clear selections) */
  onMultiMoveSuccess?: () => void;
}

/**
 * Folder Drag-and-Drop Hook
 *
 * Handles drag-and-drop operations for folders in the workspace.
 * Supports both single folder drag and multi-select drag.
 * Validates circular references and nesting depth automatically via server action.
 *
 * Multi-select behavior:
 * - If dragging a selected folder → moves ALL selected files + folders
 * - If dragging an unselected folder → moves only that folder (single drag)
 *
 * @example
 * ```tsx
 * const { handleFolderDragEnd } = useFolderDragDrop({
 *   fileSelection,
 *   folderSelection,
 *   onMultiMoveSuccess: () => {
 *     fileSelection.clearSelection();
 *     folderSelection.clearSelection();
 *   },
 * });
 *
 * <DndContext onDragEnd={handleFolderDragEnd}>
 *   <FolderCard folder={folder} />
 * </DndContext>
 * ```
 */
export function useFolderDragDrop(options: UseFolderDragDropOptions) {
  const moveMutation = useMoveFolder();
  const moveMixedMutation = useMoveMixed();

  const handleFolderDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    // No drop target or dropped on self - do nothing
    if (!over || active.id === over.id) {
      return;
    }

    // Extract drag data
    const activeData = active.data.current;
    const overData = over.data.current;

    // Validate: must be dragging a folder
    if (activeData?.type !== 'folder') {
      return;
    }

    // Validate: must drop onto a folder or root
    if (overData?.type !== 'folder' && over.id !== 'root') {
      toast.error('Folders can only be moved into other folders');
      return;
    }

    const folderId = active.id as string;
    const targetParentFolderId = over.id === 'root' ? null : (over.id as string);
    const targetName = targetParentFolderId ? overData?.folder?.name : 'Root';

    // Check if dragging a selected folder (multi-select drag)
    const isDraggingSelected = options.folderSelection.isFolderSelected(folderId);
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
          targetFolderId: targetParentFolderId,
        });

        // Success toast with count
        toast.success(`Moved ${totalCount} item${totalCount > 1 ? 's' : ''} to ${targetName}`);
      } catch (error) {
        // Error already handled by mutation's onError
        // Server handles circular reference and depth validation
        toast.error((error as Error).message || 'Failed to move items');
      }
    } else {
      // Single folder drag (existing behavior)
      try {
        await moveMutation.mutateAsync({
          folderId,
          newParentId: targetParentFolderId,
        });
        // Success - show toast (cache already invalidated by mutation)
        toast.success(`Moved to ${targetName}`);
      } catch (error) {
        // Error already handled by mutation's onError
        // Server handles circular reference and depth validation
        toast.error((error as Error).message || 'Failed to move folder');
      }
    }
  };

  return {
    handleFolderDragEnd,
    isMoving: moveMutation.isPending || moveMixedMutation.isPending,
  };
}
