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
import { Eye, Copy, ExternalLink, Globe, Lock, BadgeCheck, AlertCircle } from "lucide-react";
import { useUserWorkspace } from "@/hooks";
import type { Folder, Link } from "@/lib/database/schemas";
import { format } from "date-fns";

/**
 * View folder link details modal
 * Read-only modal showing link information for a linked folder
 *
 * @example
 * ```tsx
 * <ViewFolderLinkDetailsModal
 *   data={{ folder, link }}
 *   isOpen={viewModal.isOpen}
 *   onOpenChange={(open) => !open && viewModal.close()}
 * />
 * ```
 */

interface ViewFolderLinkDetailsModalProps {
  data: { folder: Folder; link: Link } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewFolderLinkDetailsModal({
  data,
  isOpen,
  onOpenChange,
}: ViewFolderLinkDetailsModalProps) {
  const folder = data?.folder;
  const link = data?.link;
  const { data: workspace } = useUserWorkspace();

  const handleCopyUrl = async () => {
    if (!link || !workspace?.user?.username) return;

    // Workspace includes user.username from getUserWorkspace query (WorkspaceWithUser type)
    const url = `${window.location.origin}/${workspace.user.username}/${link.slug}`;
    await navigator.clipboard.writeText(url);
    // TODO: Add success notification when notification system is implemented
    // toast.success("Link copied to clipboard");
    console.log("Link copied to clipboard:", url);
  };

  const handleManageLink = () => {
    if (!link) return;
    window.open(`/dashboard/links?id=${link.id}`, "_blank");
  };

  if (!folder || !link) return null;

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Link Details
          </ModalTitle>
          <ModalDescription>
            View link information for "{folder.name}"
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {/* Link URL */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Link URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                {window.location.host}/{link.slug}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                title="Copy link"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {link.isActive ? (
                  <BadgeCheck className="size-4 text-green-600" />
                ) : (
                  <AlertCircle className="size-4 text-amber-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {link.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1.5">
                {link.isPublic ? (
                  <Globe className="size-4 text-blue-600" />
                ) : (
                  <Lock className="size-4 text-purple-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  {link.isPublic ? "Public" : "Private"}
                </span>
              </div>
            </div>
          </div>

          {/* Link Name */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Link Name</p>
            <p className="text-sm text-muted-foreground">{link.name}</p>
          </div>

          {/* Configuration */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Settings</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Notify on upload</span>
                <span>{link.linkConfig?.notifyOnUpload ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Password protected</span>
                <span>{link.linkConfig?.passwordProtected ? "Yes" : "No"}</span>
              </div>
              {link.linkConfig?.expiresAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires</span>
                  <span>{format(new Date(link.linkConfig.expiresAt), "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-medium text-muted-foreground mb-1">Created</p>
                <p>{format(new Date(link.createdAt), "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground mb-1">Updated</p>
                <p>{format(new Date(link.updatedAt), "MMM d, yyyy")}</p>
              </div>
            </div>
          </div>
        </div>

        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleManageLink}>
            <ExternalLink className="size-4 mr-2" />
            Manage Link Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
