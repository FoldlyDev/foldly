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
import { Share2, Copy, ExternalLink } from "lucide-react";
import { useLinkFolderWithNewLink } from "../../hooks/use-folder-link";
import type { Folder } from "@/lib/database/schemas";
import { emailSchema } from "@/lib/validation/base-schemas";

/**
 * Share folder modal
 * Simple email permissions form for sharing folders
 * Auto-generates link from folder name
 *
 * @example
 * ```tsx
 * <ShareFolderModal
 *   folder={folder}
 *   isOpen={shareModal.isOpen}
 *   onOpenChange={(open) => !open && shareModal.close()}
 * />
 * ```
 */

const shareFolderSchema = z.object({
  emails: z.string().optional(),
});

type ShareFolderFormData = z.infer<typeof shareFolderSchema>;

// Email validation error state
interface EmailValidationError {
  hasError: boolean;
  message: string;
}

interface ShareFolderModalProps {
  folder: Folder | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareFolderModal({
  folder,
  isOpen,
  onOpenChange,
}: ShareFolderModalProps) {
  const [createdLink, setCreatedLink] = React.useState<{ id: string; slug: string; username: string } | null>(null);
  const [emailError, setEmailError] = React.useState<EmailValidationError>({ hasError: false, message: '' });
  const linkWithNew = useLinkFolderWithNewLink();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ShareFolderFormData>({
    resolver: zodResolver(shareFolderSchema),
  });

  const handleClose = () => {
    reset();
    setCreatedLink(null);
    setEmailError({ hasError: false, message: '' });
    onOpenChange(false);
  };

  const handleCopyUrl = async () => {
    if (!createdLink) return;

    // Link returned from mutation includes workspace.user.username
    const url = `${window.location.origin}/${createdLink.username}/${createdLink.slug}`;
    await navigator.clipboard.writeText(url);
    // TODO: Add success notification when notification system is implemented
    // toast.success("Link copied to clipboard");
    console.log("Link copied to clipboard:", url);
  };

  const onSubmit = async (data: ShareFolderFormData) => {
    if (!folder) return;

    // Clear previous email errors
    setEmailError({ hasError: false, message: '' });

    // Parse and validate emails
    const emailsArray = data.emails
      ? data.emails
          .split(/[\s,]+/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : undefined;

    // Validate emails
    if (emailsArray && emailsArray.length > 0) {
      for (const email of emailsArray) {
        try {
          emailSchema.parse(email);
        } catch (error) {
          // Use inline error state instead of toast
          setEmailError({ hasError: true, message: `Invalid email: ${email}` });
          return;
        }
      }
    }

    linkWithNew.mutate(
      {
        folderId: folder.id,
        allowedEmails: emailsArray,
      },
      {
        onSuccess: (link) => {
          // Link includes workspace.user.username from getLinkById query
          const username = (link as any).workspace?.user?.username || 'user';
          setCreatedLink({ id: link.id, slug: link.slug, username });
          // TODO: Add success notification when notification system is implemented
          // toast.success("Link created and shared");
          console.log("Link created and shared:", link.slug);

          // Auto-copy link URL to clipboard
          const url = `${window.location.origin}/${username}/${link.slug}`;
          navigator.clipboard.writeText(url);
        },
      }
    );
  };

  if (!folder) return null;

  // Auto-generated preview
  const previewLinkName = `${folder.name} Link`;
  const previewSlug = folder.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share "{folder.name}"
          </ModalTitle>
          <ModalDescription>
            {!createdLink
              ? "Create a shareable link for this folder. Optionally add emails to grant access."
              : "Link created successfully! Copy and share it."}
          </ModalDescription>
        </ModalHeader>

        {!createdLink ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Auto-generation preview */}
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground/90">
                Link will be created:
              </p>
              <p className="text-sm text-muted-foreground">
                Name: <span className="font-mono">{previewLinkName}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                URL:{" "}
                <span className="font-mono">
                  {window.location.host}/{previewSlug}-link
                </span>
              </p>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="share-emails">
                Email addresses (optional)
              </Label>
              <Input
                id="share-emails"
                placeholder="client@example.com, partner@example.com"
                {...register("emails")}
                aria-invalid={errors.emails || emailError.hasError ? "true" : "false"}
              />
              {errors.emails && (
                <p className="text-xs text-destructive">
                  {errors.emails.message}
                </p>
              )}
              {emailError.hasError && (
                <p className="text-xs text-destructive">
                  {emailError.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas or spaces. Leave empty for
                a public link.
              </p>
            </div>

            <ModalFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={linkWithNew.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={linkWithNew.isPending}>
                {linkWithNew.isPending ? "Creating..." : "Create & Share"}
              </Button>
            </ModalFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Success state - show link URL */}
            <div className="rounded-md border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground/90">
                Shareable Link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 text-sm font-mono break-all">
                  {window.location.origin}/{createdLink.slug}
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

            <ModalFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  window.open(`/dashboard/links?id=${createdLink.id}`, "_blank");
                }}
              >
                <ExternalLink className="size-4 mr-2" />
                Manage Link
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </ModalFooter>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
