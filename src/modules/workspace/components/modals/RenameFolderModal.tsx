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
import { Input } from "@/components/ui/aceternityui/input";
import { Label } from "@/components/ui/aceternityui/label";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { updateFolderAction } from "@/lib/actions/folder.actions";
import type { Folder } from "@/lib/database/schemas";

/**
 * Rename folder modal
 * Form modal for renaming existing folders
 *
 * @example
 * ```tsx
 * <RenameFolderModal
 *   folder={selectedFolder}
 *   isOpen={renameModal.isOpen}
 *   onOpenChange={renameModal.close}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

const renameFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(255, "Folder name must be less than 255 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_()[\]{}.,!@#$%^&+=]+$/,
      "Folder name contains invalid characters"
    ),
});

type RenameFolderFormData = z.infer<typeof renameFolderSchema>;

interface RenameFolderModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RenameFolderModal({
  folder,
  isOpen,
  onOpenChange,
  onSuccess,
}: RenameFolderModalProps) {
  const [isRenaming, setIsRenaming] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RenameFolderFormData>({
    resolver: zodResolver(renameFolderSchema),
    defaultValues: {
      name: folder?.name || "",
    },
  });

  // Update default value when folder changes
  React.useEffect(() => {
    if (folder) {
      reset({ name: folder.name });
    }
  }, [folder, reset]);

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: RenameFolderFormData) => {
    if (!folder) return;

    setIsRenaming(true);

    try {
      const result = await updateFolderAction({
        folderId: folder.id,
        name: data.name,
      });

      if (result.success) {
        toast.success("Folder renamed successfully");
        handleClose();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to rename folder");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsRenaming(false);
    }
  };

  if (!folder) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Edit className="size-5" />
            Rename folder
          </ModalTitle>
          <ModalDescription>
            Enter a new name for &quot;{folder.name}&quot;
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              placeholder="e.g., Tax Documents"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRenaming}>
              {isRenaming ? "Renaming..." : "Rename Folder"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
