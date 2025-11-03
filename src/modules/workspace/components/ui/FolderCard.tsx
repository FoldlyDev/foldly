"use client";

import { Folder as FolderIcon, Link as LinkIcon, Users } from "lucide-react";
import type { Folder } from "@/lib/database/schemas";
import { Badge } from "@/components/ui/shadcn/badge";
import { cn } from "@/lib/utils";
import { FolderContextMenu } from "./FolderContextMenu";

interface FolderCardProps {
  folder: Folder;
  onNavigate?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
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
}

/**
 * Folder card component
 * Displays folder with link badge and people count
 *
 * @example
 * ```tsx
 * <FolderCard
 *   folder={folder}
 *   onNavigate={() => navigateToFolder(folder.id)}
 *   fileCount={15}
 *   uploaderCount={3}
 * />
 * ```
 */
export function FolderCard({
  folder,
  onNavigate,
  onRename,
  onMove,
  onDelete,
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
}: FolderCardProps) {
  const isLinkedFolder = !!folder.linkId;

  return (
    <article
      className={cn(
        "relative flex h-32 flex-col justify-between overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        onNavigate && "cursor-pointer"
      )}
      onClick={(e) => {
        // Don't navigate if clicking checkbox or context menu
        if ((e.target as HTMLElement).closest('input, button')) return;
        onNavigate?.();
      }}
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
          onShareFolder={onShareFolder}
          onLinkToExisting={onLinkToExisting}
          onCopyLinkUrl={onCopyLinkUrl}
          onViewLinkDetails={onViewLinkDetails}
          onUnlinkFolder={onUnlinkFolder}
        />
      </div>

      {/* Folder icon and badges */}
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <FolderIcon className="size-6 text-primary" />
        </div>

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
      </div>

      {/* Folder name and file count */}
      <div className="space-y-1">
        <h3
          id={`folder-${folder.id}`}
          className="line-clamp-2 text-sm font-medium leading-tight"
        >
          {folder.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </p>
      </div>
    </article>
  );
}
