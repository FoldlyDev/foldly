'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Generic Droppable Container Component
 *
 * Wraps any component to make it a drop target. Uses @dnd-kit/core for drop functionality.
 *
 * @example
 * ```tsx
 * <DroppableContainer
 *   id={folder.id}
 *   data={{ type: 'folder', folder }}
 * >
 *   <FolderCard folder={folder} />
 * </DroppableContainer>
 * ```
 *
 * @param id - Unique identifier for the droppable container
 * @param data - Optional data payload for drop validation
 * @param children - Component(s) to make droppable
 * @param disabled - Disable drop target (default: false)
 * @param className - Additional CSS classes
 */
export interface DroppableContainerProps {
  id: string;
  data?: Record<string, unknown>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function DroppableContainer({
  id,
  data,
  children,
  disabled = false,
  className,
}: DroppableContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'transition-colors duration-200',
        isOver && !disabled && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  );
}
