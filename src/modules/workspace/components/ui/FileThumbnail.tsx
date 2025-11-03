"use client";

import {
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  FileImageIcon,
} from "lucide-react";
import type { File } from "@/lib/database/schemas";
import { cn } from "@/lib/utils";

interface FileThumbnailProps {
  file: File;
  className?: string;
}

/**
 * Get icon component for file type
 */
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return FileImageIcon;
  }

  if (mimeType === 'application/pdf') {
    return FileTextIcon;
  }

  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return FileSpreadsheetIcon;
  }

  if (mimeType.includes('zip') || mimeType.includes('compressed')) {
    return FileArchiveIcon;
  }

  return FileIcon;
}

/**
 * File thumbnail component
 * Shows image preview for images, icons for other file types
 *
 * Note: Image previews will use signed URLs in production
 * For now, using placeholder until storage integration
 *
 * @example
 * ```tsx
 * <FileThumbnail file={file} />
 * ```
 */
export function FileThumbnail({ file, className }: FileThumbnailProps) {
  const isImage = file.mimeType.startsWith('image/');

  // TODO: Implement signed URL fetching for image previews
  // const { data: signedUrl } = useSignedUrl(file.id, { enabled: isImage });

  if (isImage) {
    // TODO: Use signedUrl when storage integration is complete
    // For now, show image icon
    const Icon = FileImageIcon;
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5",
          className
        )}
      >
        <Icon className="size-16 text-primary/40" strokeWidth={1.5} />
      </div>
    );
  }

  // Non-image files: show icon
  const Icon = getFileIcon(file.mimeType);

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50",
        className
      )}
    >
      <Icon className="size-16 text-muted-foreground/40" strokeWidth={1.5} />
    </div>
  );
}
