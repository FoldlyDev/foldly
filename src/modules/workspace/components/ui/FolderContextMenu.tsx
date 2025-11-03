"use client";

import { MoreVertical, Edit, Move, Trash2, Share2, Link as LinkIcon, Copy, Eye, Settings, Unlink } from "lucide-react";
import type { Folder } from "@/lib/database/schemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/animateui/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";
import { useRouter } from "next/navigation";

interface FolderContextMenuProps {
  folder: Folder;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  // Folder-link actions (personal folder)
  onShareFolder?: () => void;
  onLinkToExisting?: () => void;
  // Folder-link actions (linked folder)
  onCopyLinkUrl?: () => void;
  onViewLinkDetails?: () => void;
  onUnlinkFolder?: () => void;
}

/**
 * Folder context menu
 * Provides actions: Rename, Move, Delete, Share, Link, Unlink, View Link
 *
 * @example
 * ```tsx
 * <FolderContextMenu
 *   folder={folder}
 *   onRename={() => renameModal.open(folder)}
 *   onDelete={() => deleteModal.open(folder)}
 *   onShareFolder={() => shareModal.open(folder)}
 *   onCopyLinkUrl={() => handleCopyLinkUrl(folder)}
 *   onViewLinkDetails={() => viewLinkModal.open(folder)}
 * />
 * ```
 */
export function FolderContextMenu({
  folder,
  onRename,
  onMove,
  onDelete,
  onShareFolder,
  onLinkToExisting,
  onCopyLinkUrl,
  onViewLinkDetails,
  onUnlinkFolder,
}: FolderContextMenuProps) {
  const router = useRouter();

  const handleManageLink = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!folder.linkId) return;
    router.push(`/dashboard/links?id=${folder.linkId}`);
  };

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
        {/* Basic folder actions (always available) */}
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

        {/* Personal Folder Actions (linkId IS NULL) */}
        {!folder.linkId && (onShareFolder || onLinkToExisting) && (
          <>
            {(onRename || onMove) && <DropdownMenuSeparator />}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <LinkIcon className="mr-2 size-4" />
                Link Folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {onShareFolder && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareFolder();
                    }}
                  >
                    <Share2 className="mr-2 size-4" />
                    Create New Link
                  </DropdownMenuItem>
                )}
                {onLinkToExisting && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onLinkToExisting();
                    }}
                  >
                    <LinkIcon className="mr-2 size-4" />
                    Link to Existing
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* Linked Folder Actions (linkId IS NOT NULL) */}
        {folder.linkId && (
          <>
            {(onRename || onMove) && <DropdownMenuSeparator />}
            {onCopyLinkUrl && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyLinkUrl();
                }}
              >
                <Copy className="mr-2 size-4" />
                Copy Link
              </DropdownMenuItem>
            )}
            {onViewLinkDetails && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onViewLinkDetails();
                }}
              >
                <Eye className="mr-2 size-4" />
                View Link
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleManageLink}>
              <Settings className="mr-2 size-4" />
              Manage Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onUnlinkFolder && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlinkFolder();
                }}
                className="text-amber-600 dark:text-amber-500 focus:text-amber-700 dark:focus:text-amber-400"
              >
                <Unlink className="mr-2 size-4" />
                Unlink Folder
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* Delete action (always at bottom) */}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
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
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
