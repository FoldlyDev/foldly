"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/aceternityui/input";
import { useWorkspaceFilters } from "../../hooks/use-workspace-filters";
import { FolderBreadcrumb } from "./FolderBreadcrumb";

/**
 * Workspace header section
 * Contains search bar and folder breadcrumb navigation
 *
 * @example
 * ```tsx
 * <WorkspaceHeader currentFolderId={folderId} onNavigate={handleNavigate} />
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
}

export function WorkspaceHeader({
  currentFolderId,
  onNavigate,
}: WorkspaceHeaderProps) {
  const { searchQuery, setSearchQuery } = useWorkspaceFilters();

  return (
    <header className="space-y-4">
      {/* Breadcrumb Navigation */}
      <FolderBreadcrumb
        currentFolderId={currentFolderId}
        onNavigate={onNavigate}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
    </header>
  );
}
