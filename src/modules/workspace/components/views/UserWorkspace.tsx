"use client";

import * as React from "react";
import { useWorkspaceFiles, useRootFolders, useModalState } from "@/hooks";
import { useWorkspaceFilters } from "../../hooks/use-workspace-filters";
import { useFolderNavigation } from "../../hooks/use-folder-navigation";
import { useFileSelection } from "../../hooks/use-file-selection";
import { useFolderSelection } from "../../hooks/use-folder-selection";
import { WorkspaceSkeleton } from "../ui/WorkspaceSkeleton";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./layouts/MobileLayout";
import {
  FilePreviewModal,
  CreateFolderModal,
  RenameFolderModal,
  MoveFolderModal,
  DeleteConfirmModal,
} from "../modals";
import type { File, Folder } from "@/lib/database/schemas";
import { deleteFolderAction, deleteFileAction } from "@/lib/actions";
import { toast } from "sonner";

/**
 * User Workspace view
 * Main workspace component that handles data fetching and delegates to desktop/mobile layouts
 *
 * Architecture:
 * - Fetches workspace data (files, folders)
 * - Manages global state (filters, navigation, selection)
 * - Handles all business logic and actions
 * - Delegates presentation to DesktopLayout/MobileLayout
 */
export function UserWorkspace() {
  const [isMobile, setIsMobile] = React.useState(false);

  // Data fetching
  const { data: files = [], isLoading: isLoadingFiles } = useWorkspaceFiles();
  const { data: folders = [], isLoading: isLoadingFolders } = useRootFolders();

  // State management
  const { groupBy, sortBy, sortOrder, filterEmail, searchQuery } = useWorkspaceFilters();
  const folderNavigation = useFolderNavigation();
  const fileSelection = useFileSelection();
  const folderSelection = useFolderSelection();

  // Modal state
  const filePreviewModal = useModalState<File>();
  const createFolderModal = useModalState<void>();
  const renameFolderModal = useModalState<Folder>();
  const moveFolderModal = useModalState<Folder>();
  const deleteFolderModal = useModalState<{ id: string; name: string }>();
  const deleteFileModal = useModalState<{ id: string; name: string }>();

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Action handlers
  const handleCreateFolder = () => {
    createFolderModal.open(undefined);
  };

  const handleRenameFolder = (folder: Folder) => {
    renameFolderModal.open(folder);
  };

  const handleMoveFolder = (folder: Folder) => {
    moveFolderModal.open(folder);
  };

  const handleDeleteFolder = (folder: Folder) => {
    deleteFolderModal.open({ id: folder.id, name: folder.name });
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderModal.data) return;

    const result = await deleteFolderAction({ folderId: deleteFolderModal.data.id });
    if (result.success) {
      toast.success("Folder deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete folder");
    }
  };

  const handlePreviewFile = (file: File) => {
    filePreviewModal.open(file);
  };

  const handleDownloadFile = (file: File) => {
    // TODO: Implement file download
    toast.info("Download feature coming soon");
  };

  const handleDeleteFile = (file: File) => {
    deleteFileModal.open({ id: file.id, name: file.filename });
  };

  const handleDeleteFileConfirm = async () => {
    if (!deleteFileModal.data) return;

    const result = await deleteFileAction({ fileId: deleteFileModal.data.id });
    if (result.success) {
      toast.success("File deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete file");
    }
  };

  const handleBulkDownload = () => {
    // TODO: Implement bulk download
    toast.info("Bulk download feature coming soon");
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete modal
    toast.info("Bulk delete feature coming soon");
  };

  // Loading state
  if (isLoadingFiles || isLoadingFolders) {
    return <WorkspaceSkeleton />;
  }

  // Common props for both layouts
  const layoutProps = {
    files,
    folders,
    groupBy,
    sortBy,
    sortOrder,
    filterEmail,
    searchQuery,
    currentFolderId: folderNavigation.currentFolderId,
    onNavigateFolder: folderNavigation.navigateToFolder,
    onCreateFolder: handleCreateFolder,
    onRenameFolder: handleRenameFolder,
    onMoveFolder: handleMoveFolder,
    onDeleteFolder: handleDeleteFolder,
    onPreviewFile: handlePreviewFile,
    onDownloadFile: handleDownloadFile,
    onDeleteFile: handleDeleteFile,
    selectedFiles: fileSelection.selectedFiles,
    onSelectFile: fileSelection.toggleFile,
    selectedFolders: folderSelection.selectedFolders,
    onSelectFolder: folderSelection.toggleFolder,
    isSelectMode: fileSelection.isSelectMode || folderSelection.isSelectMode,
    onClearSelection: () => {
      fileSelection.clearSelection();
      folderSelection.clearSelection();
    },
    onBulkDownload: handleBulkDownload,
    onBulkDelete: handleBulkDelete,
  };

  return (
    <>
      {/* Render appropriate layout */}
      {isMobile ? <MobileLayout {...layoutProps} /> : <DesktopLayout {...layoutProps} />}

      {/* Modals - Always render */}
      <FilePreviewModal
        file={filePreviewModal.data}
        isOpen={filePreviewModal.isOpen}
        onOpenChange={(open) => !open && filePreviewModal.close()}
        onDownload={
          filePreviewModal.data
            ? () => handleDownloadFile(filePreviewModal.data!)
            : undefined
        }
        onDelete={
          filePreviewModal.data
            ? () => {
                handleDeleteFile(filePreviewModal.data!);
                filePreviewModal.close();
              }
            : undefined
        }
      />
      <CreateFolderModal
        isOpen={createFolderModal.isOpen}
        onOpenChange={(open) => !open && createFolderModal.close()}
        parentFolderId={folderNavigation.currentFolderId}
      />
      <RenameFolderModal
        folder={renameFolderModal.data}
        isOpen={renameFolderModal.isOpen}
        onOpenChange={(open) => !open && renameFolderModal.close()}
      />
      <MoveFolderModal
        folder={moveFolderModal.data}
        isOpen={moveFolderModal.isOpen}
        onOpenChange={(open) => !open && moveFolderModal.close()}
      />
      <DeleteConfirmModal
        isOpen={deleteFolderModal.isOpen}
        onOpenChange={(open) => !open && deleteFolderModal.close()}
        onConfirm={handleDeleteFolderConfirm}
        title="Delete folder"
        description="Are you sure you want to delete this folder? All files and subfolders will be permanently deleted."
        resourceName={deleteFolderModal.data?.name}
      />
      <DeleteConfirmModal
        isOpen={deleteFileModal.isOpen}
        onOpenChange={(open) => !open && deleteFileModal.close()}
        onConfirm={handleDeleteFileConfirm}
        title="Delete file"
        description="Are you sure you want to delete this file?"
        resourceName={deleteFileModal.data?.name}
      />
    </>
  );
}
