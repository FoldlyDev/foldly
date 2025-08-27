'use client';

import React, { useState } from 'react';

import { LinkUploadHeader } from '../sections/link-upload-header';
import { LinkUploadFooter } from '../sections/link-upload-footer';
import { LinkUploadToolbar } from '../sections/link-upload-toolbar';
// Modals will be re-implemented with new tree system
import { LinkUploadSkeleton } from '../skeletons/link-upload-skeleton';
// Types will be re-implemented with new tree system
type LinkWithOwner = any;
type UploadSession = {
  linkId: string;
  uploaderName: string;
  authenticated: boolean;
};
import { FadeTransitionWrapper } from '@/components/feedback';

interface LinkUploadContainerProps {
  linkData: LinkWithOwner;
}

export function LinkUploadContainer({ linkData }: LinkUploadContainerProps) {
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

  // Create a minimal session on mount to allow browsing
  React.useEffect(() => {
    // Clear any existing session from localStorage to ensure fresh entry
    localStorage.removeItem(`upload-session-${linkData.id}`);

    // Create minimal session to allow browsing without providing info upfront
    const minimalSession: UploadSession = {
      linkId: linkData.id,
      uploaderName: '',
      authenticated: false, // Not fully authenticated until info provided
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

  return (
    <FadeTransitionWrapper
      isLoading={false}
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
              selectedFolderId={selectedFolderId}
              selectedFolderName={selectedFolderName}
              hasProvidedInfo={hasProvidedInfo}
              onRequestUpload={() => setShowAccessModal(true)}
              shouldTriggerUpload={shouldTriggerUpload}
              onUploadTriggered={() => setShouldTriggerUpload(false)}
            />
          </div>

          {/* Main content area - TODO: Add new tree implementation here */}
          <div className='link-upload-tree-container'>
            <div className='link-upload-tree-wrapper'>
              <div className='link-upload-tree-content'>
                {/* Tree will be added here in next step */}
                <div className='flex items-center justify-center h-64 text-muted-foreground'>
                  Tree implementation removed - ready for new implementation
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Foldly branding footer for non-pro/business users */}
        <LinkUploadFooter />

        {/* Modals will be re-implemented with new tree system */}
      </div>
    </FadeTransitionWrapper>
  );
}