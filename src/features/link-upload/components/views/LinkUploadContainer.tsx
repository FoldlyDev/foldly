'use client';

import React, { useState, lazy, Suspense, useMemo } from 'react';

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
import type { LinkWithStats } from '@/lib/database/types/links';
import { FadeTransitionWrapper } from '@/components/feedback';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

interface LinkUploadContainerProps {
  linkData: LinkWithStats;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
  // Fetch tree data
  const { data: treeData, isLoading: treeLoading } = useLinkTreeData(
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<any[]>([]);

  // Get staging store state and actions
  const {
    isUploadModalOpen,
    targetFolderId: modalTargetFolderId,
    closeUploadModal,
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

  // Transform data to tree structure (empty for uploaders)
  const treeDataStructure = useMemo(() => {
    // Public uploaders always start with empty tree
    if (!isOwner) {
      return {
        [linkData.id]: {
          id: linkData.id,
          name: linkData.title || 'Upload Root',
          type: 'folder' as const,
          parentId: null,
          path: '/',
          depth: 0,
          fileCount: 0,
          totalSize: 0,
          isArchived: false,
          sortOrder: 0,
          children: [],
        },
      };
    }
    // Owners would see full tree but they get redirected
    return {};
  }, [linkData, isOwner]);

  const handleClearSelection = () => {
    // Clear local state
    setSelectedItems([]);
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
    <FadeTransitionWrapper
      isLoading={treeLoading}
      loadingComponent={<LinkUploadSkeleton />}
      duration={300}
      className='min-h-screen flex flex-col bg-[--foldly-dark-gradient-radial]'
    >
      <div
        className='min-h-screen flex flex-col'
        style={{ background: 'var(--foldly-dark-gradient-radial)' }}
      >
        <LinkUploadHeader link={linkData} />

        <div className='container mx-auto px-4 py-8 max-w-7xl flex-1 workspace-layout'>
          <div className='mb-6'>
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

          {/* Main content area - File Tree */}
          <div className='workspace-tree-container h-[90vh]!'>
            <div className='workspace-tree-wrapper'>
              <div className='workspace-tree-content'>
                <Suspense
                  fallback={
                    <div className='flex items-center justify-center h-64'>
                      <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                    </div>
                  }
                >
                  {linkData.id && (
                    <FileTree
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
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </div>
        </div>

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
          {...(droppedFiles?.files && { initialFiles: droppedFiles.files })}
        />
      </div>
    </FadeTransitionWrapper>
  );
}
