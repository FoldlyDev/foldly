'use client';

import React, {
  useState,
  lazy,
  Suspense,
  useMemo,
  useCallback,
  useEffect,
} from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { UploadModal } from '../modals/upload-modal';
import {
  BatchOperationModal,
  type BatchOperationItem,
  type BatchOperationProgress,
} from '../modals/batch-operation-modal';
import { useWorkspaceData } from '@/features/workspace/hooks/use-workspace-data';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useWorkspaceUploadModal } from '@/features/workspace/stores/workspace-modal-store';
import { useStorageTracking, useStorageWarnings } from '../../hooks';
import { shouldShowStorageWarning } from '../../lib/utils/storage-utils';
import { WorkspaceSkeleton } from '../skeletons/workspace-skeleton';
import { checkAndShowStorageThresholds } from '@/features/notifications/internal/workspace-notifications';
import { type StorageNotificationData } from '@/features/notifications/internal/types';
import { AlertTriangle } from 'lucide-react';
import { FadeTransitionWrapper } from '@/components/feedback';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import type {
  TreeFolderItem,
  TreeItem,
  TreeFileItem,
} from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';
import type {
  ContextMenuProvider,
  ContextMenuItem,
} from '@/components/file-tree/core/tree';
import { Trash2, Edit2, Link2, FolderPlus } from 'lucide-react';

// Import workspace actions for database operations
import { batchDeleteItemsAction } from '@/features/workspace/lib/actions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';
import {
  eventBus,
  NotificationEventType,
  NotificationPriority,
  NotificationUIType,
} from '@/features/notifications/core';
import { useSelectionManager } from '../../lib/managers/selection-manager';
import { useTreeInstanceManager } from '../../lib/managers/tree-instance-manager';
import { useContextMenuHandler } from '../../lib/handlers/context-menu-handler';
import { useDragDropHandler } from '../../lib/handlers/drag-drop-handler';
import { useExternalFileDropHandler } from '../../lib/handlers/external-file-drop-handler';
import { useRenameHandler } from '../../lib/handlers/rename-handler';
import { useFolderCreationHandler } from '../../lib/handlers/folder-creation-handler';
import { Button } from '@/components/ui/shadcn/button';
import { CloudStorageContainer } from './cloud-storage-container';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

export function WorkspaceContainer() {
  // Get workspace data with loading states
  const { data: workspaceData, isLoading, isError, error } = useWorkspaceData();

  // Set up real-time subscription for workspace changes
  useWorkspaceRealtime(workspaceData?.workspace?.id);

  // UI state management - use store directly for modal state
  const {
    isOpen: isUploadModalOpen,
    closeModal: closeUploadModal,
    workspaceId: modalWorkspaceId,
  } = useWorkspaceUploadModal();

  // Storage tracking
  const { data: storageInfo, isLoading: storageLoading } = useStorageTracking();
  const quotaStatus = useStorageWarnings();
  const [previousStoragePercentage, setPreviousStoragePercentage] = useState<
    number | undefined
  >(undefined);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Track if we have touch support
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Selection management - will be updated with tree instance
  const [selectionTreeInstance, setSelectionTreeInstance] = useState<
    any | null
  >(null);
  const { selectedItems, setSelectedItems, clearSelection } =
    useSelectionManager({
      treeInstance: selectionTreeInstance, // Will be set when tree is ready
      onSelectionChange: items => {
        // This will be called when selection changes
      },
    });

  // Delete modal state (needs to be declared before handlers that use it)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<BatchOperationItem[]>([]);

  // Tree instance management
  const {
    treeInstance,
    treeIdRef,
    handleTreeReady: originalHandleTreeReady,
    addFolderToTree,
    addFileToTree,
    deleteItemsFromTree,
  } = useTreeInstanceManager({
    workspaceId: workspaceData?.workspace?.id,
    isTouchDevice,
    setSelectedItems,
    clearSelection,
  });

  // Enhanced tree ready handler that also updates selection manager
  const handleTreeReady = useCallback(
    (tree: any) => {
      // Call the original handler first
      originalHandleTreeReady(tree);
      // Update selection manager's tree instance
      setSelectionTreeInstance(tree);
    },
    [originalHandleTreeReady]
  );

  // Folder creation handler - moved before context menu handler that uses it
  const { createFolder, createFolderMutation } = useFolderCreationHandler({
    treeInstance,
  });

  // Context menu handler
  const { getMenuItems, handleNewFolder, handleGenerateLink, handleDelete } =
    useContextMenuHandler({
      workspaceId: workspaceData?.workspace?.id,
      treeInstance,
      setItemsToDelete,
      setShowDeleteModal,
      createFolder, // Pass the folder creation handler
    });

  // Drag-drop handler
  const { dropCallbacks } = useDragDropHandler();

  // External file drop handler
  const {
    droppedFiles,
    setDroppedFiles,
    handleExternalFileDrop,
    clearDroppedFiles,
  } = useExternalFileDropHandler({
    workspaceId: workspaceData?.workspace?.id,
  });

  // Rename handler
  const { renameCallback } = useRenameHandler();

  const [batchProgress, setBatchProgress] = useState<
    BatchOperationProgress | undefined
  >();

  const queryClient = useQueryClient();

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

  // Batch delete mutation (same as toolbar)
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      if (itemsToDelete.length === 0) {
        throw new Error('No items selected');
      }

      try {
        // Remove from tree immediately for responsive UI
        if (treeInstance?.deleteItems) {
          treeInstance.deleteItems(itemsToDelete.map(item => item.id));
        }

        const result = await batchDeleteItemsAction(
          itemsToDelete.map(item => item.id)
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete items');
        }

        return result.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      // Clear selection after successful deletion
      clearSelection();

      // Use centralized invalidation service to update all workspace queries
      await QueryInvalidationService.invalidateWorkspaceData(queryClient);

      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS,
        {
          items: itemsToDelete,
          batchId: `delete-${Date.now()}`,
          totalItems: itemsToDelete.length,
          completedItems: itemsToDelete.length,
        }
      );

      setShowDeleteModal(false);
      setItemsToDelete([]);
      setBatchProgress(undefined);
    },
    onError: async error => {
      // Force refetch on error to ensure consistency
      await QueryInvalidationService.invalidateWorkspaceData(queryClient);

      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_BATCH_DELETE_ERROR,
        {
          items: itemsToDelete,
          batchId: `delete-${Date.now()}`,
          totalItems: itemsToDelete.length,
          completedItems: 0,
          failedItems: itemsToDelete.length,
          error:
            error instanceof Error ? error.message : 'Failed to delete items',
        }
      );

      setShowDeleteModal(false);
      setBatchProgress(undefined);
    },
  });

  // Create context menu provider for tree items using the handler
  const contextMenuProvider: ContextMenuProvider = useCallback(
    (item: TreeItem, itemInstance: any) => {
      // Get menu configuration from the handler
      const menuConfig = getMenuItems(item, itemInstance);

      // If no menu items, return null
      if (!menuConfig) {
        return null;
      }

      // Map configuration to actual ContextMenuItem objects with JSX
      const menuItems: ContextMenuItem[] = menuConfig.map(config => {
        // Handle separator
        if (config.type === 'separator') {
          return { separator: true };
        }

        // Map menu item type to icon
        let icon: React.ReactNode = null;
        switch (config.type) {
          case 'rename':
            icon = <Edit2 className='h-4 w-4' />;
            break;
          case 'delete':
            icon = <Trash2 className='h-4 w-4' />;
            break;
          case 'newFolder':
            icon = <FolderPlus className='h-4 w-4' />;
            break;
          case 'generateLink':
            icon = <Link2 className='h-4 w-4' />;
            break;
        }

        // Build menu item with optional properties
        const menuItem: ContextMenuItem = {
          label: config.label,
          icon,
        };

        // Only add optional properties if they're defined
        if (config.destructive !== undefined) {
          menuItem.destructive = config.destructive;
        }

        if (config.action) {
          menuItem.onClick = config.action;
        }

        return menuItem;
      });

      return menuItems;
    },
    [getMenuItems]
  );

  // Handle tree ready callback and extend with needed methods

  // Monitor storage changes and show threshold notifications
  React.useEffect(() => {
    if (!storageLoading && storageInfo) {
      const currentPercentage = storageInfo.usagePercentage;

      if (shouldShowStorageWarning(currentPercentage)) {
        const storageData: StorageNotificationData = {
          currentUsage: storageInfo.storageUsed,
          totalLimit: storageInfo.storageLimit,
          remainingSpace: storageInfo.availableSpace,
          usagePercentage: currentPercentage,
          planKey: storageInfo.plan,
          filesCount: 0, // Files count not tracked in centralized storage
        };

        // Only show notifications when crossing thresholds
        checkAndShowStorageThresholds(storageData, previousStoragePercentage);
      }

      setPreviousStoragePercentage(currentPercentage);
    }
  }, [storageInfo, storageLoading, previousStoragePercentage]);

  // Listen for folder drop info events
  React.useEffect(() => {
    const handleFolderDropInfo = (data: any) => {
      // Show notification about folders that can't be uploaded
      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_FOLDER_DROPPED,
        {
          fileCount: data.fileCount || 0,
          folderCount: data.folderCount || 1,
          message: data.message || 'Folders detected in drop',
        },
        {
          priority: NotificationPriority.LOW,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 5000,
        }
      );
    };

    eventBus.on('workspace:folder-drop-info', handleFolderDropInfo);

    return () => {
      eventBus.off('workspace:folder-drop-info', handleFolderDropInfo);
    };
  }, []);

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
          onClearSelection={clearSelection}
          onCreateFolder={createFolder}
          isCreatingFolder={createFolderMutation.isPending}
        />
      </div>

      <div className='flex flex-row items-center gap-4'>
        <div className='workspace-tree-container mt-4 h-[calc(100vh-12rem)]'>
          <div className='workspace-tree-wrapper'>
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
                    // Force remount only when transitioning between checkbox and non-checkbox modes
                    key={`${treeIdRef.current}-${selectedItems.length > 0 ? 'checkbox' : 'normal'}`}
                    // ============= CORE CONFIGURATION =============
                    rootId={workspaceData.workspace.id}
                    treeId={treeIdRef.current}
                    initialData={treeData}
                    // ============= INITIAL STATE =============
                    initialState={{
                      expandedItems: initialExpandedItems,
                      selectedItems: selectedItems,
                      checkedItems: selectedItems, // Sync checked with selected items
                    }}
                    // ============= FEATURES CONTROL =============
                    features={{
                      selection: true,
                      multiSelect: true,
                      checkboxes: selectedItems.length > 0, // Enable checkbox feature when items are selected
                      search: true,
                      dragDrop: true, // Full drag-drop for main workspace
                      keyboardDragDrop: true,
                      rename: true,
                      expandAll: true,
                      hotkeys: true,
                    }}
                    // ============= DISPLAY OPTIONS =============
                    display={{
                      showFileSize: true,
                      showFileDate: false,
                      showFileStatus: false,
                      showFolderCount: true,
                      showFolderSize: false,
                      showCheckboxes: selectedItems.length > 0, // Show checkboxes when items are selected
                      showEmptyState: true,
                    }}
                    // ============= EVENT CALLBACKS =============
                    callbacks={{
                      onTreeReady: handleTreeReady,
                      onSelectionChange: setSelectedItems,
                      onSearchChange: (query: string) => setSearchQuery(query),
                      onExternalFileDrop: handleExternalFileDrop,
                    }}
                    // ============= OPERATION HANDLERS =============
                    operations={{
                      dropCallbacks: dropCallbacks,
                      renameCallback: renameCallback,
                      contextMenuProvider: contextMenuProvider,
                    }}
                    // ============= SEARCH =============
                    searchQuery={searchQuery}
                  />
                )}
              </Suspense>
            </div>
          </div>
        </div>
        <div className='mt-4 h-[calc(100vh-12rem)]'>
          <CloudStorageContainer className='h-full' />
        </div>
      </div>

      {/* Upload Modal with Storage Context */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          closeUploadModal();
          // Clear dropped files after closing modal
          clearDroppedFiles();
        }}
        workspaceId={modalWorkspaceId || workspaceData?.workspace?.id}
        {...(droppedFiles?.targetFolderId && {
          folderId: droppedFiles.targetFolderId,
        })}
        onFileUploaded={treeInstance?.addFileToTree}
        {...(droppedFiles?.files && {
          initialFiles: droppedFiles.files,
        })}
      />

      {/* Global Storage Status Overlay for Critical States */}
      {quotaStatus.isFull && (
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

      {/* Batch Delete Modal */}
      <BatchOperationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBatchProgress(undefined);
        }}
        operation='delete'
        items={itemsToDelete}
        onConfirm={async () => {
          batchDeleteMutation.mutate();
        }}
        progress={batchProgress}
        isProcessing={batchDeleteMutation.isPending}
      />
    </FadeTransitionWrapper>
  );
}
