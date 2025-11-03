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
import { Label } from "@/components/ui/aceternityui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

import { Link2, AlertCircle } from "lucide-react";
import {
  useAvailableLinks,
  useLinkFolderToExistingLink,
} from "../../hooks/use-folder-link";
import type { Folder } from "@/lib/database/schemas";
import { format } from "date-fns";

/**
 * Link folder to existing link modal
 * Dropdown selection for linking to inactive links
 *
 * @example
 * ```tsx
 * <LinkFolderToExistingModal
 *   folder={folder}
 *   isOpen={linkModal.isOpen}
 *   onOpenChange={(open) => !open && linkModal.close()}
 * />
 * ```
 */

interface LinkFolderToExistingModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkFolderToExistingModal({
  folder,
  isOpen,
  onOpenChange,
}: LinkFolderToExistingModalProps) {
  const [selectedLinkId, setSelectedLinkId] = React.useState<string>("");
  const { data: availableLinks, isLoading } = useAvailableLinks();
  const linkToExisting = useLinkFolderToExistingLink();

  const handleClose = () => {
    setSelectedLinkId("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!folder || !selectedLinkId) return;

    linkToExisting.mutate(
      {
        folderId: folder.id,
        linkId: selectedLinkId,
      },
      {
        onSuccess: () => {
          // TODO: Add success notification when notification system is implemented
          // toast.success("Folder linked successfully");
          console.log("Folder linked successfully");
          handleClose();
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
            <Link2 className="size-5" />
            Link to Existing Link
          </ModalTitle>
          <ModalDescription>
            Select an inactive link to connect with "{folder.name}"
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                Loading available links...
              </p>
            </div>
          ) : !availableLinks || availableLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <AlertCircle className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                No inactive links available.
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Create a new link or unlink an existing folder first.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="link-select">Select Link</Label>
              <Select value={selectedLinkId} onValueChange={setSelectedLinkId}>
                <SelectTrigger id="link-select">
                  <SelectValue placeholder="Choose a link..." />
                </SelectTrigger>
                <SelectContent>
                  {availableLinks.map((link) => (
                    <SelectItem key={link.id} value={link.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{link.name}</span>
                        <span className="text-xs text-muted-foreground">
                          /{link.slug} • Last used{" "}
                          {format(new Date(link.updatedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <ModalFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={linkToExisting.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedLinkId ||
              linkToExisting.isPending ||
              !availableLinks ||
              availableLinks.length === 0
            }
          >
            {linkToExisting.isPending ? "Linking..." : "Link Folder"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
