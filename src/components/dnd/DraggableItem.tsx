'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';

/**
 * Generic Draggable Item Component
 *
 * Wraps any component to make it draggable. Uses @dnd-kit/core for drag functionality.
 *
 * @example
 * ```tsx
 * <DraggableItem
 *   id={file.id}
 *   data={{ type: 'file', file }}
 * >
 *   <FileCard file={file} />
 * </DraggableItem>
 * ```
 *
 * @param id - Unique identifier for the draggable item
 * @param data - Optional data payload attached to drag event
 * @param children - Component(s) to make draggable
 * @param disabled - Disable dragging (default: false)
 */
export interface DraggableItemProps {
  id: string;
  data?: Record<string, unknown>;
  children: ReactNode;
  disabled?: boolean;
}

export function DraggableItem({
  id,
  data,
  children,
  disabled = false,
}: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data,
      disabled,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
