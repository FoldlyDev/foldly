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

import { AlertTriangle } from "lucide-react";

/**
 * Delete confirmation modal
 * Generic confirmation modal for deleting resources
 *
 * @example
 * ```tsx
 * <DeleteConfirmModal
 *   isOpen={deleteModal.isOpen}
 *   onOpenChange={deleteModal.close}
 *   onConfirm={handleDelete}
 *   title="Delete folder"
 *   description="Are you sure you want to delete this folder?"
 *   resourceName={folderName}
 * />
 * ```
 */

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  resourceName?: string;
  warningMessage?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Confirm deletion",
  description,
  resourceName,
  warningMessage = "This action cannot be undone.",
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);

    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // TODO: Add error notification when notification system is implemented
      // toast.error("Failed to delete resource");
      console.error("Failed to delete resource");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {title}
          </ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>

        <div className="space-y-3">
          {resourceName && (
            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-sm font-medium">{resourceName}</p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
            <AlertTriangle className="size-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">{warningMessage}</p>
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
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
