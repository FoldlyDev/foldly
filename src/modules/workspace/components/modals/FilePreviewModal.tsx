"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/animateui/dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Download, Trash2, X } from "lucide-react";
import type { File } from "@/lib/database/schemas";
import { FileThumbnail } from "../ui/FileThumbnail";
import { UploaderBadge } from "../ui/UploaderBadge";

/**
 * File preview modal
 * Display-only modal showing file details and metadata
 *
 * @example
 * ```tsx
 * <FilePreviewModal
 *   file={selectedFile}
 *   isOpen={previewModal.isOpen}
 *   onOpenChange={previewModal.close}
 *   onDownload={handleDownload}
 *   onDelete={handleDelete}
 * />
 * ```
 */
interface FilePreviewModalProps {
  file: File | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
  onDelete?: () => void;
}

export function FilePreviewModal({
  file,
  isOpen,
  onOpenChange,
  onDownload,
  onDelete,
}: FilePreviewModalProps) {
  if (!file) return null;

  const fileSizeMB = (file.fileSize / (1024 * 1024)).toFixed(2);
  const uploadDate = new Date(file.uploadedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-xl">
        <ModalHeader>
          <ModalTitle>{file.filename}</ModalTitle>
          <ModalDescription>View file details and metadata</ModalDescription>
        </ModalHeader>

        <div className="space-y-6">
          {/* File Thumbnail */}
          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <FileThumbnail file={file} className="size-full" />
          </div>

          {/* File Details */}
          <div className="space-y-4">
            {/* Uploader */}
            {file.uploaderEmail && (
              <div>
                <p className="mb-2 text-sm font-medium">Uploaded by</p>
                <UploaderBadge
                  email={file.uploaderEmail}
                  name={file.uploaderName}
                />
              </div>
            )}

            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm font-medium">File Size</p>
                <p className="text-sm text-muted-foreground">{fileSizeMB} MB</p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">File Type</p>
                <p className="text-sm text-muted-foreground">{file.mimeType}</p>
              </div>
            </div>

            {/* Upload Date */}
            <div>
              <p className="mb-1 text-sm font-medium">Uploaded</p>
              <p className="text-sm text-muted-foreground">{uploadDate}</p>
            </div>
          </div>
        </div>

        <ModalFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
            Close
          </Button>
          {onDownload && (
            <Button variant="outline" onClick={onDownload} className="gap-2">
              <Download className="size-4" />
              Download
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              onClick={onDelete}
              className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
