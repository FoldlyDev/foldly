"use client";

import { FolderOpen } from "lucide-react";

interface EmptyFolderStateProps {
  folderName?: string;
}

/**
 * Empty folder state component
 * Shows when a folder has no files
 *
 * @example
 * ```tsx
 * {files.length === 0 && <EmptyFolderState folderName={currentFolder.name} />}
 * ```
 */
export function EmptyFolderState({ folderName }: EmptyFolderStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="size-10 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 text-lg font-semibold">
        {folderName ? `${folderName} is empty` : 'This folder is empty'}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        No files have been uploaded to this folder yet.
      </p>
    </div>
  );
}
