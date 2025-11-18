"use client";

import { X, Download, Trash2, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";

/**
 * Selection toolbar
 * Shows selection count and bulk action buttons
 *
 * @example
 * ```tsx
 * <SelectionToolbar
 *   selectedCount={5}
 *   onClear={handleClear}
 *   onDownload={handleDownload}
 *   onDelete={handleDelete}
 * />
 * ```
 */
interface SelectionToolbarProps {
  /**
   * Number of selected items
   */
  selectedCount: number;

  /**
   * Callback to clear selection
   */
  onClear: () => void;

  /**
   * Callback to download selected files
   */
  onDownload?: () => void;

  /**
   * Callback to move selected items
   */
  onMove?: () => void;

  /**
   * Callback to delete selected items
   */
  onDelete?: () => void;

  /**
   * Whether selection includes folders
   */
  hasFolders?: boolean;

  /**
   * Whether selection includes files
   */
  hasFiles?: boolean;
}

export function SelectionToolbar({
  selectedCount,
  onClear,
  onDownload,
  onMove,
  onDelete,
  hasFolders = false,
  hasFiles = false,
}: SelectionToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-4 rounded-lg border bg-background px-6 py-3 shadow-lg">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="Clear selection"
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Download (files and/or folders) */}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="size-4" />
              Download
            </Button>
          )}

          {/* Move */}
          {onMove && (
            <Button variant="outline" size="sm" onClick={onMove} className="gap-2">
              <FolderInput className="size-4" />
              Move
            </Button>
          )}

          {/* Delete */}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
