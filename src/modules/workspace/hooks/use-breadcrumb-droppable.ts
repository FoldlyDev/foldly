import { useDroppable } from '@dnd-kit/core';

/**
 * Breadcrumb Droppable Hook
 *
 * Makes a breadcrumb segment a drop target for files and folders.
 * Reuses the existing drag-drop infrastructure from FolderCard.
 *
 * Drop behavior is handled by existing handlers in UserWorkspace:
 * - `handleFileDragEnd()` - For file drops
 * - `handleFolderDragEnd()` - For folder drops
 *
 * @param folderId - Folder ID (null for root)
 * @returns Drop state and ref to apply to breadcrumb segment
 *
 * @example
 * ```tsx
 * const { setNodeRef, isOver } = useBreadcrumbDroppable(folderId);
 *
 * <Button
 *   ref={setNodeRef}
 *   className={isOver ? "ring-2 ring-primary/50 ring-offset-2" : ""}
 * >
 *   {folderName}
 * </Button>
 * ```
 */
export function useBreadcrumbDroppable(folderId: string | null) {
  const { setNodeRef, isOver } = useDroppable({
    id: folderId ?? 'root',
    data: {
      type: 'folder',
      folder: folderId ? { id: folderId } : null,
    },
  });

  return {
    setNodeRef,
    isOver,
  };
}
