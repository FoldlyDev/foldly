"use client";

import * as React from "react";
import type { File, Folder } from "@/lib/database/schemas";
import type { GroupBy, SortBy, SortOrder } from "../../../hooks/use-workspace-filters";
import type { FolderCounts } from "@/lib/utils/workspace-helpers";
import { WorkspaceHeader } from "../../sections/WorkspaceHeader";
import { FilterBottomSheet } from "../../filters/FilterBottomSheet";
import { FileGrid } from "../../sections/FileGrid";
import { GroupedFileList } from "../../sections/GroupedFileList";
import { SelectionToolbar } from "../../sections/SelectionToolbar";
import { Button } from "@/components/ui/shadcn/button";
import { FolderPlus, Upload } from "lucide-react";
import {
  groupFilesByEmail,
  groupFilesByDate,
  groupFilesByFolder,
  groupFilesByType,
  sortFiles,
} from "@/lib/utils/workspace-helpers";

/**
 * Mobile layout for workspace
 * Bottom sheet filters, compact grid, mobile-optimized spacing
 */

interface MobileLayoutProps {
  files: File[];
  folders: Folder[];
  folderCounts: Map<string, FolderCounts>;
  groupBy: GroupBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
  filterEmail: string | null;
  currentFolderId: string | null;
  onNavigateFolder: (folderId: string | null) => void;
  onSearchClick: () => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
  onRenameFolder: (folder: Folder) => void;
  onMoveFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onDownloadFolder: (folder: Folder) => void;
  onShareFolder: (folder: Folder) => void;
  onLinkToExisting: (folder: Folder) => void;
  onCopyLinkUrl: (folder: Folder) => void;
  onViewLinkDetails: (folder: Folder) => void;
  onUnlinkFolder: (folder: Folder) => void;
  onPreviewFile: (file: File) => void;
  onDownloadFile: (file: File) => void;
  onMoveFile: (file: File) => void;
  onDeleteFile: (file: File) => void;
  selectedFiles: Set<string>;
  onSelectFile: (fileId: string) => void;
  selectedFolders: Set<string>;
  onSelectFolder: (folderId: string) => void;
  isSelectMode: boolean;
  onClearSelection: () => void;
  onBulkDownload: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
  enableFileSelectMode?: () => void;
  isFileSelectMode?: boolean;
  enableFolderSelectMode?: () => void;
  isFolderSelectMode?: boolean;
  // Drag-to-upload handlers (OS files)
  onDragEnter?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function MobileLayout({
  files,
  folders,
  folderCounts,
  groupBy,
  sortBy,
  sortOrder,
  filterEmail,
  currentFolderId,
  onNavigateFolder,
  onSearchClick,
  onCreateFolder,
  onUploadFiles,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onDownloadFolder,
  onShareFolder,
  onLinkToExisting,
  onCopyLinkUrl,
  onViewLinkDetails,
  onUnlinkFolder,
  onPreviewFile,
  onDownloadFile,
  onMoveFile,
  onDeleteFile,
  selectedFiles,
  onSelectFile,
  selectedFolders,
  onSelectFolder,
  isSelectMode,
  onClearSelection,
  onBulkDownload,
  onBulkMove,
  onBulkDelete,
  enableFileSelectMode,
  isFileSelectMode = false,
  enableFolderSelectMode,
  isFolderSelectMode = false,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
}: MobileLayoutProps) {
  // Apply email filter to files
  const filteredFiles = React.useMemo(() => {
    if (filterEmail) {
      return files.filter((file) => file.uploaderEmail === filterEmail);
    }
    return files;
  }, [files, filterEmail]);

  // Sort files using existing utility
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

  // Handle background clicks to clear selection
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only clear if clicking outside of cards and buttons
    const target = e.target as HTMLElement;

    // Check if click is NOT on a card or button
    if (!target.closest('article') && !target.closest('button')) {
      if (isSelectMode) {
        onClearSelection();
      }
    }
  };

  return (
    <div
      className="relative min-h-screen pb-32"
      onClick={handleBackgroundClick}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="space-y-4 p-4">
        {/* Header with breadcrumb and search */}
        <WorkspaceHeader
          currentFolderId={currentFolderId}
          onNavigate={onNavigateFolder}
          onSearchClick={onSearchClick}
        />

        {/* Mobile toolbar: Filter sheet + Action buttons */}
        <div className="flex items-center justify-between gap-3">
          <FilterBottomSheet />
          <div className="flex items-center gap-2">
            <Button onClick={onUploadFiles} size="sm" className="gap-2">
              <Upload className="size-4" />
              Upload
            </Button>
            <Button onClick={onCreateFolder} size="sm" variant="outline" className="gap-2">
              <FolderPlus className="size-4" />
              New
            </Button>
          </div>
        </div>

        {/* Main content area */}
        {groupedFiles ? (
          <GroupedFileList
            groups={groupedFiles}
            groupBy={groupBy}
            onPreviewFile={onPreviewFile}
            onDownloadFile={onDownloadFile}
            onMoveFile={onMoveFile}
            onDeleteFile={onDeleteFile}
            selectedFiles={selectedFiles}
            onSelectFile={onSelectFile}
            showCheckboxes={isSelectMode}
          />
        ) : (
          <FileGrid
            folders={folders}
            files={sortedFiles}
            folderCounts={folderCounts}
            currentFolderId={currentFolderId}
            onNavigate={onNavigateFolder}
            onRenameFolder={onRenameFolder}
            onMoveFolder={onMoveFolder}
            onDeleteFolder={onDeleteFolder}
            onDownloadFolder={onDownloadFolder}
            onShareFolder={onShareFolder}
            onLinkToExisting={onLinkToExisting}
            onCopyLinkUrl={onCopyLinkUrl}
            onViewLinkDetails={onViewLinkDetails}
            onUnlinkFolder={onUnlinkFolder}
            onPreviewFile={onPreviewFile}
            onDownloadFile={onDownloadFile}
            onMoveFile={onMoveFile}
            onDeleteFile={onDeleteFile}
            selectedFolders={selectedFolders}
            onSelectFolder={onSelectFolder}
            selectedFiles={selectedFiles}
            onSelectFile={onSelectFile}
            showCheckboxes={isSelectMode}
            enableFileSelectMode={enableFileSelectMode}
            isFileSelectMode={isFileSelectMode}
            enableFolderSelectMode={enableFolderSelectMode}
            isFolderSelectMode={isFolderSelectMode}
          />
        )}
      </div>

      {/* Selection toolbar (fixed bottom) */}
      {selectedCount > 0 && (
        <SelectionToolbar
          selectedCount={selectedCount}
          onClear={onClearSelection}
          onDownload={onBulkDownload}
          onMove={onBulkMove}
          onDelete={onBulkDelete}
          hasFolders={hasFolders}
          hasFiles={hasFiles}
        />
      )}
    </div>
  );
}
