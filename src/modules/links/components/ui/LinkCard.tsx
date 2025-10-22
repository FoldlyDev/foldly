import React from "react";
import Image from "next/image";
import { DottedGlowBackground } from "@/components/ui/aceternityui";
import { TertiaryCtaButton } from "@/components/buttons/TertiaryCtaButton";
import {
  Eye,
  Share2,
  Settings,
  Trash2,
} from "lucide-react";
import type { Link } from "@/lib/database/schemas";

interface LinkCardProps {
  link: Link;
  onOpenDetails?: () => void;
}

export function LinkCard({ link, onOpenDetails }: LinkCardProps) {
  const accentColor =
    link.branding?.colors?.accentColor || "--color-neutral-500";
  const backgroundColor =
    link.branding?.colors?.backgroundColor || "--color-neutral-500";

  const accentColorWithOpacity = addOpacityToColor(accentColor, 50);

  return (
    <article
      className="relative flex size-60 items-end justify-end overflow-hidden rounded-md rounded-tl-3xl rounded-br-3xl rounded-bl-3xl border border-transparent px-4 shadow ring-1 shadow-black/10 ring-black/5 md:size-100 dark:shadow-white/10 dark:ring-white/5 foldly-glass-light dark:foldly-glass"
      aria-labelledby={`link-title-${link.id}`}
    >
      <LinkCardHeader
        link={link}
        linkId={link.id}
        accentColorWithOpacity={accentColorWithOpacity}
      />
      <LinkCardActions link={link} onOpenDetails={onOpenDetails} />
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar={backgroundColor}
        glowColorLightVar={backgroundColor}
        colorDarkVar={backgroundColor}
        glowColorDarkVar={backgroundColor}
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />
    </article>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * LinkCardHeader - Displays link branding (logo) and title
 */
function LinkCardHeader({
  link,
  linkId,
  accentColorWithOpacity,
}: {
  link: Link;
  linkId: string;
  accentColorWithOpacity: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
      {link.branding?.logo?.url && (
        <Image
          src={link.branding.logo.url}
          alt={link.branding.logo.altText || `${link.name} logo`}
          width={80}
          height={80}
          className="size-10 md:size-20 dark:invert dark:filter"
        />
      )}
      <h1 id={`link-title-${linkId}`} className="text-center font-semibold text-lg">
        <span
          className="p-4 rounded-3xl backdrop-blur-sm"
          style={{ backgroundColor: accentColorWithOpacity }}
        >
          {link.name}
        </span>
      </h1>
    </div>
  );
}

/**
 * LinkCardActions - Displays optional description and action buttons
 */
function LinkCardActions({ link, onOpenDetails }: { link: Link; onOpenDetails?: () => void }) {
  const buttonStyles = "p-1";
  const iconSize = "size-5 lg:size-4.5";
  const destructiveStyles =
    "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-600";

  return (
    <div className="relative z-20 flex w-full flex-col gap-2 px-2 py-3 backdrop-blur-[2px] md:px-4">
      {link.linkConfig.customMessage && (
        <p className="text-xs font-normal text-neutral-600 md:text-sm dark:text-neutral-400">
          {link.linkConfig.customMessage}
        </p>
      )}
      <div className="flex items-center justify-between" role="group" aria-label="Link actions">
        <div className="flex items-center gap-2">
          <TertiaryCtaButton
            className={buttonStyles}
            aria-label={`Preview ${link.name}`}
            onClick={onOpenDetails}
          >
            <Eye className={iconSize} />
          </TertiaryCtaButton>
          <TertiaryCtaButton
            className={buttonStyles}
            aria-label={`Share ${link.name}`}
          >
            <Share2 className={iconSize} />
          </TertiaryCtaButton>
          <TertiaryCtaButton
            className={buttonStyles}
            aria-label={`Configure ${link.name}`}
          >
            <Settings className={iconSize} />
          </TertiaryCtaButton>
        </div>
        <TertiaryCtaButton
          className={`${buttonStyles} ${destructiveStyles}`}
          aria-label={`Delete ${link.name}`}
        >
          <Trash2 className={iconSize} />
        </TertiaryCtaButton>
      </div>
    </div>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Adds opacity to a color value
 * @param color - The color value (hex or CSS variable)
 * @param opacity - The opacity percentage (0-100)
 * @returns Color with opacity applied
 */
function addOpacityToColor(color: string, opacity: number): string {
  if (color.startsWith("#")) {
    // Convert opacity percentage to hex (0-100 -> 00-FF)
    const hexOpacity = Math.round((opacity / 100) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${hexOpacity}`;
  }

  // For CSS variables or other color formats, use color-mix
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}
