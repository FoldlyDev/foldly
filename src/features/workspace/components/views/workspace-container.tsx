'use client';

import React, { useState, lazy, Suspense, useMemo, useRef, useCallback } from 'react';

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
import type { TreeItem, TreeFolderItem, TreeFileItem } from '@/components/file-tree/types';
import type { File, Folder } from '@/lib/database/types';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

// Helper function to transform database data to tree format
function transformToTreeData(
  workspace: { id: string; name: string } | null,
  folders: Folder[],
  files: File[]
): Record<string, TreeItem> {
  const treeData: Record<string, TreeItem> = {};

  if (!workspace) return treeData;

  // Add workspace as root folder
  treeData[workspace.id] = {
    id: workspace.id,
    name: workspace.name,
    type: 'folder',
    parentId: null,
    path: '/',
    depth: 0,
    fileCount: files.length,
    totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
    isArchived: false,
    sortOrder: 0,
    children: [],
  } as TreeFolderItem;

  // Create a map for easy parent lookup
  const folderMap = new Map<string, TreeFolderItem>();
  folderMap.set(workspace.id, treeData[workspace.id] as TreeFolderItem);

  // Add folders with proper hierarchy
  folders
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach(folder => {
      const treeFolder: TreeFolderItem = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentFolderId || workspace.id,
        path: folder.path,
        depth: folder.depth,
        fileCount: folder.fileCount,
        totalSize: folder.totalSize,
        isArchived: folder.isArchived,
        sortOrder: folder.sortOrder,
        children: [],
        record: folder,
      };

      treeData[folder.id] = treeFolder;
      folderMap.set(folder.id, treeFolder);

      // Add to parent's children
      const parentId = folder.parentFolderId || workspace.id;
      const parent = folderMap.get(parentId);
      if (parent?.children) {
        parent.children.push(folder.id);
      }
    });

  // Add files
  files
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .forEach(file => {
      const treeFile: TreeFileItem = {
        id: file.id,
        name: file.fileName,
        type: 'file',
        parentId: file.folderId || workspace.id,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        extension: file.extension,
        thumbnailPath: file.thumbnailPath,
        processingStatus: file.processingStatus,
        record: file,
      };

      treeData[file.id] = treeFile;

      // Add to parent's children
      const parentId = file.folderId || workspace.id;
      const parent = folderMap.get(parentId);
      if (parent?.children) {
        parent.children.push(file.id);
      }
    });

  return treeData;
}

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

  // Transform workspace data to tree format
  const treeData = useMemo(() => {
    if (!workspaceData) return {};
    return transformToTreeData(
      workspaceData.workspace,
      workspaceData.folders || [],
      workspaceData.files || []
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

  // Handle tree ready callback
  const handleTreeReady = useCallback((tree: any) => {
    setTreeInstance(tree);
  }, []);

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
