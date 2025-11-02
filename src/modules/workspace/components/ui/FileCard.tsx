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
  onDelete?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
  showCheckbox?: boolean;
}

/**
 * File card component for grid display
 * Shows thumbnail, filename, metadata, and actions
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
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: FileCardProps) {
  const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      className={cn(
        "relative flex h-64 flex-col overflow-hidden rounded-lg border transition-all hover:shadow-md",
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
      {/* Selection checkbox */}
      {showCheckbox && (
        <div className="absolute left-2 top-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label={`Select ${file.filename}`}
          />
        </div>
      )}

      {/* Context menu */}
      <div className="absolute right-2 top-2 z-10">
        <FileContextMenu
          file={file}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      </div>

      {/* File thumbnail */}
      <div className="relative h-40 overflow-hidden bg-muted">
        <FileThumbnail file={file} />
      </div>

      {/* File metadata */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div className="space-y-1">
          <h3
            id={`file-${file.id}`}
            className="line-clamp-2 text-sm font-medium leading-tight"
            title={file.filename}
          >
            {file.filename}
          </h3>
          <p className="text-xs text-muted-foreground">
            {fileSizeMB} MB • {uploadDate}
          </p>
        </div>

        {/* Uploader badge */}
        {file.uploaderEmail && (
          <div className="mt-2">
            <UploaderBadge email={file.uploaderEmail} name={file.uploaderName} />
          </div>
        )}
      </div>
    </article>
  );
}
