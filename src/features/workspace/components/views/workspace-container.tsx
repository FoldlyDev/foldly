'use client';

import React, { useState, lazy, Suspense } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { UploadModal } from '../modals/upload-modal';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useWorkspaceUI } from '@/features/workspace/hooks/use-workspace-ui';
import { useWorkspaceUploadModal } from '@/features/workspace/stores/workspace-modal-store';
import {
  useStorageTracking,
  useStorageQuotaStatus,
  shouldShowStorageWarning,
} from '../../hooks';
import { WorkspaceSkeleton } from '../skeletons/workspace-skeleton';
import { checkAndShowStorageThresholds } from '@/features/notifications/internal/workspace-notifications';
import { type StorageNotificationData } from '@/features/notifications/internal/types';
import { AlertTriangle } from 'lucide-react';

// Lazy load the heavy WorkspaceTree component
const WorkspaceTree = lazy(() => import('../tree/WorkspaceTree'));

export function WorkspaceContainer() {
  // Get workspace data with loading states
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceTree();

  // Set up real-time subscription for workspace changes
  useWorkspaceRealtime(workspaceData?.workspace?.id);

  // UI state management - use store directly for modal state
  const {
    isOpen: isUploadModalOpen,
    closeModal: closeUploadModal,
    workspaceId: modalWorkspaceId,
  } = useWorkspaceUploadModal();

  // Storage tracking
  const { storageInfo, isLoading: storageLoading } = useStorageTracking();
  const quotaStatus = useStorageQuotaStatus();
  const [previousStoragePercentage, setPreviousStoragePercentage] = useState<
    number | undefined
  >(undefined);

  // Tree instance state
  const [treeInstance, setTreeInstance] = useState<any | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleClearSelection = () => {
    // Clear tree instance selection
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    // Clear local state
    setSelectedItems([]);
  };

  // Monitor storage changes and show threshold notifications
  React.useEffect(() => {
    if (!storageLoading && storageInfo) {
      const currentPercentage = storageInfo.usagePercentage;

      if (shouldShowStorageWarning(currentPercentage)) {
        const storageData: StorageNotificationData = {
          currentUsage: storageInfo.storageUsedBytes,
          totalLimit: storageInfo.storageLimitBytes,
          remainingSpace: storageInfo.remainingBytes,
          usagePercentage: currentPercentage,
          planKey: storageInfo.planKey,
          filesCount: storageInfo.filesCount,
        };

        // Only show notifications when crossing thresholds
        checkAndShowStorageThresholds(storageData, previousStoragePercentage);
      }

      setPreviousStoragePercentage(currentPercentage);
    }
  }, [storageInfo, storageLoading, previousStoragePercentage]);

  // Show skeleton while loading
  if (isLoading) {
    return <WorkspaceSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <div className='dashboard-container workspace-layout'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-red-600 mb-2'>
              Failed to load workspace
            </h3>
            <p className='text-gray-600 mb-4'>
              {error?.message ||
                'An error occurred while loading your workspace'}
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
    );
  }

  return (
    <div className='dashboard-container workspace-layout'>
      <div className='workspace-header'>
        <WorkspaceHeader
          totalLinks={workspaceData?.stats?.totalLinks || 0}
          totalFiles={workspaceData?.stats?.totalFiles || 0}
          workspaceId={workspaceData?.workspace?.id}
        />
      </div>

      <div className='workspace-toolbar'>
        <WorkspaceToolbar
          treeInstance={treeInstance}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedItems={selectedItems}
          onClearSelection={handleClearSelection}
        />
      </div>

      <div className='workspace-tree-container'>
        <div className='workspace-tree-wrapper'>
          <div className='workspace-tree-content'>
            <Suspense
              fallback={
                <div className='flex items-center justify-center h-64'>
                  <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              }
            >
              <WorkspaceTree
                onTreeReady={setTreeInstance}
                searchQuery={searchQuery}
                selectedItems={selectedItems}
                onSelectionChange={setSelectedItems}
              />
            </Suspense>
          </div>

          <div className='workspace-tree-footer'>
            <p className='workspace-tree-footer-text'>
              Drag items to workspace root or between folders
            </p>
          </div>
        </div>
      </div>

      {/* Upload Modal with Storage Context */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        workspaceId={modalWorkspaceId || workspaceData?.workspace?.id}
      />

      {/* Global Storage Status Overlay for Critical States */}
      {quotaStatus.status === 'exceeded' && (
        <div className='fixed bottom-4 right-4 z-50 max-w-sm'>
          <div className='bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0' />
              <div>
                <h4 className='font-medium text-red-800'>Storage Full</h4>
                <p className='text-sm text-red-700 mt-1'>
                  Free up space to continue uploading files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
