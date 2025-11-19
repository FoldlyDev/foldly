import type { DragEndEvent } from '@dnd-kit/core';
import { useMoveFolder } from '@/hooks/data/use-folders';
import { toast } from 'sonner';

/**
 * Folder Drag-and-Drop Hook
 *
 * Handles drag-and-drop operations for folders in the workspace.
 * Integrates with existing useMoveFolder mutation hook.
 * Validates circular references and nesting depth automatically via server action.
 *
 * @example
 * ```tsx
 * const { handleFolderDragEnd } = useFolderDragDrop();
 *
 * <DndContext onDragEnd={handleFolderDragEnd}>
 *   <FolderCard folder={folder} />
 * </DndContext>
 * ```
 */
export function useFolderDragDrop() {
  const moveMutation = useMoveFolder();

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

    // Execute move mutation
    // Don't pass callbacks to mutateAsync - let the mutation's onSuccess/onError handle it
    // This ensures cache invalidation happens properly
    try {
      await moveMutation.mutateAsync({
        folderId,
        newParentId: targetParentFolderId,
      });
      // Success - show toast (cache already invalidated by mutation)
      toast.success(
        `Moved to ${targetParentFolderId ? overData?.folder?.name : 'Root'}`
      );
    } catch (error) {
      // Error already handled by mutation's onError
      // Server handles circular reference and depth validation
      toast.error((error as Error).message || 'Failed to move folder');
    }
  };

  return {
    handleFolderDragEnd,
    isMoving: moveMutation.isPending,
  };
}
