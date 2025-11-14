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
import { MultipleFileUpload } from "@/components/ui/originui/file-upload";
import { Upload, Loader2 } from "lucide-react";
import { useUppyUpload } from "@/hooks/utility/use-uppy-upload";
import { useCreateFileRecord } from "@/hooks/data/use-files";
import { useRootFolders, useUserWorkspace } from "@/hooks";
import { UPLOADS_BUCKET_NAME } from "@/lib/validation/file-schemas";
import type { Folder } from "@/lib/database/schemas";
import type { FileWithPreview } from "@/hooks/utility/use-file-upload";

/**
 * Upload files modal
 * Modal for uploading multiple files to workspace with folder selection
 *
 * Features:
 * - Multiple file upload (batch upload)
 * - Folder selection (upload destination)
 * - Upload progress tracking
 * - Automatic file record creation
 * - Cache invalidation on success
 *
 * @example
 * ```tsx
 * <UploadFilesModal
 *   isOpen={uploadModal.isOpen}
 *   onOpenChange={uploadModal.close}
 *   currentFolderId={currentFolderId}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */

interface UploadFilesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId?: string | null;
  onSuccess?: () => void;
}

export function UploadFilesModal({
  isOpen,
  onOpenChange,
  currentFolderId = null,
  onSuccess,
}: UploadFilesModalProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<FileWithPreview[]>([]);
  const [targetFolderId, setTargetFolderId] = React.useState<string | null>(
    currentFolderId
  );
  const [uploadedCount, setUploadedCount] = React.useState(0);
  const [totalFiles, setTotalFiles] = React.useState(0);

  // Data fetching
  const { data: workspace } = useUserWorkspace();
  const { data: folders = [] } = useRootFolders();
  const createFileRecord = useCreateFileRecord();

  // Uppy upload hook
  const uppyUpload = useUppyUpload({
    bucket: UPLOADS_BUCKET_NAME || "foldly-uploads",
    authMode: "authenticated",
    onSuccess: () => {
      setUploadedCount((prev) => prev + 1);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      // TODO: Add error notification when notification system is implemented
    },
  });

  // Update target folder when currentFolderId changes
  React.useEffect(() => {
    if (isOpen) {
      setTargetFolderId(currentFolderId);
    }
  }, [currentFolderId, isOpen]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setUploadedCount(0);
      setTotalFiles(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (!uppyUpload.isUploading) {
      onOpenChange(false);
    }
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!workspace || selectedFiles.length === 0) return;

    setTotalFiles(selectedFiles.length);
    setUploadedCount(0);

    // Upload all files sequentially
    for (const fileWithPreview of selectedFiles) {
      // FileUpload component always provides File instances (not FileMetadata) for new uploads
      const file = fileWithPreview.file as File;
      try {
        // Construct storage path
        const folderPath = targetFolderId || "root";
        const uploadPath = `uploads/${workspace.id}/${folderPath}`;

        // Upload file to storage with parentFolderId for duplicate detection
        const uploadResult = await uppyUpload.upload(file, {
          path: uploadPath,
          parentFolderId: targetFolderId,
          metadata: {
            workspaceId: workspace.id,
            folderId: targetFolderId || "",
          },
        });

        // Create file record in database
        // Use the unique filename from upload session (already checked for duplicates)
        await createFileRecord.mutateAsync({
          filename: uploadResult.uniqueFileName,
          fileSize: file.size,
          mimeType: file.type,
          storagePath: uploadResult.storagePath,
          parentFolderId: targetFolderId,
          uploaderEmail: null, // Owner uploads (tracked by workspaceId)
          uploaderName: null, // Owner uploads (tracked by workspaceId)
        });
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with next file even if one fails
      }
    }

    // All uploads complete
    // TODO: Add success notification when notification system is implemented
    console.log(`Successfully uploaded ${uploadedCount} of ${totalFiles} files`);
    handleClose();
    onSuccess?.();
  };

  const isUploading = uppyUpload.isUploading || createFileRecord.isPending;
  const hasFiles = selectedFiles.length > 0;
  const canUpload = hasFiles && !isUploading;

  // Get target folder name for display
  const targetFolderName = React.useMemo(() => {
    if (!targetFolderId) return "Root (My Workspace)";
    const folder = folders.find((f: Folder) => f.id === targetFolderId);
    return folder?.name || "Root (My Workspace)";
  }, [targetFolderId, folders]);

  // Calculate total size
  const totalSize = React.useMemo(() => {
    const bytes = selectedFiles.reduce((sum, fileWithPreview) => sum + fileWithPreview.file.size, 0);
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2);
  }, [selectedFiles]);

  return (
    <Modal open={isOpen} onOpenChange={onOpenChange}>
      <ModalContent className="gap-4 sm:max-w-md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload files
          </ModalTitle>
          <ModalDescription>
            Select files to upload to your workspace
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {/* Folder selection */}
          <div className="space-y-2">
            <Label htmlFor="target-folder">Upload to</Label>
            <Select
              value={targetFolderId || "root"}
              onValueChange={(value) =>
                setTargetFolderId(value === "root" ? null : value)
              }
              disabled={isUploading}
            >
              <SelectTrigger id="target-folder">
                <SelectValue placeholder="Select destination folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (My Workspace)</SelectItem>
                {folders.map((folder: Folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Files will be uploaded to: {targetFolderName}
            </p>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Select files</Label>
            <MultipleFileUpload
              maxSizeMB={100}
              accept="*"
              onFilesChange={handleFilesChange}
              disabled={isUploading}
              title="Drop your files here"
              description="All file types (max. 100MB per file)"
              buttonText="Select files"
              ariaLabel="Upload files to workspace"
            />
            {hasFiles && (
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} file(s) selected ({totalSize} MB)
              </p>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2 rounded-md border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <p className="text-sm font-medium">
                  Uploading {uploadedCount} of {totalFiles} files...
                </p>
              </div>
              {uppyUpload.progress > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uppyUpload.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* File size warning */}
          {hasFiles && parseFloat(totalSize) > 100 && (
            <p className="text-xs text-destructive">
              Some files may exceed the 100MB limit and will be rejected.
            </p>
          )}
        </div>

        <ModalFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!canUpload}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ""}
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
