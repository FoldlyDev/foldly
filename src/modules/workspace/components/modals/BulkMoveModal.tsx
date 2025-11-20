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
import { useMoveMixed, useRootFolders } from "@/hooks";

/**
 * Bulk move modal
 * Form modal for moving multiple files and/or folders to a different parent folder
 *
 * @example
 * ```tsx
 * <BulkMoveModal
 *   data={{ fileIds: ['id1'], folderIds: ['id2'] }}
 *   isOpen={bulkMoveModal.isOpen}
 *   onOpenChange={bulkMoveModal.close}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

const bulkMoveSchema = z.object({
  targetFolderId: z.string().nullable(),
});

type BulkMoveFormData = z.infer<typeof bulkMoveSchema>;

interface BulkMoveModalProps {
  data: { fileIds: string[]; folderIds: string[] } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentFolderId?: string | null;
}

export function BulkMoveModal({
  data,
  isOpen,
  onOpenChange,
  onSuccess,
  currentFolderId,
}: BulkMoveModalProps) {
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(
    currentFolderId ?? null
  );

  const { data: folders = [] } = useRootFolders();
  const moveMixed = useMoveMixed();

  const {
    handleSubmit,
    reset,
    setValue,
  } = useForm<BulkMoveFormData>({
    resolver: zodResolver(bulkMoveSchema),
    defaultValues: {
      targetFolderId: currentFolderId ?? null,
    },
  });

  // Update selectedFolder when currentFolderId changes (e.g., navigating between folders)
  React.useEffect(() => {
    if (isOpen) {
      const initialFolder = currentFolderId ?? null;
      setSelectedFolder(initialFolder);
      setValue('targetFolderId', initialFolder);
    }
  }, [isOpen, currentFolderId, setValue]);

  const handleClose = () => {
    reset();
    setSelectedFolder(null);
    onOpenChange(false);
  };

  // Check if the selected destination is the same as current location
  const isSameLocation = React.useMemo(() => {
    const normalizedSelected = selectedFolder ?? null;
    const normalizedCurrent = currentFolderId ?? null;
    return normalizedSelected === normalizedCurrent;
  }, [selectedFolder, currentFolderId]);

  const onSubmit = async (formData: BulkMoveFormData) => {
    if (!data) return;

    try {
      const result = await moveMixed.mutateAsync({
        fileIds: data.fileIds,
        folderIds: data.folderIds,
        targetFolderId: formData.targetFolderId,
      });

      console.log(
        `Moved ${result.movedFileCount} files and ${result.movedFolderCount} folders`
      );
      handleClose();
      onSuccess?.();
    } catch (error) {
      // Error already handled by useMoveMixed hook (createMutationErrorHandler)
      console.error("Error moving items:", error);
    }
  };

  if (!data) return null;

  const totalItems = data.fileIds.length + data.folderIds.length;
  const itemLabel = totalItems === 1 ? "item" : "items";

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FolderInput className="size-5" />
            Move {totalItems} {itemLabel}
          </ModalTitle>
          <ModalDescription>
            Choose a destination folder for the selected items
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-folder">Destination</Label>
            <Select
              value={selectedFolder || "root"}
              onValueChange={(value) => {
                const newValue = value === "root" ? null : value;
                setSelectedFolder(newValue);
                setValue("targetFolderId", newValue);
              }}
            >
              <SelectTrigger id="target-folder">
                <SelectValue placeholder="Select destination folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  Root Folder (My Workspace)
                </SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isSameLocation && (
            <p className="text-sm text-muted-foreground">
              These items are already in the selected location.
            </p>
          )}

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={moveMixed.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={moveMixed.isPending || isSameLocation}>
              {moveMixed.isPending ? "Moving..." : `Move ${totalItems} ${itemLabel}`}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
