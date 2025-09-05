'use client';

import React, { useState, lazy, Suspense, useMemo } from 'react';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';

import { LinkUploadHeader } from '../sections/link-upload-header';
import { LinkUploadFooter } from '../sections/link-upload-footer';
import { LinkUploadToolbar } from '../sections/link-upload-toolbar';
import { OwnerRedirectMessage } from '../ui/owner-redirect-message';
import { LinkUploadSkeleton } from '../skeletons/link-upload-skeleton';
import { useLinkTreeData } from '../../hooks/use-link-data';
import { useLinkTreeInstanceManager } from '../../lib/managers/link-tree-instance-manager';
import {
  useContextMenuHandler,
  useDragDropHandler,
  useRenameHandler,
  useFolderCreationHandler,
} from '../../lib/handlers';
import { useExternalFileDropHandler } from '../../lib/handlers/external-file-drop-handler';
import { useLinkUploadStagingStore } from '../../stores/staging-store';
import { LinkUploadModal } from '../modals/upload-modal';
import { VerificationModal } from '../modals/verification-modal';
import { LinkUploadProgress } from '../ui/upload-progress';
import type { LinkWithStats } from '@/lib/database/types/links';
import { FadeTransitionWrapper } from '@/components/feedback';
import { useLinkFileUpload } from '../../hooks/use-link-file-upload';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

interface LinkUploadContainerProps {
  linkData: LinkWithStats;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
  // Fetch tree data
  const { data: treeData } = useLinkTreeData(
    linkData.id
  );

  // Check if user is owner (this should be passed from server)
  const isOwner = treeData?.isOwner || false;
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Delete modal state for context menu
  const [, setShowDeleteModal] = useState(false);
  const [, setItemsToDelete] = useState<any[]>([]);
  
  // Track uploader info for progress display
  const [currentUploaderName, setCurrentUploaderName] = useState<string>('');

  // Get staging store state and actions - also subscribe to staged items
  const {
    isUploadModalOpen,
    targetFolderId: modalTargetFolderId,
    closeUploadModal,
    isVerificationModalOpen,
    closeVerificationModal,
    stagedFiles,
    stagedFolders,
  } = useLinkUploadStagingStore();

  // Tree instance management
  const { treeInstance, treeIdRef, handleTreeReady } =
    useLinkTreeInstanceManager({
      linkId: linkData.id,
      isOwner,
    });

  // Folder creation handler (defined first so it can be passed to context menu)
  const { createFolder } = useFolderCreationHandler({
    treeInstance,
    linkId: linkData.id,
  });

  // External file drop handler for staging files
  const { droppedFiles, handleExternalFileDrop, clearDroppedFiles } =
    useExternalFileDropHandler({
      linkId: linkData.id,
    });

  // Context menu handler
  const { getMenuItems } = useContextMenuHandler({
    linkId: linkData.id,
    treeInstance,
    setItemsToDelete,
    setShowDeleteModal,
    createFolder, // Now provided by folder creation handler
  });

  // Drag-drop handler
  const { dropCallbacks } = useDragDropHandler({ treeInstance });

  // Rename handler
  const { renameCallback } = useRenameHandler({ treeInstance });
  
  // File upload hook
  const { uploadStagedFiles, isUploading, overallProgress } = useLinkFileUpload({ 
    linkId: linkData.id,
    sourceFolderId: linkData.sourceFolderId,
    onUploadComplete: () => {
      // Tree will be cleared automatically after successful upload
      // This is intended - external uploaders shouldn't see previous uploads
      closeVerificationModal();
    }
  });

  // Transform staged items to tree structure using the same utility as workspace
  const treeDataStructure = useMemo(() => {
    if (isOwner) return {};
    
    // Convert Maps to arrays and map to expected format
    const foldersArray = Array.from(stagedFolders.values()).map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentFolderId: folder.parentId,
      linkId: linkData.id,
      workspaceId: null,
      path: folder.path,
      depth: folder.depth,
      isArchived: folder.isArchived,
      sortOrder: folder.sortOrder,
      fileCount: folder.fileCount,
      totalSize: folder.totalSize,
      createdAt: folder.addedAt,
      updatedAt: folder.addedAt,
    }));
    
    const filesArray = Array.from(stagedFiles.values()).map((file) => ({
      id: file.id,
      fileName: file.name,
      originalName: file.name,
      folderId: file.parentId,
      linkId: linkData.id,
      workspaceId: null,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      extension: file.extension,
      thumbnailPath: file.thumbnailPath,
      processingStatus: file.processingStatus,
      sortOrder: file.sortOrder,
      storagePath: '',
      uploadedBy: null,
      createdAt: file.addedAt,
      updatedAt: file.addedAt,
    }));
    
    // Always use transformToTreeStructure - it will handle empty state correctly
    // Just like workspace does - pass empty arrays when there's no data
    return transformToTreeStructure(
      foldersArray as any,
      filesArray as any,
      { id: linkData.id, name: linkData.title || 'Upload Root' }
    );
  }, [linkData.id, linkData.title, isOwner, stagedFiles, stagedFolders, stagedFiles.size, stagedFolders.size]);

  const handleClearSelection = () => {
    // Clear local state
    setSelectedItems([]);
  };

  // Handle verification complete - send files to server
  const handleVerificationComplete = async (verificationData: {
    uploaderName: string;
    uploaderEmail?: string;
    password?: string;
  }) => {
    // Close modal immediately - uploads happen in background
    closeVerificationModal();
    
    // Track uploader name for progress display
    setCurrentUploaderName(verificationData.uploaderName);
    
    try {
      // Upload staged files using the upload hook
      const result = await uploadStagedFiles(
        verificationData.uploaderName,
        verificationData.uploaderEmail,
        verificationData.password
      );
      
      if (result.success) {
        console.log('Upload successful:', {
          uploadedCount: result.uploadedCount,
          batchId: result.batchId,
        });
        // Clear uploader name after successful upload
        setCurrentUploaderName('');
      } else {
        console.error('Upload failed:', result.error);
        // Clear uploader name on failure
        setCurrentUploaderName('');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentUploaderName('');
    }
  };

  // Apply brand theming with enhanced color palette
  React.useEffect(() => {
    const brandColor =
      linkData.branding?.enabled && linkData.branding?.color
        ? linkData.branding.color
        : '#3b82f6'; // Default blue if no brand color

    // Set CSS variables for brand theming
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brandColor);

    // Calculate complementary colors for a cohesive branded experience
    const hex = brandColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Lighter version for backgrounds (10% opacity)
    root.style.setProperty('--brand-primary-light', `${brandColor}1a`);
    // Medium version for hover states (20% opacity)
    root.style.setProperty('--brand-primary-medium', `${brandColor}33`);
    // Dark version for text on light backgrounds (90% opacity)
    root.style.setProperty('--brand-primary-dark', `${brandColor}e6`);
    // Extra light for subtle backgrounds (5% opacity)
    root.style.setProperty('--brand-primary-extra-light', `${brandColor}0d`);

    // Calculate luminance for contrast decisions
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    root.style.setProperty(
      '--brand-text-on-primary',
      luminance > 0.5 ? '#000000' : '#ffffff'
    );

    return () => {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-light');
      root.style.removeProperty('--brand-primary-medium');
      root.style.removeProperty('--brand-primary-dark');
      root.style.removeProperty('--brand-primary-extra-light');
      root.style.removeProperty('--brand-text-on-primary');
    };
  }, [linkData.branding?.enabled, linkData.branding?.color]);

  // Show owner redirect message if user owns this link
  if (isOwner) {
    return (
      <OwnerRedirectMessage
        linkTitle={linkData.title || linkData.slug}
        linkSlug={linkData.slug}
      />
    );
  }

  return (
    <div
      className='min-h-screen flex flex-col'
      style={{ background: 'var(--foldly-dark-gradient-radial)' }}
    >
      <LinkUploadHeader link={linkData} />

      <FadeTransitionWrapper
        isLoading={false}  // Public uploaders don't need to load tree data - they start with empty tree
        loadingComponent={<LinkUploadSkeleton />}
        duration={300}
        className='dashboard-container link-upload-layout'
      >
        <div className='link-upload-toolbar'>
          <LinkUploadToolbar
            treeInstance={treeInstance}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedItems={selectedItems}
            onClearSelection={handleClearSelection}
            selectionMode={selectionMode}
            onSelectionModeChange={setSelectionMode}
            onOpenUploadModal={() =>
              useLinkUploadStagingStore.getState().openUploadModal(null)
            }
            onOpenVerificationModal={() =>
              useLinkUploadStagingStore.getState().openVerificationModal()
            }
          />
        </div>

        {/* Main content area - File Tree or Upload Progress */}
        <div className='link-upload-tree-container mt-4 h-screen overflow-y-auto!'>
          <div className='flex gap-4 h-full'>
            <div className='link-upload-tree-wrapper flex-1'>
              <div className='link-upload-tree-content'>
                {isUploading ? (
                  // Show upload progress during upload
                  <div className='flex items-center justify-center min-h-[400px]'>
                    <LinkUploadProgress
                      isUploading={isUploading}
                      totalFiles={stagedFiles.size}
                      completedFiles={Math.floor((overallProgress / 100) * stagedFiles.size)}
                      failedFiles={0}
                      uploaderName={currentUploaderName}
                    />
                  </div>
                ) : (
                  // Show file tree when not uploading
                  <Suspense
                    fallback={
                      <div className='flex items-center justify-center h-64'>
                        <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                      </div>
                    }
                  >
                    {linkData.id && (
                      <FileTree
                        key={`file-tree-${linkData.id}`}  // Stable key to prevent unmounting
                        rootId={linkData.id}
                        treeId={treeIdRef.current}
                        initialData={treeDataStructure}
                        initialExpandedItems={[linkData.id]}
                        initialSelectedItems={selectedItems}
                        onTreeReady={handleTreeReady}
                        onSelectionChange={setSelectedItems}
                        showCheckboxes={selectionMode}
                        searchQuery={searchQuery}
                        onSearchChange={query => setSearchQuery(query)}
                        showFileSize={true}
                        showFileDate={false}
                        showFileStatus={true}
                        showFolderCount={true}
                        showFolderSize={true}
                        dropCallbacks={dropCallbacks}
                        renameCallback={renameCallback}
                        contextMenuProvider={(item: any, itemInstance: any) =>
                          getMenuItems(item, itemInstance)
                        }
                        onExternalFileDrop={handleExternalFileDrop}
                        emptyStateMessage={
                          <div className='text-center'>
                            <p className='text-sm font-medium text-muted-foreground'>
                              Ready to receive your files
                            </p>
                            <p className='text-xs text-muted-foreground/70 mt-1'>
                              Drop files here, create folders, or click to browse
                            </p>
                          </div>
                        }
                      />
                    )}
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        </div>
      </FadeTransitionWrapper>

      {/* Foldly branding footer for non-pro/business users */}
      <LinkUploadFooter />

      {/* Upload Modal for staging files */}
      <LinkUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          closeUploadModal();
          // Clear dropped files after closing modal
          clearDroppedFiles();
        }}
        linkData={linkData}
        targetFolderId={droppedFiles?.targetFolderId || modalTargetFolderId}
        treeInstance={treeInstance}
        onFileUploaded={treeInstance?.addFileToTree}
        {...(droppedFiles?.files && { initialFiles: droppedFiles.files })}
      />

      {/* Verification Modal for collecting uploader info */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={closeVerificationModal}
        linkData={linkData}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}
