"use client";

import { BlurImage } from "@/components/ui/blur-image";
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
    // Display high-quality image with progressive blur effect
    if (signedUrl) {
      return (
        <div
          className={cn(
            "relative flex size-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5",
            className
          )}
        >
          <BlurImage
            src={signedUrl}
            alt={file.filename}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 600px"
            quality={90}
            priority={true}
            transitionDuration={700}
            blurIntensity="blur-md"
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
