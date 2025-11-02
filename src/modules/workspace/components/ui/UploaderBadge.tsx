"use client";

import { User } from "lucide-react";
import { Badge } from "@/components/ui/shadcn/badge";

interface UploaderBadgeProps {
  email: string;
  name?: string | null;
}

/**
 * Uploader badge component
 * Shows uploader email/name in compact badge format
 *
 * @example
 * ```tsx
 * <UploaderBadge email="john@example.com" name="John Doe" />
 * ```
 */
export function UploaderBadge({ email, name }: UploaderBadgeProps) {
  const displayText = name || email;

  // Truncate long emails/names
  const truncatedText =
    displayText.length > 20 ? `${displayText.slice(0, 17)}...` : displayText;

  return (
    <Badge variant="secondary" className="gap-1.5 text-xs font-normal">
      <User className="size-3" />
      <span title={displayText}>{truncatedText}</span>
    </Badge>
  );
}
