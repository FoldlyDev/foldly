"use client";

import type { File, Folder } from "@/lib/database/schemas";
import { FolderCard } from "../ui/FolderCard";
import { FileCard } from "../ui/FileCard";
import { EmptyFolderState } from "../ui/EmptyFolderState";
import { EmptyFilesState } from "../ui/EmptyFilesState";

/**
 * File grid section
 * Renders folders and files in responsive grid layout
 *
 * @example
 * ```tsx
 * <FileGrid
 *   folders={folders}
 *   files={files}
 *   onNavigate={handleNavigate}
 *   onFileSelect={handleFileSelect}
 * />
 * ```
 */
interface FileGridProps {
  /**
   * Folders to display
   */
  folders: Folder[];

  /**
   * Files to display
   */
  files: File[];

  /**
   * Callback when navigating to a folder
   */
  onNavigate: (folderId: string) => void;

  /**
   * Callback when renaming a folder
   */
  onRenameFolder?: (folder: Folder) => void;

  /**
   * Callback when moving a folder
   */
  onMoveFolder?: (folder: Folder) => void;

  /**
   * Callback when deleting a folder
   */
  onDeleteFolder?: (folder: Folder) => void;

  /**
   * Callback when downloading a folder as ZIP
   */
  onDownloadFolder?: (folder: Folder) => void;

  /**
   * Callback when sharing a folder (personal folder)
   */
  onShareFolder?: (folder: Folder) => void;

  /**
   * Callback when linking folder to existing link (personal folder)
   */
  onLinkToExisting?: (folder: Folder) => void;

  /**
   * Callback when copying link URL (linked folder)
   */
  onCopyLinkUrl?: (folder: Folder) => void;

  /**
   * Callback when viewing link details (linked folder)
   */
  onViewLinkDetails?: (folder: Folder) => void;

  /**
   * Callback when unlinking a folder (linked folder)
   */
  onUnlinkFolder?: (folder: Folder) => void;

  /**
   * Callback when previewing a file
   */
  onPreviewFile?: (file: File) => void;

  /**
   * Callback when downloading a file
   */
  onDownloadFile?: (file: File) => void;

  /**
   * Callback when deleting a file
   */
  onDeleteFile?: (file: File) => void;

  /**
   * Selected folder IDs
   */
  selectedFolders?: Set<string>;

  /**
   * Callback when selecting a folder
   */
  onSelectFolder?: (folderId: string) => void;

  /**
   * Selected file IDs
   */
  selectedFiles?: Set<string>;

  /**
   * Callback when selecting a file
   */
  onSelectFile?: (fileId: string) => void;

  /**
   * Whether to show selection checkboxes
   */
  showCheckboxes?: boolean;

  /**
   * Folder counts (file count, uploader count)
   */
  folderCounts?: Map<string, { fileCount: number; uploaderCount: number }>;

  /**
   * Current folder ID (null for root workspace)
   * Used to determine which empty state to show
   */
  currentFolderId?: string | null;
}

export function FileGrid({
  folders,
  files,
  onNavigate,
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
  onDeleteFile,
  selectedFolders = new Set(),
  onSelectFolder,
  selectedFiles = new Set(),
  onSelectFile,
  showCheckboxes = false,
  folderCounts = new Map(),
  currentFolderId = null,
}: FileGridProps) {
  const hasContent = folders.length > 0 || files.length > 0;

  // Empty state - context-aware
  if (!hasContent) {
    // Inside a specific folder - show folder empty state
    if (currentFolderId !== null) {
      return <EmptyFolderState />;
    }

    // Root workspace - show workspace empty state
    return <EmptyFilesState />;
  }

  return (
    <div className="space-y-8">
      {/* Folders Section */}
      {folders.length > 0 && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Folders ({folders.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => {
              const counts = folderCounts.get(folder.id) || {
                fileCount: 0,
                uploaderCount: 0,
              };

              return (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onNavigate={() => onNavigate(folder.id)}
                  onRename={onRenameFolder ? () => onRenameFolder(folder) : undefined}
                  onMove={onMoveFolder ? () => onMoveFolder(folder) : undefined}
                  onDelete={onDeleteFolder ? () => onDeleteFolder(folder) : undefined}
                  onDownload={onDownloadFolder ? () => onDownloadFolder(folder) : undefined}
                  onShareFolder={onShareFolder ? () => onShareFolder(folder) : undefined}
                  onLinkToExisting={onLinkToExisting ? () => onLinkToExisting(folder) : undefined}
                  onCopyLinkUrl={onCopyLinkUrl ? () => onCopyLinkUrl(folder) : undefined}
                  onViewLinkDetails={onViewLinkDetails ? () => onViewLinkDetails(folder) : undefined}
                  onUnlinkFolder={onUnlinkFolder ? () => onUnlinkFolder(folder) : undefined}
                  isSelected={selectedFolders.has(folder.id)}
                  onSelect={
                    onSelectFolder
                      ? () => onSelectFolder(folder.id)
                      : undefined
                  }
                  showCheckbox={showCheckboxes}
                  fileCount={counts.fileCount}
                  uploaderCount={counts.uploaderCount}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <section>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            Files ({files.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onPreview={onPreviewFile ? () => onPreviewFile(file) : undefined}
                onDownload={onDownloadFile ? () => onDownloadFile(file) : undefined}
                onDelete={onDeleteFile ? () => onDeleteFile(file) : undefined}
                isSelected={selectedFiles.has(file.id)}
                onSelect={
                  onSelectFile ? () => onSelectFile(file.id) : undefined
                }
                showCheckbox={showCheckboxes}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
