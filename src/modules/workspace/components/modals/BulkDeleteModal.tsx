"use client";

import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/animateui/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { AlertTriangle, File as FileIcon, Folder as FolderIcon, Link as LinkIcon, Info } from "lucide-react";
import type { File, Folder } from "@/lib/database/schemas";

/**
 * Bulk delete confirmation modal
 * Confirmation modal for bulk deletion of files and folders
 *
 * Features:
 * - Shows count and list of items to be deleted
 * - Special warning for folders (cascade deletes all contents)
 * - Warning for linked folders (links will become inactive)
 * - "and X more" pattern for >5 items
 *
 * @example
 * ```tsx
 * <BulkDeleteModal
 *   isOpen={bulkDeleteModal.isOpen}
 *   onOpenChange={bulkDeleteModal.close}
 *   data={{
 *     files: [file1, file2],
 *     folders: [folder1, folder2]
 *   }}
 *   onConfirm={handleBulkDelete}
 * />
 * ```
 */

interface BulkDeleteModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: { files: File[]; folders: Folder[] } | null;
  onConfirm: () => Promise<void> | void;
}

export function BulkDeleteModal({
  isOpen,
  onOpenChange,
  data,
  onConfirm,
}: BulkDeleteModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const files = data?.files ?? [];
  const folders = data?.folders ?? [];
  const totalCount = files.length + folders.length;

  // Check if any folders are linked (have linkId)
  const linkedFolders = folders.filter(f => f.linkId !== null);
  const hasLinkedFolders = linkedFolders.length > 0;

  // Check if we have any folders (which cascade delete)
  const hasFolders = folders.length > 0;

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // TODO: Add error notification when notification system is implemented
      // toast.error("Failed to delete items");
      console.error("Failed to delete items");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  // Show first 5 items, then "and X more"
  const MAX_VISIBLE_ITEMS = 5;
  const visibleItems = [...files, ...folders].slice(0, MAX_VISIBLE_ITEMS);
  const remainingCount = totalCount - MAX_VISIBLE_ITEMS;

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Delete {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </ModalTitle>
          <ModalDescription>
            Are you sure you want to delete {files.length > 0 && `${files.length} ${files.length === 1 ? 'file' : 'files'}`}
            {files.length > 0 && folders.length > 0 && ' and '}
            {folders.length > 0 && `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`}?
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-3">
          {/* Item list */}
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/50 p-2">
            {visibleItems.map((item) => {
              const isFile = 'filename' in item;
              const isLinkedFolder = !isFile && item.linkId !== null;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm"
                >
                  {isFile ? (
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {isFile ? item.filename : item.name}
                  </span>
                  {isLinkedFolder && (
                    <LinkIcon className="size-3 shrink-0 text-amber-600 dark:text-amber-500" aria-label="Shared folder" />
                  )}
                </div>
              );
            })}
            {remainingCount > 0 && (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                and {remainingCount} more...
              </div>
            )}
          </div>

          {/* Warning messages */}
          <div className="space-y-2">
            {/* Warning for linked folders (amber - same as unlink modal) */}
            {hasLinkedFolders && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {linkedFolders.length} shareable {linkedFolders.length === 1 ? 'link' : 'links'} will become inactive
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {linkedFolders.length === 1 ? 'The link' : 'These links'} will be preserved and can be reactivated later by linking to another folder.
                  </p>
                </div>
              </div>
            )}

            {/* Warning for folder cascade deletion (destructive red) */}
            {hasFolders && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    Folders and all contents will be permanently deleted
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All subfolders and files inside will be CASCADE deleted from storage and database.
                  </p>
                </div>
              </div>
            )}

            {/* Cannot be undone warning */}
            <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <ModalFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : `Delete ${totalCount} ${totalCount === 1 ? 'item' : 'items'}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
