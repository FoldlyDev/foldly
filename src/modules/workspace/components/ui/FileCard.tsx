"use client";

import * as React from "react";
import type { File } from "@/lib/database/schemas";
import { cn } from "@/lib/utils";
import { useResponsiveDetection, useInteractionHandlers } from "@/hooks";
import { FileThumbnail } from "./FileThumbnail";
import { UploaderBadge } from "./UploaderBadge";
import { FileContextMenu } from "./FileContextMenu";
import { useDraggable } from '@dnd-kit/core';
import { useDndState } from '@/hooks';

interface FileCardProps {
  file: File;
  onPreview?: () => void;
  onDownload?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
  /** Callback to enable selection mode */
  enableSelectMode?: () => void;
  /** Whether selection mode is currently active */
  isSelectMode?: boolean;
}

/**
 * Compact file card component for grid display
 * Horizontal layout: thumbnail (left) → title (middle) → menu (right)
 * Flows left-to-right in grid layout for maximum space efficiency
 *
 * Platform-specific interactions:
 * - Desktop: Single-click selects, double-click opens preview
 * - Mobile: Tap opens preview (default), long-press enters selection mode
 *
 * @example
 * ```tsx
 * <FileCard
 *   file={file}
 *   onPreview={() => previewModal.open(file)}
 *   onDelete={() => deleteModal.open({ fileId: file.id })}
 *   enableSelectMode={fileSelection.enableSelectMode}
 *   isSelectMode={fileSelection.isSelectMode}
 * />
 * ```
 */
export function FileCard({
  file,
  onPreview,
  onDownload,
  onMove,
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  enableSelectMode,
  isSelectMode = false,
}: FileCardProps) {
  const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Platform detection
  const { isMobile } = useResponsiveDetection();

  // Interaction handlers
  const handlers = useInteractionHandlers({
    onSingleClick: () => {
      // Desktop: Single-click enters selection mode + selects
      // Mobile: Only select if already in selection mode
      if (isMobile && !isSelectMode) return; // On mobile, tap opens (handled by onDoubleClick logic)

      if (!isMobile) {
        // Desktop: Enter selection mode on first click
        if (!isSelectMode && enableSelectMode) {
          enableSelectMode();
        }
        onSelect?.();
      } else if (isSelectMode) {
        // Mobile in selection mode: tap toggles selection
        onSelect?.();
      }
    },
    onDoubleClick: () => {
      // Desktop: Double-click opens preview
      if (!isMobile) {
        onPreview?.();
      }
    },
    onLongPress: () => {
      // Mobile: Long-press enters selection mode + selects
      if (isMobile && !isSelectMode) {
        if (enableSelectMode) {
          enableSelectMode();
        }
        onSelect?.();
      }
    },
  });

  // Click handler for current onClick behavior (mobile tap to open)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't handle if clicking checkbox or context menu
    if ((e.target as HTMLElement).closest('input, button')) return;

    // Mobile: Tap opens preview (if not in selection mode)
    if (isMobile && !isSelectMode) {
      onPreview?.();
    }
  };

  // Drag-and-drop functionality (files are draggable but NOT droppable)
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: file.id,
    data: {
      type: 'file',
      file,
    },
    // No disabled prop - allow dragging in both normal and selection mode
  });

  // Global drag state for multi-select visual feedback (Google Drive approach)
  const { activeId } = useDndState();
  const isAnyDragging = activeId !== null;

  // Multi-select drag: Item is selected but NOT the one being actively dragged
  const isPartOfMultiDrag = !isDragging && isSelected && isAnyDragging;

  // Drag style - Google Drive approach: ALL items stay in place, only opacity changes
  const style = {
    // All selected items get reduced opacity during drag (no transform - items stay in place)
    opacity: isDragging ? 0.5 : isPartOfMultiDrag ? 0.6 : 1,
    // Smooth opacity transition for visual feedback (250ms with ease-out timing)
    transition: 'opacity 250ms ease-out',
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border p-2 hover:shadow-md select-none",
        !isDragging && "transition-all", // Disable transitions during drag
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        (onPreview || isSelectMode) && "cursor-pointer",
        !isSelectMode && !isDragging && "cursor-grab",
        isDragging && "cursor-grabbing"
      )}
      onClick={isMobile ? handleCardClick : handlers.handleClick}
      onDoubleClick={!isMobile ? handlers.handleDoubleClick : undefined}
      onTouchStart={isMobile ? handlers.handleLongPress.onTouchStart : undefined}
      onTouchEnd={isMobile ? handlers.handleLongPress.onTouchEnd : undefined}
      onTouchCancel={isMobile ? handlers.handleLongPress.onTouchCancel : undefined}
      aria-labelledby={`file-${file.id}`}
    >
      {/* Compact thumbnail - 48x48px */}
      <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
        <FileThumbnail file={file} />
      </div>

      {/* File info - flex-1 to take available space */}
      <div className="flex-1 min-w-0">
        <h3
          id={`file-${file.id}`}
          className="truncate text-sm font-medium"
          title={file.filename}
        >
          {file.filename}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{fileSizeMB} MB</span>
          <span>•</span>
          <span>{uploadDate}</span>
          {file.uploaderEmail && (
            <>
              <span>•</span>
              <span className="truncate" title={file.uploaderEmail}>
                {file.uploaderEmail}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Context menu - right side */}
      <div className="shrink-0">
        <FileContextMenu
          file={file}
          onPreview={onPreview}
          onDownload={onDownload}
          onMove={onMove}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}
