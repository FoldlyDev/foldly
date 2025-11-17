"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

export interface BlurImageProps extends Omit<ImageProps, 'onLoad'> {
  /**
   * Transition duration in milliseconds
   * @default 500
   */
  transitionDuration?: number;

  /**
   * Blur intensity while loading (Tailwind blur class)
   * @default "blur-sm"
   */
  blurIntensity?: "blur-none" | "blur-sm" | "blur" | "blur-md" | "blur-lg" | "blur-xl";

  /**
   * Whether to apply subtle scale effect while loading
   * @default true
   */
  enableScale?: boolean;

  /**
   * Custom onLoad handler (will be called after internal loading state is updated)
   */
  onLoadComplete?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

/**
 * Reusable image component with progressive blur loading effect
 *
 * Features:
 * - Smooth blur-to-sharp transition as image loads
 * - Optional subtle scale effect for premium feel
 * - Fully customizable transition duration and blur intensity
 * - Supports all Next.js Image props (fill, sizes, priority, quality, etc.)
 * - Works with both fill and fixed dimensions
 *
 * @example
 * ```tsx
 * // File thumbnail (48px, object-cover, fast transition)
 * <BlurImage
 *   src={signedUrl}
 *   alt={file.filename}
 *   fill
 *   className="object-cover"
 *   sizes="48px"
 *   quality={75}
 *   transitionDuration={300}
 * />
 *
 * // File preview modal (600px, object-contain, slower transition)
 * <BlurImage
 *   src={signedUrl}
 *   alt={file.filename}
 *   fill
 *   className="object-contain"
 *   sizes="(max-width: 640px) 100vw, 600px"
 *   quality={90}
 *   priority
 *   transitionDuration={700}
 * />
 *
 * // Custom blur intensity and no scale effect
 * <BlurImage
 *   src={imageUrl}
 *   alt="Hero image"
 *   fill
 *   blurIntensity="blur-lg"
 *   enableScale={false}
 * />
 * ```
 */
export function BlurImage({
  src,
  alt,
  className,
  onLoadComplete,
  transitionDuration = 500,
  blurIntensity = "blur-sm",
  enableScale = true,
  fill,
  sizes,
  ...rest
}: BlurImageProps) {
  const [isLoading, setLoading] = useState(true);

  // Ensure sizes is set if fill is true (Next.js best practice)
  const imageSizes = fill && !sizes
    ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    : sizes;

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setLoading(false);
    onLoadComplete?.(e);
  };

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={imageSizes}
      onLoad={handleLoad}
      className={cn(
        // Smooth transition with custom duration
        `transition-[filter,transform] ease-out`,
        // Apply blur and optional scale while loading
        isLoading && [
          blurIntensity,
          enableScale && "scale-105"
        ],
        // Remove effects when loaded
        !isLoading && [
          "blur-0",
          enableScale && "scale-100"
        ],
        className
      )}
      style={{
        transitionDuration: `${transitionDuration}ms`,
        ...rest.style,
      }}
      {...rest}
    />
  );
}
