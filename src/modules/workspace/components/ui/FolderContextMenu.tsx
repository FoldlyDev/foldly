"use client";

import { MoreVertical, Edit, Move, Trash2 } from "lucide-react";
import type { Folder } from "@/lib/database/schemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/animateui/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";

interface FolderContextMenuProps {
  folder: Folder;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

/**
 * Folder context menu
 * Provides actions: Rename, Move, Delete
 *
 * @example
 * ```tsx
 * <FolderContextMenu
 *   folder={folder}
 *   onRename={() => renameModal.open(folder)}
 *   onDelete={() => deleteModal.open(folder)}
 * />
 * ```
 */
export function FolderContextMenu({
  folder,
  onRename,
  onMove,
  onDelete,
}: FolderContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${folder.name}`}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onRename && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
          >
            <Edit className="mr-2 size-4" />
            Rename
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onMove();
            }}
          >
            <Move className="mr-2 size-4" />
            Move
          </DropdownMenuItem>
        )}
        {(onRename || onMove) && onDelete && <DropdownMenuSeparator />}
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
