"use client";

import * as React from "react";
import { useWorkspaceFiles, useRootFolders, useModalState, useUserWorkspace } from "@/hooks";
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
  ShareFolderModal,
  LinkFolderToExistingModal,
  ViewFolderLinkDetailsModal,
  UnlinkFolderConfirmModal,
} from "../modals";
import type { File, Folder, Link } from "@/lib/database/schemas";
import { deleteFolderAction, deleteFileAction, getLinkByIdAction } from "@/lib/actions";

/**
 * User Workspace view
 * Main workspace component that handles data fetching and delegates to desktop/mobile layouts
 *
 * Architecture:
 * - Fetches workspace data (files, folders, user)
 * - Manages global state (filters, navigation, selection)
 * - Handles all business logic and actions
 * - Delegates presentation to DesktopLayout/MobileLayout
 */
export function UserWorkspace() {
  const [isMobile, setIsMobile] = React.useState(false);

  // Data fetching
  const { data: workspace, isLoading: isLoadingWorkspace } = useUserWorkspace();
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

  // Folder-link modal state
  const shareFolderModal = useModalState<Folder>();
  const linkToExistingModal = useModalState<Folder>();
  const viewLinkDetailsModal = useModalState<{ folder: Folder; link: Link }>();
  const unlinkFolderModal = useModalState<Folder>();

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
      // TODO: Add success notification when notification system is implemented
      // toast.success("Folder deleted successfully");
      console.log("Folder deleted successfully");
    } else {
      // TODO: Add error notification when notification system is implemented
      // toast.error(result.error || "Failed to delete folder");
      console.error("Failed to delete folder:", result.error);
    }
  };

  const handlePreviewFile = (file: File) => {
    filePreviewModal.open(file);
  };

  const handleDownloadFile = (file: File) => {
    // TODO: Implement file download
    // TODO: Add info notification when notification system is implemented
    // toast.info("Download feature coming soon");
    console.log("Download feature coming soon");
  };

  const handleDeleteFile = (file: File) => {
    deleteFileModal.open({ id: file.id, name: file.filename });
  };

  const handleDeleteFileConfirm = async () => {
    if (!deleteFileModal.data) return;

    const result = await deleteFileAction({ fileId: deleteFileModal.data.id });
    if (result.success) {
      // TODO: Add success notification when notification system is implemented
      // toast.success("File deleted successfully");
      console.log("File deleted successfully");
    } else {
      // TODO: Add error notification when notification system is implemented
      // toast.error(result.error || "Failed to delete file");
      console.error("Failed to delete file:", result.error);
    }
  };

  const handleBulkDownload = () => {
    // TODO: Implement bulk download
    // TODO: Add info notification when notification system is implemented
    // toast.info("Bulk download feature coming soon");
    console.log("Bulk download feature coming soon");
  };

  const handleBulkDelete = () => {
    // TODO: Implement bulk delete modal
    // TODO: Add info notification when notification system is implemented
    // toast.info("Bulk delete feature coming soon");
    console.log("Bulk delete feature coming soon");
  };

  // Folder-link handlers
  const handleShareFolder = (folder: Folder) => {
    shareFolderModal.open(folder);
  };

  const handleLinkToExisting = (folder: Folder) => {
    linkToExistingModal.open(folder);
  };

  const handleCopyLinkUrl = async (folder: Folder) => {
    if (!folder.linkId) {
      console.error("Cannot copy link: folder has no linkId");
      // TODO: Add error notification when notification system is implemented
      // toast.error("This folder is not linked to a shareable link");
      return;
    }

    try {
      // Fetch link to get slug and username via workspace relation
      const result = await getLinkByIdAction({ linkId: folder.linkId });

      if (!result.success || !result.data) {
        console.error("Failed to fetch link details:", result.error);
        // TODO: Add error notification when notification system is implemented
        // toast.error("Failed to fetch link details. Please try again.");
        return;
      }

      // Extract username from link.workspace.user.username (from getLinkById query)
      const username = (result.data as any).workspace?.user?.username;
      if (!username) {
        console.error("Cannot copy link: link missing workspace.user.username relation");
        // TODO: Add error notification when notification system is implemented
        // toast.error("Failed to generate link URL. Please try again.");
        return;
      }

      // Generate full URL with username: origin/username/slug
      const url = `${window.location.origin}/${username}/${result.data.slug}`;
      await navigator.clipboard.writeText(url);

      console.log("Link copied to clipboard:", url);
      // TODO: Add success notification when notification system is implemented
      // toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Unexpected error in handleCopyLinkUrl:", error);
      // TODO: Add error notification when notification system is implemented
      // toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleViewLinkDetails = async (folder: Folder) => {
    if (!folder.linkId) {
      console.error("Cannot view link details: folder has no linkId");
      // TODO: Add error notification when notification system is implemented
      // toast.error("This folder is not linked to a shareable link");
      return;
    }

    try {
      // Fetch link data before opening modal
      const result = await getLinkByIdAction({ linkId: folder.linkId });

      if (!result.success || !result.data) {
        console.error("Failed to fetch link details:", result.error);
        // TODO: Add error notification when notification system is implemented
        // toast.error("Failed to fetch link details. Please try again.");
        return;
      }

      // Open modal with both folder and link data
      viewLinkDetailsModal.open({ folder, link: result.data });
    } catch (error) {
      console.error("Unexpected error in handleViewLinkDetails:", error);
      // TODO: Add error notification when notification system is implemented
      // toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const handleUnlinkFolder = (folder: Folder) => {
    unlinkFolderModal.open(folder);
  };

  // Loading state
  if (isLoadingWorkspace || isLoadingFiles || isLoadingFolders) {
    return <WorkspaceSkeleton />;
  }

  // If workspace not found (shouldn't happen if auth works), show error
  if (!workspace) {
    return <div>Workspace not found. Please complete onboarding.</div>;
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
    onShareFolder: handleShareFolder,
    onLinkToExisting: handleLinkToExisting,
    onCopyLinkUrl: handleCopyLinkUrl,
    onViewLinkDetails: handleViewLinkDetails,
    onUnlinkFolder: handleUnlinkFolder,
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

      {/* Folder-link modals */}
      <ShareFolderModal
        folder={shareFolderModal.data}
        isOpen={shareFolderModal.isOpen}
        onOpenChange={(open: boolean) => !open && shareFolderModal.close()}
      />
      <LinkFolderToExistingModal
        folder={linkToExistingModal.data}
        isOpen={linkToExistingModal.isOpen}
        onOpenChange={(open: boolean) => !open && linkToExistingModal.close()}
      />
      <ViewFolderLinkDetailsModal
        data={viewLinkDetailsModal.data}
        isOpen={viewLinkDetailsModal.isOpen}
        onOpenChange={(open: boolean) => !open && viewLinkDetailsModal.close()}
      />
      <UnlinkFolderConfirmModal
        folder={unlinkFolderModal.data}
        isOpen={unlinkFolderModal.isOpen}
        onOpenChange={(open: boolean) => !open && unlinkFolderModal.close()}
      />
    </>
  );
}
