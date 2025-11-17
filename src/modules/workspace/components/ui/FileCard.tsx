"use client";

import type { File } from "@/lib/database/schemas";
import { cn } from "@/lib/utils";
import { FileThumbnail } from "./FileThumbnail";
import { UploaderBadge } from "./UploaderBadge";
import { FileContextMenu } from "./FileContextMenu";

interface FileCardProps {
  file: File;
  onPreview?: () => void;
  onDownload?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
}

/**
 * Compact file card component for grid display
 * Horizontal layout: thumbnail (left) → title (middle) → menu (right)
 * Flows left-to-right in grid layout for maximum space efficiency
 *
 * @example
 * ```tsx
 * <FileCard
 *   file={file}
 *   onPreview={() => previewModal.open(file)}
 *   onDelete={() => deleteModal.open({ fileId: file.id })}
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
}: FileCardProps) {
  const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border p-2 transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary"
          : "border-border bg-card hover:border-primary/50",
        onPreview && "cursor-pointer"
      )}
      onClick={(e) => {
        // Don't preview if clicking checkbox or context menu
        if ((e.target as HTMLElement).closest('input, button')) return;
        onPreview?.();
      }}
      aria-labelledby={`file-${file.id}`}
    >
      {/* Selection checkbox - left of thumbnail */}
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className="size-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
          aria-label={`Select ${file.filename}`}
        />
      )}

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
