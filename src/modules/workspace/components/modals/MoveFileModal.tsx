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

import { FileInput } from "lucide-react";
import { useMoveFile } from "@/hooks";
import { useRootFolders } from "@/hooks";
import type { File } from "@/lib/database/schemas";

/**
 * Move file modal
 * Form modal for moving files to different parent folders
 *
 * @example
 * ```tsx
 * <MoveFileModal
 *   file={selectedFile}
 *   isOpen={moveModal.isOpen}
 *   onOpenChange={moveModal.close}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

const moveFileSchema = z.object({
  parentFolderId: z.string().nullable(),
});

type MoveFileFormData = z.infer<typeof moveFileSchema>;

interface MoveFileModalProps {
  file: File | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MoveFileModal({
  file,
  isOpen,
  onOpenChange,
  onSuccess,
}: MoveFileModalProps) {
  const [selectedParent, setSelectedParent] = React.useState<string | null>(
    null
  );

  const { data: folders = [] } = useRootFolders();
  const moveFile = useMoveFile();

  const {
    handleSubmit,
    reset,
    setValue,
  } = useForm<MoveFileFormData>({
    resolver: zodResolver(moveFileSchema),
    defaultValues: {
      parentFolderId: file?.parentFolderId || null,
    },
  });

  // Update selected value when file changes
  React.useEffect(() => {
    if (file) {
      setSelectedParent(file.parentFolderId);
      setValue("parentFolderId", file.parentFolderId);
    }
  }, [file, setValue]);

  const handleClose = () => {
    reset();
    setSelectedParent(null);
    onOpenChange(false);
  };

  // Check if the selected destination is the same as current location
  const isSameLocation = React.useMemo(() => {
    const normalizedSelected = selectedParent ?? null;
    const normalizedCurrent = file?.parentFolderId ?? null;
    return normalizedSelected === normalizedCurrent;
  }, [selectedParent, file?.parentFolderId]);

  const onSubmit = async (data: MoveFileFormData) => {
    if (!file) return;

    try {
      await moveFile.mutateAsync({
        fileId: file.id,
        newParentId: data.parentFolderId,
      });

      // TODO: Add success notification when notification system is implemented
      // toast.success("File moved successfully");
      console.log("File moved successfully");
      handleClose();
      onSuccess?.();
    } catch (error) {
      // TODO: Add error notification when notification system is implemented
      // Error already handled by useMoveFile hook (createMutationErrorHandler)
      console.error("Error moving file:", error);
    }
  };

  if (!file) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileInput className="size-5" />
            Move file
          </ModalTitle>
          <ModalDescription>
            Choose a new location for &quot;{file.filename}&quot;
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
                  {file.parentFolderId === null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Current)
                    </span>
                  )}
                </SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    {file.parentFolderId === f.id && (
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
              This file is already in the selected location.
            </p>
          )}

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={moveFile.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={moveFile.isPending || isSameLocation}>
              {moveFile.isPending ? "Moving..." : "Move File"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
