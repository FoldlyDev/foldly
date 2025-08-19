'use client';

import React, { useState, lazy, Suspense, useMemo, useRef, useCallback, useEffect } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { UploadModal } from '../modals/upload-modal';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useWorkspaceUploadModal } from '@/features/workspace/stores/workspace-modal-store';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  useStorageTracking,
  useStorageQuotaStatus,
  shouldShowStorageWarning,
} from '../../hooks';
import { WorkspaceSkeleton } from '../skeletons/workspace-skeleton';
import { checkAndShowStorageThresholds } from '@/features/notifications/internal/workspace-notifications';
import { type StorageNotificationData } from '@/features/notifications/internal/types';
import { AlertTriangle } from 'lucide-react';
import { FadeTransitionWrapper } from '@/components/feedback';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import type { TreeFolderItem } from '@/components/file-tree/types';

// Import tree manipulation functions
import { addTreeItem, removeTreeItem } from '@/components/file-tree/core/tree';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

export function WorkspaceContainer() {
  // Get workspace data with loading states
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceTree();

  // Mobile detection
  const _isMobile = useMediaQuery('(max-width: 768px)');

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

  // Tree instance state and unique tree ID
  const [treeInstance, setTreeInstance] = useState<any | null>(null);
  const treeIdRef = useRef<string>(`workspace-tree-${Date.now()}`);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Track if we have touch support
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Transform workspace data to tree format using the file-tree's utility
  const treeData = useMemo(() => {
    if (!workspaceData) return {};
    return transformToTreeStructure(
      workspaceData.folders || [],
      workspaceData.files || [],
      workspaceData.workspace
    );
  }, [workspaceData]);

  // Get initially expanded items (workspace root)
  const initialExpandedItems = useMemo(() => {
    return workspaceData?.workspace?.id ? [workspaceData.workspace.id] : [];
  }, [workspaceData?.workspace?.id]);

  const handleClearSelection = () => {
    // Clear tree instance selection
    if (treeInstance?.setSelectedItems) {
      treeInstance.setSelectedItems([]);
    }
    // Clear local state
    setSelectedItems([]);
    // Exit selection mode when clearing
    setSelectionMode(false);
  };

  // Handle tree ready callback and extend with needed methods
  const handleTreeReady = useCallback((tree: any) => {
    // Extend the tree instance with methods the toolbar expects
    const extendedTree = {
      ...tree,
      // Add methods that toolbar expects
      getSelectedItems: () => {
        // The new tree tracks selected items differently
        return tree.getSelectedItems ? tree.getSelectedItems() : [];
      },
      getItemInstance: (id: string) => {
        // Get specific item instance
        return tree.getItemInstance ? tree.getItemInstance(id) : null;
      },
      addFolder: (_name: string, _parentId?: string) => {
        // Don't add immediately - return null to signal toolbar to use server action
        // We'll add to tree when server action succeeds
        return null;
      },
      deleteItems: (itemIds: string[]) => {
        // Remove items from tree immediately for responsive UI
        if (tree && treeIdRef.current) {
          removeTreeItem(tree, itemIds, treeIdRef.current);
        }
      },
      // Add a method to add folder after successful server action
      addFolderToTree: (folder: any) => {
        if (!tree || !treeIdRef.current || !folder) return;
        
        const treeFolder: TreeFolderItem = {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          parentId: folder.parentFolderId || workspaceData?.workspace?.id || null,
          path: folder.path || '/',
          depth: folder.depth || 0,
          fileCount: 0,
          totalSize: 0,
          isArchived: false,
          sortOrder: folder.sortOrder || 999,
          children: [],
          record: folder,
        };
        
        const parentId = folder.parentFolderId || workspaceData?.workspace?.id || '';
        addTreeItem(tree, parentId, treeFolder, treeIdRef.current);
      },
      expandAll: () => {
        if (tree.expandAll) tree.expandAll();
      },
      collapseAll: () => {
        if (tree.collapseAll) tree.collapseAll();
      },
      isTouchDevice: () => isTouchDevice,
      isSelectionMode: () => selectionMode,
      setSelectionMode: (mode: boolean) => {
        setSelectionMode(mode);
      },
      setSelectedItems: (items: string[]) => {
        if (tree.setSelectedItems) tree.setSelectedItems(items);
      },
    };
    
    setTreeInstance(extendedTree);
  }, [selectionMode, isTouchDevice, workspaceData?.workspace?.id]);

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

  // Show error state
  if (isError && !isLoading) {
    return (
      <div className='dashboard-container workspace-layout bg-background'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-destructive mb-2'>
              Failed to load workspace
            </h3>
            <p className='text-muted-foreground mb-4'>
              {error?.message ||
                'An error occurred while loading your workspace'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FadeTransitionWrapper
      isLoading={isLoading}
      loadingComponent={<WorkspaceSkeleton />}
      duration={300}
      className='dashboard-container workspace-layout'
    >
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
          selectionMode={selectionMode}
          onSelectionModeChange={setSelectionMode}
        />
      </div>

      <div className='workspace-tree-container mt-4 h-screen overflow-y-auto!'>
        <div className='flex gap-4 h-full'>
          <div className='workspace-tree-wrapper flex-1'>
            <div className='workspace-tree-content'>
              <Suspense
                fallback={
                  <div className='flex items-center justify-center h-64'>
                    <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  </div>
                }
              >
                {workspaceData?.workspace?.id && (
                  <FileTree
                    rootId={workspaceData.workspace.id}
                    treeId={treeIdRef.current}
                    initialData={treeData}
                    initialExpandedItems={initialExpandedItems}
                    initialSelectedItems={selectedItems}
                    onTreeReady={handleTreeReady}
                    onSelectionChange={setSelectedItems}
                    showCheckboxes={selectionMode}
                    searchQuery={searchQuery}
                    onSearchChange={(query) => setSearchQuery(query)}
                    showFileSize={true}
                    showFileDate={false}
                    showFileStatus={false}
                    showFolderCount={true}
                    showFolderSize={false}
                  />
                )}
              </Suspense>
            </div>
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
          <div className='bg-destructive/10 border border-destructive/30 rounded-lg p-4 shadow-lg'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-destructive flex-shrink-0' />
              <div>
                <h4 className='font-medium text-destructive'>Storage Full</h4>
                <p className='text-sm text-destructive/90 mt-1'>
                  Free up space to continue uploading files.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </FadeTransitionWrapper>
  );
}

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
