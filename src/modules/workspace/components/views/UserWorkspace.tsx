"use client";

import * as React from "react";
import { useFilesByFolder, useFoldersByParent, useWorkspaceFolders, useFolderNavigation, useModalState, useUserWorkspace, useKeyboardShortcut, useWorkspaceFiles, useResponsiveDetection, useBulkDownloadMixed, useMoveMixed, useDeleteMixed, useDndState } from "@/hooks";
import { useWorkspaceFilters } from "../../hooks/use-workspace-filters";
import { useFileSelection } from "../../hooks/use-file-selection";
import { useFolderSelection } from "../../hooks/use-folder-selection";
import { useFileDragDrop } from "../../hooks/use-file-drag-drop";
import { useFolderDragDrop } from "../../hooks/use-folder-drag-drop";
import { useDragToUpload } from "../../hooks/use-drag-to-upload";
import { computeFolderCounts } from "@/lib/utils/workspace-helpers";
import { WorkspaceSkeleton, DragToUploadOverlay } from "../ui";
import { DesktopLayout } from "./layouts/DesktopLayout";
import { MobileLayout } from "./layouts/MobileLayout";
import {
  useDndMonitor,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  FilePreviewModal,
  CreateFolderModal,
  RenameFolderModal,
  MoveFolderModal,
  MoveFileModal,
  BulkMoveModal,
  BulkDeleteModal,
  DeleteConfirmModal,
  ShareFolderModal,
  LinkFolderToExistingModal,
  ViewFolderLinkDetailsModal,
  UnlinkFolderConfirmModal,
  UploadFilesModal,
  SearchModal,
} from "../modals";
import type { File, Folder, Link } from "@/lib/database/schemas";
import { deleteFolderAction, deleteFileAction, getLinkByIdAction, getFileSignedUrlAction, downloadFolderAction } from "@/lib/actions";
import { VALIDATION_LIMITS } from "@/lib/constants/validation";

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
  // Responsive detection
  const { isMobile } = useResponsiveDetection();

  // Data fetching
  const { data: workspace, isLoading: isLoadingWorkspace } = useUserWorkspace();

  // State management
  const { groupBy, sortBy, sortOrder, filterEmail } = useWorkspaceFilters();
  const folderNavigation = useFolderNavigation();

  // Folder-based data fetching (uses currentFolderId from navigation)
  const { data: files = [], isLoading: isLoadingFiles } = useFilesByFolder(folderNavigation.currentFolderId);
  const { data: folders = [], isLoading: isLoadingFolders } = useFoldersByParent(folderNavigation.currentFolderId);

  // Fetch ALL workspace data for folder count computation
  const { data: allWorkspaceFiles = [] } = useWorkspaceFiles();
  const { data: allWorkspaceFolders = [] } = useWorkspaceFolders();

  const fileSelection = useFileSelection();
  const folderSelection = useFolderSelection();

  // Bulk operations mutations
  const bulkDownloadMixed = useBulkDownloadMixed();
  const moveMixed = useMoveMixed();
  const deleteMixed = useDeleteMixed();

  // Drag-and-drop handlers (with multi-select support)
  const { handleFileDragEnd } = useFileDragDrop({
    fileSelection,
    folderSelection,
    onMultiMoveSuccess: () => {
      fileSelection.clearSelection();
      folderSelection.clearSelection();
    },
  });
  const { handleFolderDragEnd } = useFolderDragDrop({
    fileSelection,
    folderSelection,
    onMultiMoveSuccess: () => {
      fileSelection.clearSelection();
      folderSelection.clearSelection();
    },
  });

  // Global DnD state for drag overlay
  const { setActive, clearActive } = useDndState();

  // Drag-to-upload (OS files) handler
  const dragToUpload = useDragToUpload({
    currentFolderId: folderNavigation.currentFolderId,
    workspaceId: workspace?.id || '',
  });

  // Drag start handler: Track multi-select state for overlay
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;
    const activeType = activeData?.type;
    const activeId = active.id as string;

    // Determine if this is a multi-select drag
    let dragCount = 1;
    let fileCount = 0;
    let folderCount = 0;

    if (activeType === 'file' && fileSelection.isFileSelected(activeId)) {
      // Dragging a selected file - count all selected items
      fileCount = fileSelection.selectedCount;
      folderCount = folderSelection.selectedCount;
      dragCount = fileCount + folderCount;
    } else if (activeType === 'folder' && folderSelection.isFolderSelected(activeId)) {
      // Dragging a selected folder - count all selected items
      fileCount = fileSelection.selectedCount;
      folderCount = folderSelection.selectedCount;
      dragCount = fileCount + folderCount;
    } else {
      // Single item drag
      if (activeType === 'file') {
        fileCount = 1;
      } else if (activeType === 'folder') {
        folderCount = 1;
      }
    }

    // Update global DnD state with multi-select data
    setActive(
      activeId,
      activeType as 'file' | 'folder',
      {
        ...activeData,
        dragCount,
        fileCount,
        folderCount,
      }
    );
  };

  // Note: Transform sync is handled directly in the card components
  // using the primary dragged item's transform from useDraggable()

  // Combined drag end handler (delegates to file or folder handler based on type)
  const handleDragEnd = async (event: DragEndEvent) => {
    // Clear drag state IMMEDIATELY to reset visual feedback
    // This ensures opacity returns to normal right away
    clearActive();

    // Then handle the actual drop logic (async operations)
    const activeType = event.active.data.current?.type;

    if (activeType === 'file') {
      await handleFileDragEnd(event);
    } else if (activeType === 'folder') {
      await handleFolderDragEnd(event);
    }
  };

  // Listen to global drag events with module-specific handlers
  useDndMonitor({
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  });

  // Modal state
  const searchModal = useModalState<void>();
  const filePreviewModal = useModalState<File>();
  const createFolderModal = useModalState<void>();
  const renameFolderModal = useModalState<Folder>();
  const moveFolderModal = useModalState<Folder>();
  const moveFileModal = useModalState<File>();
  const bulkMoveModal = useModalState<{ fileIds: string[]; folderIds: string[] }>();
  const bulkDeleteModal = useModalState<{ files: File[]; folders: Folder[] }>();
  const deleteFolderModal = useModalState<{ id: string; name: string }>();
  const deleteFileModal = useModalState<{ id: string; name: string }>();
  const uploadFilesModal = useModalState<void>();

  // Folder-link modal state
  const shareFolderModal = useModalState<Folder>();
  const linkToExistingModal = useModalState<Folder>();
  const viewLinkDetailsModal = useModalState<{ folder: Folder; link: Link }>();
  const unlinkFolderModal = useModalState<Folder>();

  // Keyboard shortcut: CMD+K (Mac) / CTRL+K (Windows/Linux)
  useKeyboardShortcut('mod+k', () => {
    searchModal.open(undefined);
  });

  // Clear selections when navigating to a different folder
  // Note: Only depends on currentFolderId - we intentionally don't include clearSelection
  // in the dependency array to avoid unnecessary re-renders
  React.useEffect(() => {
    fileSelection.clearSelection();
    folderSelection.clearSelection();
    // eslint-disable-next-line
  }, [folderNavigation.currentFolderId]);

  // Keyboard shortcuts (desktop only)
  // CMD+A / CTRL+A - Select all files and folders
  useKeyboardShortcut(
    'mod+a',
    () => {
      const fileIds = files.map(f => f.id);
      const folderIds = folders.map(f => f.id);

      if (fileIds.length > 0) {
        fileSelection.selectAll(fileIds);
      }
      if (folderIds.length > 0) {
        folderSelection.selectAll(folderIds);
      }
    },
    { enabled: !isMobile && (files.length > 0 || folders.length > 0) }
  );

  // Delete key - Open bulk delete modal if items selected
  useKeyboardShortcut(
    'Delete',
    () => {
      const selectedFileIds = Array.from(fileSelection.selectedFiles);
      const selectedFolderIds = Array.from(folderSelection.selectedFolders);
      const hasSelection = selectedFileIds.length > 0 || selectedFolderIds.length > 0;

      if (hasSelection) {
        const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
        const selectedFolders = folders.filter(f => selectedFolderIds.includes(f.id));
        bulkDeleteModal.open({ files: selectedFiles, folders: selectedFolders });
      }
    },
    {
      enabled: !isMobile && (fileSelection.selectedCount > 0 || folderSelection.selectedCount > 0)
    }
  );

  // Escape key - Clear selection
  useKeyboardShortcut(
    'Escape',
    () => {
      fileSelection.clearSelection();
      folderSelection.clearSelection();
    },
    {
      enabled: !isMobile && (fileSelection.isSelectMode || folderSelection.isSelectMode),
      preventDefault: false // Allow Escape to work for modals too
    }
  );

  // Action handlers
  const handleSearchClick = () => {
    searchModal.open(undefined);
  };

  const handleCreateFolder = () => {
    createFolderModal.open(undefined);
  };

  const handleUploadFiles = () => {
    uploadFilesModal.open(undefined);
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

  const handleDownloadFile = async (file: File) => {
    // Get signed URL for file download
    const result = await getFileSignedUrlAction({ fileId: file.id });

    if (result.success && result.data) {
      // Trigger browser download using signed URL
      const link = document.createElement('a');
      link.href = result.data;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("File download started:", file.filename);
    } else {
      console.error("Failed to download file:", result.error);
    }
  };

  const handleMoveFile = (file: File) => {
    moveFileModal.open(file);
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

  const handleBulkDownload = async () => {
    const selectedFileIds = Array.from(fileSelection.selectedFiles);
    const selectedFolderIds = Array.from(folderSelection.selectedFolders);

    // Optimization: Single file download without ZIP wrapper
    if (selectedFileIds.length === 1 && selectedFolderIds.length === 0) {
      try {
        const result = await getFileSignedUrlAction({ fileId: selectedFileIds[0] });

        if (result.success && result.data) {
          // Find file metadata for better filename
          const file = files.find(f => f.id === selectedFileIds[0]);
          const filename = file?.filename || 'download';

          // Direct download via signed URL
          const link = document.createElement('a');
          link.href = result.data;
          link.download = filename;
          link.target = '_blank'; // Open in new tab if download fails
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clear selections after successful download
          fileSelection.clearSelection();
          folderSelection.clearSelection();

          console.log("Single file download completed:", filename);
        } else {
          console.error("Failed to get signed URL:", result.error);
        }
      } catch (error) {
        console.error("Single file download failed:", error);
      }
      return;
    }

    // Multiple items: Use ZIP download (existing logic)
    bulkDownloadMixed.mutate(
      {
        fileIds: selectedFileIds,
        folderIds: selectedFolderIds,
      },
      {
        onSuccess: (zipData) => {
          // Convert number array to Blob
          const uint8Array = new Uint8Array(zipData);
          const blob = new Blob([uint8Array], { type: 'application/zip' });

          // Trigger browser download
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `download-${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          // Clear selections after successful download
          fileSelection.clearSelection();
          folderSelection.clearSelection();

          console.log("Bulk download completed:", selectedFileIds.length, "files,", selectedFolderIds.length, "folders");
        },
      }
    );
  };

  const handleDownloadFolder = async (folder: Folder) => {
    // Create ZIP archive of folder and all contents
    const result = await downloadFolderAction({ folderId: folder.id });

    if (result.success && result.data) {
      // Convert Buffer to Uint8Array for Blob constructor
      const uint8Array = new Uint8Array(result.data);
      const blob = new Blob([uint8Array], { type: 'application/zip' });

      // Trigger browser download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${folder.name}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL
      URL.revokeObjectURL(link.href);

      console.log("Folder download completed:", folder.name);
    } else {
      console.error("Failed to download folder:", result.error);
    }
  };

  const handleBulkMove = () => {
    const selectedFileIds = Array.from(fileSelection.selectedFiles);
    const selectedFolderIds = Array.from(folderSelection.selectedFolders);

    // Open bulk move modal with selected IDs
    bulkMoveModal.open({ fileIds: selectedFileIds, folderIds: selectedFolderIds });
  };

  const handleBulkDelete = () => {
    const selectedFileIds = Array.from(fileSelection.selectedFiles);
    const selectedFolderIds = Array.from(folderSelection.selectedFolders);

    // Get full file and folder objects for modal display
    const selectedFiles = files.filter(f => selectedFileIds.includes(f.id));
    const selectedFolders = folders.filter(f => selectedFolderIds.includes(f.id));

    // Open bulk delete confirmation modal
    bulkDeleteModal.open({ files: selectedFiles, folders: selectedFolders });
  };

  const handleBulkDeleteConfirm = async () => {
    if (!bulkDeleteModal.data) return;

    const selectedFileIds = bulkDeleteModal.data.files.map(f => f.id);
    const selectedFolderIds = bulkDeleteModal.data.folders.map(f => f.id);

    const result = await deleteMixed.mutateAsync({
      fileIds: selectedFileIds,
      folderIds: selectedFolderIds,
    });

    // Clear selections after successful deletion
    fileSelection.clearSelection();
    folderSelection.clearSelection();

    console.log(
      `Deleted ${result.deletedFileCount} files and ${result.deletedFolderCount} folders`
    );
    // TODO: Add success notification when notification system is implemented
    // toast.success(`Deleted ${result.deletedFileCount} files and ${result.deletedFolderCount} folders`);
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

      // Workspace includes user.username from getUserWorkspace query (WorkspaceWithUser type)
      if (!workspace?.user?.username) {
        console.error("Cannot copy link: workspace missing user.username");
        // TODO: Add error notification when notification system is implemented
        // toast.error("Failed to generate link URL. Please try again.");
        return;
      }

      // Generate full URL with username: origin/username/slug
      const url = `${window.location.origin}/${workspace.user.username}/${result.data.slug}`;
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

  // Compute folder counts from ALL workspace files and folders
  const folderCounts = React.useMemo(
    () => computeFolderCounts(allWorkspaceFiles, allWorkspaceFolders),
    [allWorkspaceFiles, allWorkspaceFolders]
  );

  // Get current folder name for drag-to-upload overlay
  const currentFolderName = React.useMemo(() => {
    if (!folderNavigation.currentFolderId) {
      return "Root";
    }
    const currentFolder = allWorkspaceFolders.find(
      (f) => f.id === folderNavigation.currentFolderId
    );
    return currentFolder?.name || "Root";
  }, [folderNavigation.currentFolderId, allWorkspaceFolders]);

  // Calculate max file size in MB from validation limits
  const maxFileSizeMB = VALIDATION_LIMITS.FILE.MAX_SIZE_BYTES / (1024 * 1024);

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
    folderCounts, // Add folder counts for display
    groupBy,
    sortBy,
    sortOrder,
    filterEmail,
    currentFolderId: folderNavigation.currentFolderId,
    onNavigateFolder: folderNavigation.navigateToFolder,
    onSearchClick: handleSearchClick,
    onCreateFolder: handleCreateFolder,
    onUploadFiles: handleUploadFiles,
    onRenameFolder: handleRenameFolder,
    onMoveFolder: handleMoveFolder,
    onDeleteFolder: handleDeleteFolder,
    onDownloadFolder: handleDownloadFolder,
    onShareFolder: handleShareFolder,
    onLinkToExisting: handleLinkToExisting,
    onCopyLinkUrl: handleCopyLinkUrl,
    onViewLinkDetails: handleViewLinkDetails,
    onUnlinkFolder: handleUnlinkFolder,
    onPreviewFile: handlePreviewFile,
    onDownloadFile: handleDownloadFile,
    onMoveFile: handleMoveFile,
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
    onBulkMove: handleBulkMove,
    onBulkDelete: handleBulkDelete,
    enableFileSelectMode: fileSelection.enableSelectMode,
    isFileSelectMode: fileSelection.isSelectMode,
    enableFolderSelectMode: folderSelection.enableSelectMode,
    isFolderSelectMode: folderSelection.isSelectMode,
    // Drag-to-upload handlers (OS files)
    onDragEnter: dragToUpload.handleDragEnter,
    onDragOver: dragToUpload.handleDragOver,
    onDragLeave: dragToUpload.handleDragLeave,
    onDrop: dragToUpload.handleDrop,
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
      <MoveFileModal
        file={moveFileModal.data}
        isOpen={moveFileModal.isOpen}
        onOpenChange={(open) => !open && moveFileModal.close()}
      />
      <BulkMoveModal
        data={bulkMoveModal.data}
        isOpen={bulkMoveModal.isOpen}
        onOpenChange={(open) => !open && bulkMoveModal.close()}
        currentFolderId={folderNavigation.currentFolderId}
        onSuccess={() => {
          // Clear selections after successful move
          fileSelection.clearSelection();
          folderSelection.clearSelection();
        }}
      />
      <BulkDeleteModal
        data={bulkDeleteModal.data}
        isOpen={bulkDeleteModal.isOpen}
        onOpenChange={(open) => !open && bulkDeleteModal.close()}
        onConfirm={handleBulkDeleteConfirm}
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

      {/* Upload modal */}
      <UploadFilesModal
        isOpen={uploadFilesModal.isOpen}
        onOpenChange={(open) => !open && uploadFilesModal.close()}
        currentFolderId={folderNavigation.currentFolderId}
      />

      {/* Search modal */}
      <SearchModal
        isOpen={searchModal.isOpen}
        onOpenChange={(open) => !open && searchModal.close()}
        onFileSelect={(file) => {
          handlePreviewFile(file);
        }}
        onLocateFile={(file) => {
          // Navigate to the file's parent folder (or root if no parent)
          folderNavigation.navigateToFolder(file.parentFolderId);
          searchModal.close();
        }}
        onFolderSelect={(folder) => {
          folderNavigation.navigateToFolder(folder.id);
        }}
        currentFolderId={folderNavigation.currentFolderId}
      />

      {/* Drag-to-upload overlay (OS files) */}
      <DragToUploadOverlay
        isVisible={dragToUpload.isDragging}
        currentFolderName={currentFolderName}
        maxSizeMB={maxFileSizeMB}
        hasError={dragToUpload.hasError}
      />
    </>
  );
}
