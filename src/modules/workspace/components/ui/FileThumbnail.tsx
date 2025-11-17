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
 * Uses signed URLs for private storage file access
 * URLs expire after 24 hours and are cached for 20 minutes
 *
 * @example
 * ```tsx
 * <FileThumbnail file={file} />
 * ```
 */
export function FileThumbnail({ file, className }: FileThumbnailProps) {
  const isImage = file.mimeType.startsWith('image/');

  // Fetch signed URL for image previews
  const { data: signedUrl, isLoading } = useFileSignedUrl(file.id, {
    enabled: isImage,
  });

  if (isImage) {
    // Display image with progressive blur effect
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
            className="object-cover"
            sizes="48px"
            quality={75}
            priority={false}
            transitionDuration={300}
            blurIntensity="blur-sm"
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
