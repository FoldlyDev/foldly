'use client';

import React, { useState, lazy, Suspense } from 'react';
import type { LinkTreeItem } from '@/features/link-upload/lib/tree-data';
import type { TreeInstance } from '@headless-tree/core';

import { LinkUploadHeader } from '../sections/link-upload-header';
import { LinkUploadFooter } from '../sections/link-upload-footer';
import { LinkUploadToolbar } from '../sections/link-upload-toolbar';
import { LinkUploadModal } from '../modals/link-upload-modal';
import { UploadAccessModal } from '../modals/UploadAccessModal';
import { useLinkTree } from '@/features/link-upload/hooks/use-link-tree';
import { useLinkRealtime } from '@/features/link-upload/hooks/use-link-realtime';
import { useLinkUI } from '@/features/link-upload/hooks/use-link-ui';
import { useLinkUploadModal } from '@/features/link-upload/stores/link-modal-store';
import { LinkUploadSkeleton } from '../skeletons/link-upload-skeleton';
import { AlertTriangle } from 'lucide-react';
import { useStagingStore } from '../../stores/staging-store';
import type { LinkWithOwner, UploadSession } from '../../types';
import { FadeTransitionWrapper } from '@/components/ui/feedback';

// Lazy load the heavy LinkTree component
const LinkTree = lazy(() => import('../tree/LinkTree'));

interface LinkUploadContainerProps {
  linkData: LinkWithOwner;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
  // Access control state
  const [uploadSession, setUploadSession] = useState<UploadSession | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  
  // Get the staging store setter
  const { setUploaderInfo } = useStagingStore();

  // Get link data with loading states - only if access is granted
  const { data: linkTreeData, isLoading, isError, error } = useLinkTree(
    uploadSession ? linkData.id : ''
  );

  // Set up real-time subscription for link changes - only if access is granted
  useLinkRealtime(uploadSession ? linkData.id : '');

  // UI state management - use store directly for modal state
  const { isOpen: isUploadModalOpen, closeModal: closeUploadModal, linkId: modalLinkId } = useLinkUploadModal();

  // Tree instance state with extended methods
  type ExtendedTreeInstance = TreeInstance<LinkTreeItem> & {
    addFolder: (name: string, parentId?: string) => string | null;
    rebuildTree: () => void;
  };
  const [treeInstance, setTreeInstance] = useState<ExtendedTreeInstance | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected folder state for folder creation target
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('Link Root');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Handle folder selection for creation target
  const handleFolderSelection = React.useCallback((items: string[]) => {
    setSelectedItems(items);
    
    // Update selected folder for creation target
    if (items.length === 1 && treeInstance) {
      const itemId = items[0];
      const item = treeInstance.getItemInstance?.(itemId);
      
      if (item && !item.getItemData?.()?.isFile) {
        // Check if this is the root link item
        if (itemId === linkData.id) {
          setSelectedFolderId(undefined);
          setSelectedFolderName('Link Root');
        } else {
          setSelectedFolderId(itemId);
          setSelectedFolderName(item.getItemName?.() || 'Unknown Folder');
        }
      } else {
        // If a file is selected, keep previous folder selection
        // This matches workspace behavior
      }
    } else if (items.length === 0) {
      // No selection - reset to root
      setSelectedFolderId(undefined);
      setSelectedFolderName('Link Root');
    }
    // Multiple selection - keep current folder target
  }, [treeInstance, linkData.id]);

  // Handle root click - select root as target
  const handleRootClick = React.useCallback(() => {
    setSelectedFolderId(undefined);
    setSelectedFolderName('Link Root');
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    setSelectedItems([]);
  }, [treeInstance]);

  // Always show access modal on mount
  React.useEffect(() => {
    // Clear any existing session from localStorage to ensure fresh entry
    localStorage.removeItem(`upload-session-${linkData.id}`);
    
    // Show access modal for fresh uploader info
    setShowAccessModal(true);
  }, [linkData.id]);

  const handleAccessGranted = (session: UploadSession) => {
    setUploadSession(session);
    setShowAccessModal(false);
  };

  const handleClearSelection = () => {
    // Clear tree instance selection
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    // Clear local state
    setSelectedItems([]);
  };

  // Apply brand theming with enhanced color palette
  React.useEffect(() => {
    const brandColor = linkData.brandEnabled && linkData.brandColor 
      ? linkData.brandColor 
      : '#3b82f6'; // Default blue if no brand color
    
    // Set CSS variables for brand theming
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brandColor);
    
    // Calculate complementary colors for a cohesive branded experience
    const hex = brandColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
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
    root.style.setProperty('--brand-text-on-primary', luminance > 0.5 ? '#000000' : '#ffffff');
    
    return () => {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-light');
      root.style.removeProperty('--brand-primary-medium');
      root.style.removeProperty('--brand-primary-dark');
      root.style.removeProperty('--brand-primary-extra-light');
      root.style.removeProperty('--brand-text-on-primary');
    };
  }, [linkData.brandEnabled, linkData.brandColor]);

  // Show access modal if no valid session
  if (showAccessModal) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          <LinkUploadHeader link={linkData} />
          <div className='container mx-auto px-4 py-8 max-w-7xl'>
            <div className='flex items-center justify-center h-64'>
              <div className='text-center'>
                <h3 className='text-lg font-semibold mb-2'>
                  Loading Upload Link...
                </h3>
                <p className='text-muted-foreground'>
                  Please wait while we prepare your upload experience.
                </p>
              </div>
            </div>
          </div>
        </div>
        <UploadAccessModal
          isOpen={showAccessModal}
          linkData={linkData}
          onAccessGranted={handleAccessGranted}
        />
      </>
    );
  }

  // Show error state (without loading)
  if (isError && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <LinkUploadHeader link={linkData} />
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold text-red-600 mb-2'>
                Failed to load link data
              </h3>
              <p className='text-gray-600 mb-4'>
                {error?.message || 'An error occurred while loading the upload link'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FadeTransitionWrapper
      isLoading={isLoading}
      loadingComponent={<LinkUploadSkeleton />}
      duration={300}
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col"
    >
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <LinkUploadHeader 
        link={linkData}
      />

      <div className='container mx-auto px-4 py-8 max-w-7xl flex-1'>
        <div className='link-upload-toolbar mb-6'>
          <LinkUploadToolbar
            linkData={linkData}
            treeInstance={treeInstance}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedItems={selectedItems}
            onClearSelection={handleClearSelection}
            selectedFolderId={selectedFolderId}
            selectedFolderName={selectedFolderName}
          />
        </div>

        {/* Main content area */}
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
                <LinkTree
                  linkData={linkData}
                  onTreeReady={setTreeInstance}
                  searchQuery={searchQuery}
                  selectedItems={selectedItems}
                  onSelectionChange={handleFolderSelection}
                  onRootClick={handleRootClick}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Foldly branding footer for non-pro/business users */}
      <LinkUploadFooter />

      {/* Upload Modal with Link Context */}
      <LinkUploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        linkData={linkData}
      />
    </div>
    </FadeTransitionWrapper>
  );
}