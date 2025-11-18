"use client";

import { Folder as FolderIcon, Link as LinkIcon, Users } from "lucide-react";
import type { Folder } from "@/lib/database/schemas";
import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";
import { useResponsiveDetection, useInteractionHandlers } from "@/hooks";
import { FolderContextMenu } from "./FolderContextMenu";

interface FolderCardProps {
  folder: Folder;
  onNavigate?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
  fileCount?: number;
  uploaderCount?: number;
  // Folder-link actions (personal folder)
  onShareFolder?: () => void;
  onLinkToExisting?: () => void;
  // Folder-link actions (linked folder)
  onCopyLinkUrl?: () => void;
  onViewLinkDetails?: () => void;
  onUnlinkFolder?: () => void;
  /** Callback to enable selection mode */
  enableSelectMode?: () => void;
  /** Whether selection mode is currently active */
  isSelectMode?: boolean;
}

/**
 * Folder card component
 * Displays folder with link badge and people count
 *
 * Platform-specific interactions:
 * - Desktop: Single-click selects, double-click navigates
 * - Mobile: Tap navigates (default), long-press enters selection mode
 *
 * @example
 * ```tsx
 * <FolderCard
 *   folder={folder}
 *   onNavigate={() => navigateToFolder(folder.id)}
 *   fileCount={15}
 *   uploaderCount={3}
 *   enableSelectMode={folderSelection.enableSelectMode}
 *   isSelectMode={folderSelection.isSelectMode}
 * />
 * ```
 */
export function FolderCard({
  folder,
  onNavigate,
  onRename,
  onMove,
  onDelete,
  onDownload,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  fileCount = 0,
  uploaderCount = 0,
  onShareFolder,
  onLinkToExisting,
  onCopyLinkUrl,
  onViewLinkDetails,
  onUnlinkFolder,
  enableSelectMode,
  isSelectMode = false,
}: FolderCardProps) {
  const isLinkedFolder = !!folder.linkId;

  // Platform detection
  const { isMobile } = useResponsiveDetection();

  // Interaction handlers
  const handlers = useInteractionHandlers({
    onSingleClick: () => {
      // Desktop: Single-click enters selection mode + selects
      // Mobile: Only select if already in selection mode
      if (isMobile && !isSelectMode) return; // On mobile, tap navigates (handled by mobile click logic)

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
      // Desktop: Double-click navigates
      if (!isMobile) {
        onNavigate?.();
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

  // Click handler for current onClick behavior (mobile tap to navigate)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't handle if clicking checkbox or context menu
    if ((e.target as HTMLElement).closest('input, button')) return;

    // Mobile: Tap navigates (if not in selection mode)
    if (isMobile && !isSelectMode) {
      onNavigate?.();
    }
  };

  return (
    <article
      className={cn(
        "relative flex h-28 flex-col justify-between overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        (onNavigate || isSelectMode) && "cursor-pointer"
      )}
      onClick={isMobile ? handleCardClick : handlers.handleClick}
      onDoubleClick={!isMobile ? handlers.handleDoubleClick : undefined}
      onTouchStart={isMobile ? handlers.handleLongPress.onTouchStart : undefined}
      onTouchEnd={isMobile ? handlers.handleLongPress.onTouchEnd : undefined}
      onTouchCancel={isMobile ? handlers.handleLongPress.onTouchCancel : undefined}
      aria-labelledby={`folder-${folder.id}`}
    >
      {/* Selection checkbox */}
      {showCheckbox && (
        <div className="absolute left-2 top-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label={`Select ${folder.name}`}
          />
        </div>
      )}

      {/* Context menu */}
      <div className="absolute right-2 top-2 z-10">
        <FolderContextMenu
          folder={folder}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
          onDownload={onDownload}
          onShareFolder={onShareFolder}
          onLinkToExisting={onLinkToExisting}
          onCopyLinkUrl={onCopyLinkUrl}
          onViewLinkDetails={onViewLinkDetails}
          onUnlinkFolder={onUnlinkFolder}
        />
      </div>

      {/* Folder content */}
      <div className="flex flex-col items-start justify-center gap-3">

        <div className="flex items-center gap-3">
          {/* Folder icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FolderIcon className="size-6 text-primary" />
        </div>

        {/* Badges, folder name, and file count (vertically stacked) */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {isLinkedFolder && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <LinkIcon className="size-3" />
                Shared
              </Badge>
            )}
            {uploaderCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="size-3" />
                {uploaderCount}
              </Badge>
            )}
          </div>

          {/* Folder name */}
          <h3
            id={`folder-${folder.id}`}
            className="line-clamp-2 text-sm font-medium leading-tight"
          >
            {folder.name}
          </h3>
        </div>
        </div>

          {/* File count */}
          <p className="text-xs text-muted-foreground">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </p>
      </div>
    </article>
  );
}
