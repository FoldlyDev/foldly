'use client';

import React, { useState, lazy, Suspense, useMemo } from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { UploadModal } from '../modals/upload-modal';
import { CloudProviderButtons } from '../cloud/cloud-provider-buttons';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useWorkspaceUI } from '@/features/workspace/hooks/use-workspace-ui';
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
import FileTree, { addTreeItem } from '@/components/file-tree/core/tree';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';

// Lazy load the heavy WorkspaceTree component
const WorkspaceTree = lazy(() => import('../tree/WorkspaceTree'));

export function WorkspaceContainer() {
  // Get workspace data with loading states
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceTree();

  // Transform workspace data to tree structure
  const treeData = useMemo(() => {
    if (!workspaceData?.workspace || !workspaceData?.folders || !workspaceData?.files) {
      return {};
    }
    
    // Get the transformed data
    const transformed = transformToTreeStructure(workspaceData.folders, workspaceData.files);
    
    // Add the workspace root
    transformed[workspaceData.workspace.id] = {
      id: workspaceData.workspace.id,
      name: workspaceData.workspace.name,
      type: 'folder',
      parentId: null,
      path: '/',
      depth: 0,
      children: Object.values(transformed)
        .filter(item => !item.parentId)
        .map(item => item.id),
    };
    
    return transformed;
  }, [workspaceData]);

  // Mobile detection
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const [selectionMode, setSelectionMode] = useState(false);

  const handleClearSelection = () => {
    // Clear tree instance selection - based on the example pattern
    if (treeInstance?.getState) {
      // The tree manages its own state, we can get it but not directly set it
      // Instead we'd need to trigger selection through the tree's methods
      const state = treeInstance.getState();
      // For now, just clear local state
      setSelectedItems([]);
    }
    // Exit selection mode when clearing
    setSelectionMode(false);
  };
  
  // Monitor tree selection changes
  React.useEffect(() => {
    if (treeInstance?.getState) {
      // Check tree state periodically or on events
      const checkSelection = () => {
        const state = treeInstance.getState();
        if (state.selectedItems) {
          setSelectedItems(state.selectedItems);
        }
      };
      
      // Initial check
      checkSelection();
      
      // You could set up an interval or event listener here if needed
      // For now, we rely on the tree's internal state management
    }
  }, [treeInstance]);

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

      {/* Foreign Drop Toolbar - Following the example pattern */}
      <div className='workspace-foreign-toolbar flex gap-2 p-4 bg-muted/30 rounded-lg mb-4'>
        {/* EXACT DRAG EXAMPLE FROM DEMO */}
        <div
          className='px-4 py-2 bg-blue-600 text-white rounded cursor-move hover:bg-blue-700 transition-colors'
          draggable
          onDragStart={e => {
            console.log('Starting drag of test folder');
            e.dataTransfer.setData('text/plain', 'Test Folder from Drag');
            e.dataTransfer.setData('item-type', 'folder');
          }}
        >
          📁 Drag me into the tree! (Like Example)
        </div>
        
        {/* PROGRAMMATIC ADD BUTTON */}
        <button
          className='px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
          onClick={() => {
            const folderName = prompt('Enter folder name:') || 'Test Folder from Button';
            
            if (workspaceData?.workspace?.id) {
              // Get selected item or use workspace root
              const state = treeInstance?.getState();
              const selectedItems = state?.selectedItems || [];
              const targetId = selectedItems.length > 0 ? selectedItems[0] : workspaceData.workspace.id;
              
              // Create new folder
              const newFolderId = `folder-${Date.now()}`;
              const newFolder = {
                id: newFolderId,
                name: folderName,
                type: 'folder' as const,
                path: '/' + folderName,
                depth: 1,
                children: [],
                parentId: targetId,
              };
              
              console.log('Calling addTreeItem with:', targetId, newFolder);
              // Add folder programmatically - pass tree instance too!
              addTreeItem(treeInstance, targetId, newFolder);
              // Now using insertItemsAtTarget just like drag drop!
            }
          }}
        >
          📁 Create Folder (Programmatic)
        </button>
        
        <div
          className='px-4 py-2 bg-secondary text-secondary-foreground rounded cursor-move hover:bg-secondary/90 transition-colors'
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('text/plain', 'New Document.txt');
            e.dataTransfer.setData('item-type', 'file');
          }}
        >
          📄 Drag to create file
        </div>
        
        <button
          className='px-4 py-2 bg-accent text-accent-foreground rounded hover:bg-accent/90 transition-colors'
          onClick={() => {
            // Rename selected item or workspace root
            if (treeInstance) {
              const state = treeInstance.getState();
              const selectedItems = state?.selectedItems || [];
              const targetId = selectedItems.length > 0 ? selectedItems[0] : workspaceData?.workspace?.id;
              
              if (targetId) {
                console.log('Starting rename for:', targetId);
                treeInstance.getItemInstance(targetId)?.startRenaming();
              }
            }
          }}
        >
          ✏️ Rename Selected
        </button>
        
        <button
          className='px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90 transition-colors'
          onClick={() => {
            // Open search in tree
            if (treeInstance?.openSearch) {
              treeInstance.openSearch();
            }
          }}
        >
          🔍 Search Files
        </button>
        
        <label className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer'>
          📤 Upload Files
          <input
            type='file'
            multiple
            className='hidden'
            onChange={(e) => {
              const files = e.target.files;
              if (!files || !treeInstance || !workspaceData?.workspace?.id) return;
              
              // Get target folder (selected or workspace root)
              const state = treeInstance.getState();
              const selectedItems = state?.selectedItems || [];
              const targetId = selectedItems.length > 0 ? selectedItems[0] : workspaceData.workspace.id;
              
              // Add each file to the tree
              Array.from(files).forEach(file => {
                const newFileId = `file-${Date.now()}-${Math.random()}`;
                const newFile = {
                  id: newFileId,
                  name: file.name,
                  type: 'file' as const,
                  mimeType: file.type || 'application/octet-stream',
                  fileSize: file.size,
                  extension: file.name.includes('.') ? file.name.split('.').pop() || null : null,
                };
                
                console.log('Adding file to tree:', targetId, newFile);
                // Use the addTreeItem function to add programmatically
                addTreeItem(treeInstance, targetId, newFile);
              });
              
              // Clear the input
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div className='workspace-tree-container mt-4 h-screen overflow-y-auto!'>
        {/* <div className='flex gap-4 h-full'>
          <div className='workspace-tree-wrapper flex-1'>
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
                  selectionMode={selectionMode}
                  onSelectionModeChange={setSelectionMode}
                />
              </Suspense>
            </div>
          </div>
        </div> */}
        {workspaceData?.workspace?.id && Object.keys(treeData).length > 0 ? (
          <FileTree 
            rootId={workspaceData.workspace.id}
            initialData={treeData}
            initialExpandedItems={[workspaceData.workspace.id]}
            initialSelectedItems={selectedItems}
            onTreeReady={setTreeInstance}
          />
        ) : (
          <div className='flex items-center justify-center h-64'>
            <p className='text-muted-foreground'>No files or folders yet</p>
          </div>
        )}
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
