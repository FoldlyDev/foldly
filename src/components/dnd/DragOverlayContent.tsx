'use client';

import { File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drag Overlay Content Component
 *
 * Displays a preview of the item being dragged. Shows file/folder icon and name.
 * Used inside <DragOverlay> from @dnd-kit/core.
 *
 * @example
 * ```tsx
 * <DragOverlay>
 *   {activeId && (
 *     <DragOverlayContent
 *       type="file"
 *       name="document.pdf"
 *       count={3}
 *     />
 *   )}
 * </DragOverlay>
 * ```
 *
 * @param type - Type of item being dragged ('file' or 'folder')
 * @param name - Name of the item
 * @param count - Number of items being dragged (for multi-select)
 */
export interface DragOverlayContentProps {
  type: 'file' | 'folder';
  name: string;
  count?: number;
}

export function DragOverlayContent({
  type,
  name,
  count,
}: DragOverlayContentProps) {
  const Icon = type === 'file' ? File : Folder;
  const showCount = count && count > 1;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-lg',
        'min-w-[200px] max-w-[300px]'
      )}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {showCount ? `${count} items` : 'Moving...'}
        </p>
      </div>
    </div>
  );
}
