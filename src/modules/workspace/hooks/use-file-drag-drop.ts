import type { DragEndEvent } from '@dnd-kit/core';
import { useMoveFile } from '@/hooks/data/use-files';
import { toast } from 'sonner';

/**
 * File Drag-and-Drop Hook
 *
 * Handles drag-and-drop operations for files in the workspace.
 * Integrates with existing useMoveFile mutation hook.
 *
 * @example
 * ```tsx
 * const { handleFileDragEnd } = useFileDragDrop();
 *
 * <DndContext onDragEnd={handleFileDragEnd}>
 *   <FileCard file={file} />
 * </DndContext>
 * ```
 */
export function useFileDragDrop() {
  const moveMutation = useMoveFile();

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

    // Execute move mutation
    // Don't pass callbacks to mutateAsync - let the mutation's onSuccess/onError handle it
    // This ensures cache invalidation happens properly
    try {
      await moveMutation.mutateAsync({
        fileId,
        newParentId: targetFolderId,
      });
      // Success - show toast (cache already invalidated by mutation)
      toast.success(
        `Moved to ${targetFolderId ? overData?.folder?.name : 'Root'}`
      );
    } catch (error) {
      // Error already handled by mutation's onError, just show toast
      toast.error((error as Error).message || 'Failed to move file');
    }
  };

  return {
    handleFileDragEnd,
    isMoving: moveMutation.isPending,
  };
}
