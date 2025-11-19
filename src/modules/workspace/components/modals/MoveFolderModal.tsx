"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/animateui/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/aceternityui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

import { FolderInput } from "lucide-react";
import { useRootFolders, useMoveFolder } from "@/hooks";
import type { Folder } from "@/lib/database/schemas";

/**
 * Move folder modal
 * Form modal for moving folders to different parent folders
 *
 * @example
 * ```tsx
 * <MoveFolderModal
 *   folder={selectedFolder}
 *   isOpen={moveModal.isOpen}
 *   onOpenChange={moveModal.close}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

const moveFolderSchema = z.object({
  parentFolderId: z.string().nullable(),
});

type MoveFolderFormData = z.infer<typeof moveFolderSchema>;

interface MoveFolderModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MoveFolderModal({
  folder,
  isOpen,
  onOpenChange,
  onSuccess,
}: MoveFolderModalProps) {
  const [selectedParent, setSelectedParent] = React.useState<string | null>(
    null
  );

  const { data: folders = [] } = useRootFolders();
  const moveFolder = useMoveFolder();

  const {
    handleSubmit,
    reset,
    setValue,
  } = useForm<MoveFolderFormData>({
    resolver: zodResolver(moveFolderSchema),
    defaultValues: {
      parentFolderId: folder?.parentFolderId || null,
    },
  });

  // Filter out the current folder and its descendants to prevent circular references
  const availableFolders = React.useMemo(() => {
    if (!folder) return folders;

    const isDescendant = (folderId: string, ancestorId: string): boolean => {
      const current = folders.find((f: Folder) => f.id === folderId);
      if (!current) return false;
      if (current.parentFolderId === ancestorId) return true;
      if (!current.parentFolderId) return false;
      return isDescendant(current.parentFolderId, ancestorId);
    };

    return folders.filter(
      (f: Folder) => f.id !== folder.id && !isDescendant(f.id, folder.id)
    );
  }, [folder, folders]);

  // Update selected value when folder changes
  React.useEffect(() => {
    if (folder) {
      setSelectedParent(folder.parentFolderId);
      setValue("parentFolderId", folder.parentFolderId);
    }
  }, [folder, setValue]);

  const handleClose = () => {
    reset();
    setSelectedParent(null);
    onOpenChange(false);
  };

  // Check if the selected destination is the same as current location
  const isSameLocation = React.useMemo(() => {
    const normalizedSelected = selectedParent ?? null;
    const normalizedCurrent = folder?.parentFolderId ?? null;
    return normalizedSelected === normalizedCurrent;
  }, [selectedParent, folder?.parentFolderId]);

  const onSubmit = async (data: MoveFolderFormData) => {
    if (!folder) return;

    moveFolder.mutate(
      {
        folderId: folder.id,
        newParentId: data.parentFolderId,
      },
      {
        onSuccess: () => {
          // TODO: Add success notification when notification system is implemented
          // toast.success("Folder moved successfully");
          console.log("Folder moved successfully");
          handleClose();
          onSuccess?.();
        },
        onError: (error) => {
          // TODO: Add error notification when notification system is implemented
          // toast.error("Failed to move folder");
          console.error("Failed to move folder:", error);
        },
      }
    );
  };

  if (!folder) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FolderInput className="size-5" />
            Move folder
          </ModalTitle>
          <ModalDescription>
            Choose a new location for &quot;{folder.name}&quot;
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent-folder">Destination</Label>
            <Select
              value={selectedParent || "root"}
              onValueChange={(value) => {
                const newValue = value === "root" ? null : value;
                setSelectedParent(newValue);
                setValue("parentFolderId", newValue);
              }}
            >
              <SelectTrigger id="parent-folder">
                <SelectValue placeholder="Select destination folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  Root Folder (My Workspace)
                  {folder.parentFolderId === null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Current)
                    </span>
                  )}
                </SelectItem>
                {availableFolders.map((f: Folder) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    {folder.parentFolderId === f.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSameLocation && (
            <p className="text-sm text-muted-foreground">
              This folder is already in the selected location.
            </p>
          )}

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={moveFolder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={moveFolder.isPending || isSameLocation}>
              {moveFolder.isPending ? "Moving..." : "Move Folder"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
