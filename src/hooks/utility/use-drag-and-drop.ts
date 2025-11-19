import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useDndState } from './use-dnd-state';

/**
 * Centralized Drag-and-Drop Event Handlers
 *
 * Provides consistent drag event handling across the application.
 * Manages global drag state and calls optional custom handlers.
 *
 * @example
 * ```tsx
 * const { handleDragStart, handleDragEnd, handleDragCancel } = useDragAndDrop({
 *   onDragEnd: (event) => {
 *     // Custom drag end logic
 *     const { active, over } = event;
 *     if (over) {
 *       moveItem(active.id, over.id);
 *     }
 *   },
 * });
 *
 * <DndContext
 *   onDragStart={handleDragStart}
 *   onDragEnd={handleDragEnd}
 *   onDragCancel={handleDragCancel}
 * >
 *   {children}
 * </DndContext>
 * ```
 */

export interface UseDragAndDropOptions {
  /** Custom handler called on drag start (after global state update) */
  onDragStart?: (event: DragStartEvent) => void;

  /** Custom handler called on drag end (before global state clear) */
  onDragEnd?: (event: DragEndEvent) => void;

  /** Custom handler called on drag cancel (before global state clear) */
  onDragCancel?: () => void;
}

export function useDragAndDrop({
  onDragStart,
  onDragEnd,
  onDragCancel,
}: UseDragAndDropOptions = {}) {
  const { setActive, clearActive } = useDndState();

  const handleDragStart = (event: DragStartEvent) => {
    const { id, data } = event.active;

    // Extract type and data from drag event
    const type = data?.current?.type as 'file' | 'folder' | undefined;
    const itemData = data?.current as Record<string, unknown> | undefined;

    if (type) {
      setActive(id as string, type, itemData);
    }

    // Call custom handler
    onDragStart?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // Call custom handler before clearing state
    onDragEnd?.(event);

    // Clear drag state
    clearActive();
  };

  const handleDragCancel = () => {
    // Call custom handler before clearing state
    onDragCancel?.();

    // Clear drag state
    clearActive();
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
