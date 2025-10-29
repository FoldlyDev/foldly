import React from "react";
import Image from "next/image";
import { DottedGlowBackground } from "@/components/ui/aceternityui";
import {
  Eye,
  Share2,
  Settings,
  Trash2,
  MoreVertical,
  BadgeCheckIcon,
  AlertCircleIcon,
  UserCog,
  Globe,
  Lock,
} from "lucide-react";
import type { Link } from "@/lib/database/schemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/animateui/dropdown-menu";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";

interface LinkCardProps {
  link: Link;
  onOpenSettings?: () => void;
  onOpenPermissions?: () => void;
}

export function LinkCard({
  link,
  onOpenSettings,
  onOpenPermissions,
}: LinkCardProps) {
  const accentColor = link.branding?.colors?.accentColor || "#6366f1";
  const backgroundColor = link.branding?.colors?.backgroundColor || "#ffffff";

  const accentColorWithOpacity = addOpacityToColor(accentColor, 20);

  return (
    <article
      className="relative flex size-60 items-end justify-end overflow-hidden rounded-md rounded-tl-3xl rounded-br-3xl rounded-bl-3xl border border-transparent px-4 shadow ring-1 shadow-black/10 ring-black/5 md:size-80 dark:shadow-white/10 dark:ring-white/5 foldly-glass-light dark:foldly-glass"
      aria-labelledby={`link-title-${link.id}`}
    >
      <LinkCardHeader
        link={link}
        linkId={link.id}
        accentColorWithOpacity={accentColorWithOpacity}
      />
      <LinkCardActions
        link={link}
        onOpenSettings={onOpenSettings}
        onOpenPermissions={onOpenPermissions}
      />
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        color={backgroundColor}
        darkColor={backgroundColor}
        glowColor={backgroundColor}
        darkGlowColor={backgroundColor}
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
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 -translate-y-5">
      {link.branding?.logo?.url && (
        <Image
          src={link.branding.logo.url}
          alt={link.branding.logo.altText || `${link.name} logo`}
          width={80}
          height={80}
          className="size-15 md:size-20 rounded-lg object-cover"
        />
      )}
      <h1
        id={`link-title-${linkId}`}
        className="text-center font-semibold text-lg"
      >
        <span
          className="p-4 rounded-md rounded-tr-3xl backdrop-blur-xl shadow-lg ring-1 ring-white/20 border border-white/10"
          style={{ backgroundColor: accentColorWithOpacity }}
        >
          {link.name}
        </span>
      </h1>
    </div>
  );
}

/**
 * LinkCardActions - Displays optional description and dropdown menu
 */
function LinkCardActions({
  link,
  onOpenSettings,
  onOpenPermissions,
}: {
  link: Link;
  onOpenSettings?: () => void;
  onOpenPermissions?: () => void;
}) {
  const accentColor = link.branding?.colors?.accentColor || "#6366f1";
  const accentColorWithOpacity = addOpacityToColor(accentColor, 20);

  return (
    <div className="relative z-20 flex w-full justify-between items-center gap-2 px-2 py-3 backdrop-blur-[2px] md:px-4">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap gap-2">
          {/* Active/Inactive Badge */}
          {link.isActive ? (
            <Badge
              variant="secondary"
              className="w-fit text-white backdrop-blur-xl shadow-lg ring-1 ring-white/20 border border-white/10"
              style={{ backgroundColor: accentColorWithOpacity }}
            >
              <BadgeCheckIcon />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-fit">
              <AlertCircleIcon />
              Inactive
            </Badge>
          )}

          {/* Public/Private Badge */}
          {link.isPublic ? (
            <Badge variant="success" className="w-fit">
              <Globe className="size-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="default" className="w-fit">
              <Lock className="size-3" />
              Private
            </Badge>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`More actions for ${link.name}`}
            className="shrink-0"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="foldly-glass-light-solid dark:foldly-glass-solid"
        >
          <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer">
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onOpenPermissions}
            className="cursor-pointer"
          >
            <UserCog className="size-4" />
            Permissions
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Eye className="size-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Share2 className="size-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" className="cursor-pointer">
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
