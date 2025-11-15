"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { FolderBreadcrumb } from "./FolderBreadcrumb";

/**
 * Workspace header section
 * Contains search button and folder breadcrumb navigation
 *
 * @example
 * ```tsx
 * <WorkspaceHeader
 *   currentFolderId={folderId}
 *   onNavigate={handleNavigate}
 *   onSearchClick={handleOpenSearch}
 * />
 * ```
 */
interface WorkspaceHeaderProps {
  /**
   * Current folder ID (null for root)
   */
  currentFolderId: string | null;

  /**
   * Callback when navigating to a folder
   */
  onNavigate: (folderId: string | null) => void;

  /**
   * Callback when search button is clicked
   */
  onSearchClick: () => void;
}

export function WorkspaceHeader({
  currentFolderId,
  onNavigate,
  onSearchClick,
}: WorkspaceHeaderProps) {
  return (
    <header className="space-y-4">
      {/* Breadcrumb Navigation */}
      <FolderBreadcrumb
        currentFolderId={currentFolderId}
        onNavigate={onNavigate}
      />

      {/* Search Button */}
      <Button
        onClick={onSearchClick}
        variant="outline"
        className="w-full justify-start text-muted-foreground font-normal gap-3"
      >
        <Search className="size-4 shrink-0" />
        <span>Search files and folders...</span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
    </header>
  );
}
