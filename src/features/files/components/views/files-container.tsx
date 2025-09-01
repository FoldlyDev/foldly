'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { FadeTransitionWrapper } from '@/components/feedback';
import { LinksPanel } from '../panels/links-panel';
import { WorkspacePanel } from '../panels/workspace-panel';
import { FilesHeader } from '../sections/files-header';
import { FilesSkeleton } from '../skeletons/files-skeleton';
import { useUserLinks } from '../../hooks/use-files-data';
import type { FileTransferRequest } from '../../types/links';

export function FilesContainer() {
  const isMobile = !useMediaQuery('(min-width: 768px)');
  const [activePanel, setActivePanel] = useState<'links' | 'workspace'>('links');
  
  // Get loading state from the data hook
  const { isLoading } = useUserLinks();

  const handleFileDrop = (files: File[], targetFolderId?: string | undefined) => {
    // Handle file drop from links panel to workspace
    console.log('Files dropped:', files, 'Target folder:', targetFolderId);
  };

  const handleFileTransfer = (request: FileTransferRequest) => {
    // Handle file transfer via context menu (mobile)
    console.log('Files transferred:', request);
  };

  return (
    <FadeTransitionWrapper
      isLoading={isLoading}
      loadingComponent={<FilesSkeleton />}
      duration={300}
      className="dashboard-container files-layout"
    >
      {/* Files Header */}
      <div className="files-header">
        <FilesHeader />
      </div>

      {isMobile ? (
        // Mobile: Single panel layout
        <div className="files-mobile-container">
            <div className="files-panel-switcher">
              <button
                onClick={() => setActivePanel('links')}
                className={cn(
                  'files-panel-switch-btn',
                  activePanel === 'links' && 'active'
                )}
              >
                Links
              </button>
              <button
                onClick={() => setActivePanel('workspace')}
                className={cn(
                  'files-panel-switch-btn',
                  activePanel === 'workspace' && 'active'
                )}
              >
                Workspace
              </button>
            </div>
            
            <div className="files-mobile-panel">
              {activePanel === 'links' ? (
                <LinksPanel
                  onFileTransfer={handleFileTransfer}
                  isMobile={true}
                />
              ) : (
                <WorkspacePanel
                  isReadOnly={true}
                />
              )}
            </div>
          </div>
        ) : (
          // Desktop: Two-panel layout
          <div className="files-desktop-container">
            <div className="files-left-panel">
              <LinksPanel
                onFileDrop={handleFileDrop}
                isMobile={false}
              />
            </div>
            
            <div className="files-right-panel">
              <WorkspacePanel
                isReadOnly={true}
                onFileDrop={handleFileDrop}
              />
            </div>
        </div>
      )}
    </FadeTransitionWrapper>
  );
}