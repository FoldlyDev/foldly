"use client";

import * as React from "react";
import type { File, Folder } from "@/lib/database/schemas";
import type { GroupBy, SortBy, SortOrder } from "../../../hooks/use-workspace-filters";
import { WorkspaceHeader } from "../../sections/WorkspaceHeader";
import { FilterToolbar } from "../../filters/FilterToolbar";
import { FileGrid } from "../../sections/FileGrid";
import { GroupedFileList } from "../../sections/GroupedFileList";
import { SelectionToolbar } from "../../sections/SelectionToolbar";
import { Button } from "@/components/ui/shadcn/button";
import { FolderPlus } from "lucide-react";
import {
  groupFilesByEmail,
  groupFilesByDate,
  groupFilesByFolder,
  groupFilesByType,
  sortFiles,
} from "@/lib/utils/workspace-helpers";

/**
 * Desktop layout for workspace
 * Horizontal filter toolbar, large grid layout, fixed selection toolbar
 */

interface DesktopLayoutProps {
  files: File[];
  folders: Folder[];
  groupBy: GroupBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
  filterEmail: string | null;
  searchQuery: string;
  currentFolderId: string | null;
  onNavigateFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: Folder) => void;
  onMoveFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onShareFolder: (folder: Folder) => void;
  onLinkToExisting: (folder: Folder) => void;
  onCopyLinkUrl: (folder: Folder) => void;
  onViewLinkDetails: (folder: Folder) => void;
  onUnlinkFolder: (folder: Folder) => void;
  onPreviewFile: (file: File) => void;
  onDownloadFile: (file: File) => void;
  onDeleteFile: (file: File) => void;
  selectedFiles: Set<string>;
  onSelectFile: (fileId: string) => void;
  selectedFolders: Set<string>;
  onSelectFolder: (folderId: string) => void;
  isSelectMode: boolean;
  onClearSelection: () => void;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
}

export function DesktopLayout({
  files,
  folders,
  groupBy,
  sortBy,
  sortOrder,
  filterEmail,
  searchQuery,
  currentFolderId,
  onNavigateFolder,
  onCreateFolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onShareFolder,
  onLinkToExisting,
  onCopyLinkUrl,
  onViewLinkDetails,
  onUnlinkFolder,
  onPreviewFile,
  onDownloadFile,
  onDeleteFile,
  selectedFiles,
  onSelectFile,
  selectedFolders,
  onSelectFolder,
  isSelectMode,
  onClearSelection,
  onBulkDownload,
  onBulkDelete,
}: DesktopLayoutProps) {
  // Filter files by email if active
  const filteredFiles = React.useMemo(() => {
    let result = files;

    if (filterEmail) {
      result = result.filter((file) => file.uploaderEmail === filterEmail);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (file) =>
          file.filename.toLowerCase().includes(query) ||
          file.uploaderEmail?.toLowerCase().includes(query) ||
          file.uploaderName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [files, filterEmail, searchQuery]);

  // Sort files
  const sortedFiles = React.useMemo(
    () => sortFiles(filteredFiles, sortBy, sortOrder),
    [filteredFiles, sortBy, sortOrder]
  );

  // Group files if needed
  const groupedFiles = React.useMemo(() => {
    switch (groupBy) {
      case "email":
        return groupFilesByEmail(sortedFiles);
      case "date":
        return groupFilesByDate(sortedFiles);
      case "folder": {
        // groupFilesByFolder returns FolderGroup[], convert to Map for consistency
        const folderGroups = groupFilesByFolder(sortedFiles, folders);
        const grouped = new Map<string, File[]>();
        folderGroups.forEach((group) => {
          const key = group.folder?.name || "Root";
          grouped.set(key, group.files);
        });
        return grouped;
      }
      case "type":
        return groupFilesByType(sortedFiles);
      case "none":
      default:
        return null;
    }
  }, [groupBy, sortedFiles, folders]);

  const selectedCount = selectedFiles.size + selectedFolders.size;
  const hasFolders = selectedFolders.size > 0;
  const hasFiles = selectedFiles.size > 0;

  return (
    <div className="relative min-h-screen pb-32">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header with breadcrumb and search */}
        <WorkspaceHeader
          currentFolderId={currentFolderId}
          onNavigate={onNavigateFolder}
        />

        {/* Toolbar: Filters + Create Folder Button */}
        <div className="flex items-center justify-between gap-4">
          <FilterToolbar />
          <Button onClick={onCreateFolder} className="gap-2">
            <FolderPlus className="size-4" />
            New Folder
          </Button>
        </div>

        {/* Main content area */}
        {groupedFiles ? (
          <GroupedFileList
            groups={groupedFiles}
            groupBy={groupBy}
            onPreviewFile={onPreviewFile}
            onDownloadFile={onDownloadFile}
            onDeleteFile={onDeleteFile}
            selectedFiles={selectedFiles}
            onSelectFile={onSelectFile}
            showCheckboxes={isSelectMode}
          />
        ) : (
          <FileGrid
            folders={folders}
            files={sortedFiles}
            currentFolderId={currentFolderId}
            onNavigate={onNavigateFolder}
            onRenameFolder={onRenameFolder}
            onMoveFolder={onMoveFolder}
            onDeleteFolder={onDeleteFolder}
            onShareFolder={onShareFolder}
            onLinkToExisting={onLinkToExisting}
            onCopyLinkUrl={onCopyLinkUrl}
            onViewLinkDetails={onViewLinkDetails}
            onUnlinkFolder={onUnlinkFolder}
            onPreviewFile={onPreviewFile}
            onDownloadFile={onDownloadFile}
            onDeleteFile={onDeleteFile}
            selectedFolders={selectedFolders}
            onSelectFolder={onSelectFolder}
            selectedFiles={selectedFiles}
            onSelectFile={onSelectFile}
            showCheckboxes={isSelectMode}
          />
        )}
      </div>

      {/* Selection toolbar (fixed bottom) */}
      {selectedCount > 0 && (
        <SelectionToolbar
          selectedCount={selectedCount}
          onClear={onClearSelection}
          onDownload={hasFiles ? onBulkDownload : undefined}
          onDelete={onBulkDelete}
          hasFolders={hasFolders}
          hasFiles={hasFiles}
        />
      )}
    </div>
  );
}
