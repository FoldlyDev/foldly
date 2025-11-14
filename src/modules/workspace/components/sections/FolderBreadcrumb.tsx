"use client";

import * as React from "react";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { useFolderHierarchy } from "@/hooks";

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
  const { data: hierarchy, isLoading: isLoadingHierarchy } = useFolderHierarchy(currentFolderId);
  const [isMobile, setIsMobile] = React.useState(false);

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Mobile: Show only "My Workspace ... Current Folder"
  if (isMobile) {
    const currentFolder = hierarchy[hierarchy.length - 1];

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

        {/* Ellipsis indicator */}
        <MoreHorizontal className="size-4 text-muted-foreground" />

        {/* Current folder (non-clickable) */}
        <span className="text-sm font-medium">{currentFolder.name}</span>
      </nav>
    );
  }

  // Desktop: Show full breadcrumb trail
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
