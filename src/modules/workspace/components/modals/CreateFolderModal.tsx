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
import { Folder } from "lucide-react";
import { useCreateFolder } from "@/hooks";

/**
 * Create folder modal
 * Form modal for creating new folders
 *
 * @example
 * ```tsx
 * <CreateFolderModal
 *   isOpen={createModal.isOpen}
 *   onOpenChange={createModal.close}
 *   onSuccess={handleSuccess}
 *   parentFolderId={currentFolderId}
 * />
 * ```
 */

const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(255, "Folder name must be less than 255 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_()[\]{}.,!@#$%^&+=]+$/,
      "Folder name contains invalid characters"
    ),
});

type CreateFolderFormData = z.infer<typeof createFolderSchema>;

interface CreateFolderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  parentFolderId?: string | null;
}

export function CreateFolderModal({
  isOpen,
  onOpenChange,
  onSuccess,
  parentFolderId = null,
}: CreateFolderModalProps) {
  const createFolder = useCreateFolder();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderSchema),
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: CreateFolderFormData) => {
    createFolder.mutate(
      {
        name: data.name,
        parentFolderId,
      },
      {
        onSuccess: () => {
          // TODO: Add success notification when notification system is implemented
          // toast.success("Folder created successfully");
          console.log("Folder created successfully");
          handleClose();
          onSuccess?.();
        },
        onError: (error) => {
          // TODO: Add error notification when notification system is implemented
          // Error already handled by useCreateFolder hook (createMutationErrorHandler)
          console.error("Error creating folder:", error);
        },
      }
    );
  };

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Folder className="size-5" />
            Create new folder
          </ModalTitle>
          <ModalDescription>
            Enter a name for your new folder
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
              disabled={createFolder.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createFolder.isPending}>
              {createFolder.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
