"use client";

import { Inbox } from "lucide-react";

interface EmptyFilesStateProps {
  title?: string;
  description?: string;
}

/**
 * Empty files state component
 * Shows when workspace has no files matching current filter
 *
 * @example
 * ```tsx
 * {files.length === 0 && (
 *   <EmptyFilesState
 *     title="No files found"
 *     description="Try adjusting your filters"
 *   />
 * )}
 * ```
 */
export function EmptyFilesState({
  title = "No files yet",
  description = "Files uploaded to your workspace will appear here.",
}: EmptyFilesStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
        <Inbox className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
