"use client";

import Image from "next/image";
import {
  FileIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  FileArchiveIcon,
  FileImageIcon,
} from "lucide-react";
import { useFileSignedUrl } from "@/hooks/data/use-files";
import type { File } from "@/lib/database/schemas";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: File;
  className?: string;
}

/**
 * Generic blur placeholder for image loading
 * Larger version for full-size previews
 */
const IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZjVmNWY1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZTVlNWU1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjYwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=";

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
 * Full-size file preview component for modals
 * Shows high-quality image preview for images, icons for other file types
 *
 * Optimized for large display (modal previews, full-screen views)
 * Uses 90% quality and responsive sizing for crisp images
 *
 * @example
 * ```tsx
 * <FilePreview file={file} className="aspect-video" />
 * ```
 */
export function FilePreview({ file, className }: FilePreviewProps) {
  const isImage = file.mimeType.startsWith('image/');

  // Fetch signed URL for image previews
  const { data: signedUrl } = useFileSignedUrl(file.id, {
    enabled: isImage,
  });

  if (isImage) {
    // Display high-quality image with blur placeholder
    if (signedUrl) {
      return (
        <div
          className={cn(
            "relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5",
            className
          )}
        >
          <Image
            src={signedUrl}
            alt={file.filename}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 600px"
            quality={90}
            priority={true}
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
          />
        </div>
      );
    }

    // Fallback to icon while fetching signed URL or if fetch failed
    const Icon = FileImageIcon;
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5",
          className
        )}
      >
        <Icon className="size-24 text-primary/40" strokeWidth={1.5} />
      </div>
    );
  }

  // Non-image files: show larger icon
  const Icon = getFileIcon(file.mimeType);

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50",
        className
      )}
    >
      <Icon className="size-24 text-muted-foreground/40" strokeWidth={1.5} />
    </div>
  );
}
