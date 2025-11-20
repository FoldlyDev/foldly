"use client";

import * as React from "react";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { useFolderHierarchy, useResponsiveDetection } from "@/hooks";
import { useBreadcrumbDroppable } from "../../hooks/use-breadcrumb-droppable";
import { cn } from "@/lib/utils";

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

  // Responsive detection
  const { isMobile } = useResponsiveDetection();

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
    const { setNodeRef: setHomeRef, isOver: isHomeOver } = useBreadcrumbDroppable(null);

    return (
      <nav className="flex items-center gap-2" aria-label="Breadcrumb">
        {/* Home button - Drop target for root folder */}
        <Button
          ref={setHomeRef}
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(null)}
          className={cn(
            "gap-2 text-sm font-medium hover:bg-accent transition-all",
            isHomeOver && "ring-2 ring-primary/50 ring-offset-2"
          )}
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
  const { setNodeRef: setHomeRef, isOver: isHomeOver } = useBreadcrumbDroppable(null);

  return (
    <nav className="flex items-center gap-2" aria-label="Breadcrumb">
      {/* Home button - Drop target for root folder */}
      <Button
        ref={setHomeRef}
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className={cn(
          "gap-2 text-sm font-medium hover:bg-accent transition-all",
          isHomeOver && "ring-2 ring-primary/50 ring-offset-2"
        )}
      >
        <Home className="size-4" />
        <span>My Workspace</span>
      </Button>

      {/* Breadcrumb trail */}
      {hierarchy.map((folder, index) => {
        const isLast = index === hierarchy.length - 1;

        return (
          <BreadcrumbSegment
            key={folder.id}
            folder={folder}
            isLast={isLast}
            onNavigate={onNavigate}
          />
        );
      })}
    </nav>
  );
}

/**
 * Individual breadcrumb segment component
 * Handles droppable logic for non-last segments
 */
interface BreadcrumbSegmentProps {
  folder: { id: string; name: string };
  isLast: boolean;
  onNavigate: (folderId: string) => void;
}

function BreadcrumbSegment({ folder, isLast, onNavigate }: BreadcrumbSegmentProps) {
  const { setNodeRef, isOver } = useBreadcrumbDroppable(isLast ? null : folder.id);

  return (
    <div className="flex items-center gap-2">
      <ChevronRight className="size-4 text-muted-foreground" />

      {isLast ? (
        // Current folder - Not clickable, not droppable
        <span className="text-sm font-medium">{folder.name}</span>
      ) : (
        // Parent folder - Clickable and droppable
        <Button
          ref={setNodeRef}
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(folder.id)}
          className={cn(
            "text-sm font-medium hover:bg-accent transition-all",
            isOver && "ring-2 ring-primary/50 ring-offset-2"
          )}
        >
          {folder.name}
        </Button>
      )}
    </div>
  );
}
