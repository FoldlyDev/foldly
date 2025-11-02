"use client";

import { MoreVertical, Eye, Download, Trash2 } from "lucide-react";
import type { File } from "@/lib/database/schemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/animateui/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";

interface FileContextMenuProps {
  file: File;
  onPreview?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

/**
 * File context menu
 * Provides actions: Preview, Download, Delete
 *
 * @example
 * ```tsx
 * <FileContextMenu
 *   file={file}
 *   onPreview={() => previewModal.open(file)}
 *   onDelete={() => deleteModal.open({ fileId: file.id })}
 * />
 * ```
 */
export function FileContextMenu({
  file,
  onPreview,
  onDownload,
  onDelete,
}: FileContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${file.filename}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onPreview && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="mr-2 size-4" />
            Preview
          </DropdownMenuItem>
        )}
        {onDownload && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Download className="mr-2 size-4" />
            Download
          </DropdownMenuItem>
        )}
        {(onPreview || onDownload) && onDelete && <DropdownMenuSeparator />}
        {onDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
