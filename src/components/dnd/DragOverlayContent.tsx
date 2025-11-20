'use client';

import { File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drag Overlay Content Component
 *
 * Displays a preview of items being dragged with visual stack effect for multi-select.
 * Supports both single and multi-item drag with count badges.
 * Used inside <DragOverlay> from @dnd-kit/core.
 *
 * Visual Design:
 * - Single item: Shows the item card with name and icon
 * - Multi-select: Shows 3 stacked cards with count badge and breakdown
 *
 * @example
 * ```tsx
 * // Single item drag
 * <DragOverlay>
 *   {activeId && (
 *     <DragOverlayContent
 *       type="file"
 *       name="document.pdf"
 *     />
 *   )}
 * </DragOverlay>
 *
 * // Multi-select drag (shows stack effect)
 * <DragOverlay>
 *   {activeId && (
 *     <DragOverlayContent
 *       type="file"
 *       name="document.pdf"
 *       totalCount={5}
 *       fileCount={3}
 *       folderCount={2}
 *     />
 *   )}
 * </DragOverlay>
 * ```
 *
 * @param type - Type of primary item being dragged ('file' or 'folder')
 * @param name - Name of the primary item
 * @param totalCount - Total number of items being dragged (for multi-select)
 * @param fileCount - Number of files in multi-select drag
 * @param folderCount - Number of folders in multi-select drag
 */
export interface DragOverlayContentProps {
  type: 'file' | 'folder';
  name: string;
  totalCount?: number;
  fileCount?: number;
  folderCount?: number;
}

export function DragOverlayContent({
  type,
  name,
  totalCount = 1,
  fileCount = 0,
  folderCount = 0,
}: DragOverlayContentProps) {
  const Icon = type === 'file' ? File : Folder;
  const isMultiSelect = totalCount > 1;

  // Build count message for multi-select
  let countMessage = 'Moving...';
  if (isMultiSelect) {
    const parts: string[] = [];
    if (fileCount > 0) {
      parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
    }
    if (folderCount > 0) {
      parts.push(`${folderCount} folder${folderCount > 1 ? 's' : ''}`);
    }
    countMessage = parts.join(' + ') || `${totalCount} items`;
  }

  // Single item drag - simple card
  if (!isMultiSelect) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-xl',
          'min-w-[200px] max-w-[300px]',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">Moving...</p>
        </div>
      </div>
    );
  }

  // Multi-select drag - stacked cards with count badge
  return (
    <div className="relative">
      {/* Stack effect - background cards (2 cards behind the main one) with staggered fade-in */}
      <div
        className={cn(
          'absolute left-2 top-2 h-full w-full rounded-lg border border-border bg-card',
          'min-w-[200px] max-w-[300px]',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        style={{ opacity: 0.4, animationDelay: '0ms' }}
      />
      <div
        className={cn(
          'absolute left-1 top-1 h-full w-full rounded-lg border border-border bg-card',
          'min-w-[200px] max-w-[300px]',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        style={{ opacity: 0.7, animationDelay: '50ms' }}
      />

      {/* Main card with content */}
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-lg border-2 border-primary bg-card p-4 shadow-xl',
          'min-w-[200px] max-w-[300px]',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
        style={{ animationDelay: '100ms' }}
      >
        {/* Count badge - top-right corner with delayed pop-in */}
        <div
          className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md animate-in zoom-in-0 duration-200"
          style={{ animationDelay: '150ms' }}
        >
          {totalCount}
        </div>

        {/* Icon */}
        <Icon className="h-5 w-5 shrink-0 text-primary" />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{totalCount} items selected</p>
          <p className="text-xs font-medium text-muted-foreground">{countMessage}</p>
        </div>
      </div>
    </div>
  );
}
