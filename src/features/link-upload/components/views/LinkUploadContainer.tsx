'use client';

import React, { useState, lazy, Suspense, useMemo } from 'react';

import { LinkUploadHeader } from '../sections/link-upload-header';
import { LinkUploadFooter } from '../sections/link-upload-footer';
import { LinkUploadToolbar } from '../sections/link-upload-toolbar';
import { OwnerRedirectMessage } from '../ui/owner-redirect-message';
import { LinkUploadSkeleton } from '../skeletons/link-upload-skeleton';
import { useLinkTreeData } from '../../hooks/use-link-data';
import { useLinkTreeInstanceManager } from '../../lib/managers/link-tree-instance-manager';
import { UploadSessionManager } from '../../lib/managers/upload-session-manager';
import { useSelectionManager } from '../../lib/managers/selection-manager';
import { 
  useContextMenuHandler,
  useDragDropHandler,
  useRenameHandler,
  useFolderCreationHandler,
  type BatchOperationItem 
} from '../../lib/handlers';
import { useExternalFileDropHandler } from '../../lib/handlers/external-file-drop-handler';
import { useLinkUploadStagingStore } from '../../stores/staging-store';
import { LinkUploadModal } from '../modals/upload-modal';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import type { LinkWithStats } from '@/lib/database/types/links';
import type { UploadSession } from '../../lib/managers/upload-session-manager';
import { FadeTransitionWrapper } from '@/components/feedback';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

interface LinkUploadContainerProps {
  linkData: LinkWithStats;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
  // Fetch tree data
  const { data: treeData, isLoading: treeLoading } = useLinkTreeData(linkData.id);
  
  // Check if user is owner (this should be passed from server)
  const isOwner = treeData?.isOwner || false;
  // Access control state
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(
    null
  );
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [hasProvidedInfo, setHasProvidedInfo] = useState(false);
  const [shouldTriggerUpload, setShouldTriggerUpload] = useState(false);

  // Staging store will be re-implemented with new tree

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected folder state for folder creation target
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
    undefined
  );
  const [selectedFolderName, setSelectedFolderName] =
    useState<string>('Link Root');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<BatchOperationItem[]>([]);
  
  // Get staging store state and actions
  const { 
    removeStagedItems,
    isUploadModalOpen,
    targetFolderId: modalTargetFolderId,
    closeUploadModal,
  } = useLinkUploadStagingStore();
  
  // Tree instance management
  const {
    treeInstance,
    treeIdRef,
    handleTreeReady,
    addFolderToTree,
    addFileToTree,
    deleteItemsFromTree,
  } = useLinkTreeInstanceManager({
    linkId: linkData.id,
    isOwner,
  });
  
  // Selection management
  const selectionManager = useSelectionManager({
    treeInstance,
    onSelectionChange: setSelectedItems,
  });
  
  // Folder creation handler (defined first so it can be passed to context menu)
  const { createFolder } = useFolderCreationHandler({
    treeInstance,
    linkId: linkData.id,
  });
  
  // External file drop handler for staging files
  const { 
    droppedFiles,
    setDroppedFiles,
    handleExternalFileDrop,
    clearDroppedFiles,
  } = useExternalFileDropHandler({
    linkId: linkData.id,
  });
  
  // Context menu handler
  const { getMenuItems, handleDelete } = useContextMenuHandler({
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

  // Create a minimal session on mount to allow browsing
  React.useEffect(() => {
    // Clear any existing session from localStorage to ensure fresh entry
    UploadSessionManager.clearSession(linkData.id);

    // Create minimal session to allow browsing without providing info upfront
    const minimalSession: UploadSession = {
      linkId: linkData.id,
      uploaderName: '',
      uploaderEmail: undefined as string | undefined,
      authenticated: false, // Not fully authenticated until info provided
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    setUploadSession(minimalSession);
  }, [linkData.id]);

  const handleAccessGranted = React.useCallback((session: UploadSession) => {
    setUploadSession(session);
    setShowAccessModal(false);
    setHasProvidedInfo(true);
    setShouldTriggerUpload(true);
  }, []);

  const handleCancelUpload = React.useCallback(() => {
    setShowAccessModal(false);
  }, []);

  const handleClearSelection = () => {
    // Clear local state
    setSelectedItems([]);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = React.useCallback(() => {
    const itemIds = itemsToDelete.map(item => item.id);
    
    // Remove from staging store
    removeStagedItems(itemIds);
    
    // Remove from tree
    if (deleteItemsFromTree) {
      deleteItemsFromTree(itemIds);
    }
    
    // Close modal and clear selection
    setShowDeleteModal(false);
    setItemsToDelete([]);
    handleClearSelection();
  }, [itemsToDelete, removeStagedItems, deleteItemsFromTree]);

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

        <div className='container mx-auto px-4 py-8 max-w-7xl flex-1'>
          <div className='mb-6'>
            <LinkUploadToolbar
              linkData={linkData}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedItems={selectedItems}
              onClearSelection={handleClearSelection}
              selectedFolderId={selectedFolderId || ''}
              selectedFolderName={selectedFolderName}
              hasProvidedInfo={hasProvidedInfo}
              onRequestUpload={() => setShowAccessModal(true)}
              shouldTriggerUpload={shouldTriggerUpload}
              onUploadTriggered={() => setShouldTriggerUpload(false)}
            />
          </div>

          {/* Main content area - File Tree */}
          <div className='link-upload-tree-container'>
            <div className='link-upload-tree-wrapper'>
              <div className='link-upload-tree-content'>
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
                      contextMenuProvider={(item: any, itemInstance: any) => getMenuItems(item, itemInstance)}
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
          initialFiles={droppedFiles?.files}
        />
      </div>
    </FadeTransitionWrapper>
  );
}