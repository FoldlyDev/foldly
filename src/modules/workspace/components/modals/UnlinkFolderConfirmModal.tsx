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

import { Unlink, Info } from "lucide-react";
import { useUnlinkFolder } from "../../hooks/use-folder-link";
import type { Folder } from "@/lib/database/schemas";

/**
 * Unlink folder confirmation modal
 * Confirmation dialog for unlinking folder from shareable link
 * Non-destructive operation (preserves both folder and link)
 *
 * @example
 * ```tsx
 * <UnlinkFolderConfirmModal
 *   folder={folder}
 *   isOpen={unlinkModal.isOpen}
 *   onOpenChange={(open) => !open && unlinkModal.close()}
 * />
 * ```
 */

interface UnlinkFolderConfirmModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnlinkFolderConfirmModal({
  folder,
  isOpen,
  onOpenChange,
}: UnlinkFolderConfirmModalProps) {
  const unlinkFolder = useUnlinkFolder();

  const handleConfirm = async () => {
    if (!folder) return;

    unlinkFolder.mutate(
      {
        folderId: folder.id,
      },
      {
        onSuccess: () => {
          // TODO: Add success notification when notification system is implemented
          // toast.success("Folder converted to personal");
          console.log("Folder converted to personal");
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    if (!unlinkFolder.isPending) {
      onOpenChange(false);
    }
  };

  if (!folder) return null;

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Unlink className="size-5" />
            Unlink Folder
          </ModalTitle>
          <ModalDescription>
            Convert "{folder.name}" back to a personal folder
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-3">
          {/* Folder name */}
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-sm font-medium">{folder.name}</p>
          </div>

          {/* Warning message */}
          <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
            <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                The shareable link will become inactive
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                The link will be preserved and can be reused later by linking it to another folder.
              </p>
            </div>
          </div>

          {/* Additional info */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-foreground/90">
              What happens:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Folder becomes personal (not shareable)</li>
              <li>Link becomes inactive (not accessible)</li>
              <li>Link can be reused with another folder</li>
              <li>All files remain intact</li>
            </ul>
          </div>
        </div>

        <ModalFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={unlinkFolder.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            disabled={unlinkFolder.isPending}
          >
            {unlinkFolder.isPending ? "Unlinking..." : "Unlink Folder"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
