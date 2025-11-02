"use client";

import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { useFolderNavigation } from "../../hooks/use-folder-navigation";

/**
 * Folder breadcrumb navigation
 * Shows hierarchical path from root to current folder
 *
 * @example
 * ```tsx
 * <FolderBreadcrumb currentFolderId={folderId} onNavigate={handleNavigate} />
 * ```
 */
interface FolderBreadcrumbProps {
  /**
   * Current folder ID (null for root)
   */
  currentFolderId: string | null;

  /**
   * Callback when navigating to a folder
   */
  onNavigate: (folderId: string | null) => void;
}

export function FolderBreadcrumb({
  currentFolderId,
  onNavigate,
}: FolderBreadcrumbProps) {
  const { hierarchy, isLoadingHierarchy } = useFolderNavigation(currentFolderId);

  // Loading state
  if (isLoadingHierarchy && currentFolderId) {
    return (
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        <Skeleton className="h-6 w-20" />
        <ChevronRight className="size-4 text-muted-foreground" />
        <Skeleton className="h-6 w-32" />
      </nav>
    );
  }

  // Root view
  if (!currentFolderId || !hierarchy || hierarchy.length === 0) {
    return (
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Home className="size-4" />
          <span>My Workspace</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="gap-2 text-sm font-medium hover:bg-accent"
      >
        <Home className="size-4" />
        <span>My Workspace</span>
      </Button>

      {/* Breadcrumb trail */}
      {hierarchy.map((folder, index) => {
        const isLast = index === hierarchy.length - 1;

        return (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight className="size-4 text-muted-foreground" />

            {isLast ? (
              <span className="text-sm font-medium">{folder.name}</span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(folder.id)}
                className="text-sm font-medium hover:bg-accent"
              >
                {folder.name}
              </Button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
