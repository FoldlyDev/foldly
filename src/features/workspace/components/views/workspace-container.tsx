'use client';

import React, {
  useState,
  lazy,
  Suspense,
  useMemo,
  useRef,
  useCallback,
  useEffect,
} from 'react';

import { WorkspaceHeader } from '../sections/workspace-header';
import { WorkspaceToolbar } from '../sections/workspace-toolbar';
import { UploadModal } from '../modals/upload-modal';
import { BatchOperationModal, type BatchOperationItem, type BatchOperationProgress } from '../modals/batch-operation-modal';
import { useWorkspaceTree } from '@/features/workspace/hooks/use-workspace-tree';
import { useWorkspaceRealtime } from '@/features/workspace/hooks/use-workspace-realtime';
import { useWorkspaceUploadModal, useWorkspaceModalStore } from '@/features/workspace/stores/workspace-modal-store';
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
import type {
  TreeFolderItem,
  TreeItem,
  TreeFileItem,
} from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';
import type { DropOperationCallbacks } from '@/components/file-tree/handlers/drop-handler';
import type {
  ContextMenuProvider,
  ContextMenuItem,
} from '@/components/file-tree/core/tree';
import { Trash2, Edit2, Link2, FolderPlus } from 'lucide-react';

// Import tree manipulation functions
import { addTreeItem, removeTreeItem } from '@/components/file-tree/core/tree';

// Import workspace actions for database operations
import {
  updateItemOrderAction,
  moveItemAction,
  renameFolderAction,
  renameFileAction,
  createFolderAction,
  batchDeleteItemsAction,
} from '@/features/workspace/lib/actions';
import { generateLinkFromFolderAction } from '@/features/links/lib/actions';
import { generateLinkUrl } from '@/lib/config/url-config';
import { showGeneratedLinkNotification } from '@/features/notifications/utils/link-notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

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

  // Tree instance state and unique tree ID
  const [treeInstance, setTreeInstance] = useState<any | null>(null);
  const treeIdRef = useRef<string>(`workspace-tree-${Date.now()}`);
  
  // State for handling file drops
  const [droppedFiles, setDroppedFiles] = useState<{ files: File[], targetFolderId: string | null } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Track if we have touch support
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<BatchOperationItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchOperationProgress | undefined>();
  
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

        const result = await batchDeleteItemsAction(itemsToDelete.map(item => item.id));
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete items');
        }
        
        return result.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate cache but don't refetch immediately
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
        refetchType: 'none',
      });
      
      eventBus.emitNotification(NotificationEventType.WORKSPACE_BATCH_DELETE_SUCCESS, {
        items: itemsToDelete,
        batchId: `delete-${Date.now()}`,
        totalItems: itemsToDelete.length,
        completedItems: itemsToDelete.length,
      });
      
      setShowDeleteModal(false);
      setItemsToDelete([]);
      setBatchProgress(undefined);
    },
    onError: (error) => {
      // Force refetch on error to ensure consistency  
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      
      eventBus.emitNotification(NotificationEventType.WORKSPACE_BATCH_DELETE_ERROR, {
        items: itemsToDelete,
        batchId: `delete-${Date.now()}`,
        totalItems: itemsToDelete.length,
        completedItems: 0,
        failedItems: itemsToDelete.length,
        error: error instanceof Error ? error.message : 'Failed to delete items',
      });
      
      setShowDeleteModal(false);
      setBatchProgress(undefined);
    },
  });

  // Create drop operation callbacks for database persistence
  const dropCallbacks: DropOperationCallbacks = useMemo(
    () => ({
      onReorder: async (
        parentId: string,
        _itemIds: string[],
        newOrder: string[]
      ) => {
        console.log(
          '🔄 [WorkspaceContainer] Executing REORDER database update:',
          {
            parentId: parentId.slice(0, 8),
            newOrder: newOrder.map(id => id.slice(0, 8)),
          }
        );

        // Show loading notification for reorder
        const reorderBatchId = `reorder-${Date.now()}`;
        eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_START, {
          batchId: reorderBatchId,
          totalItems: newOrder.length,
          completedItems: 0,
          items: newOrder.map(id => ({ id, name: '', type: 'file' as const })), // We don't have names here
        }, {
          priority: NotificationPriority.LOW,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0, // Keep showing until complete
        });

        try {
          const result = await updateItemOrderAction(parentId, newOrder);
          if (result.success) {
            console.log('✅ [WorkspaceContainer] REORDER succeeded');
            
            // Emit success notification
            eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_SUCCESS, {
              batchId: reorderBatchId,
              totalItems: newOrder.length,
              completedItems: newOrder.length,
              items: newOrder.map(id => ({ id, name: '', type: 'file' as const })),
            }, {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            });
          } else {
            throw new Error(result.error || 'Failed to update order');
          }
        } catch (error) {
          console.error('❌ [WorkspaceContainer] REORDER failed:', error);
          
          // Emit error notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_REORDER_ERROR, {
            batchId: reorderBatchId,
            totalItems: newOrder.length,
            completedItems: 0,
            failedItems: newOrder.length,
            items: newOrder.map(id => ({ id, name: '', type: 'file' as const })),
            error: error instanceof Error ? error.message : 'Failed to update order',
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          });
          
          throw error; // Re-throw to prevent local state update
        }
      },
      onMove: async (
        itemIds: string[],
        _fromParentId: string,
        toParentId: string
      ) => {
        console.log('➡️ [WorkspaceContainer] Executing MOVE database update:', {
          items: itemIds.map(id => id.slice(0, 8)),
          to: toParentId.slice(0, 8),
        });

        // Show loading notification for move
        const moveBatchId = `move-${Date.now()}`;
        eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_START, {
          batchId: moveBatchId,
          totalItems: itemIds.length,
          completedItems: 0,
          items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
        }, {
          priority: NotificationPriority.MEDIUM,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0, // Keep showing until complete
        });

        try {
          const results = await Promise.all(
            itemIds.map(itemId => moveItemAction(itemId, toParentId))
          );

          const failed = results.filter(r => !r.success);
          if (failed.length > 0) {
            throw new Error(
              `Failed to move ${failed.length} of ${itemIds.length} items`
            );
          }

          console.log('✅ [WorkspaceContainer] MOVE succeeded');
          
          // Emit success notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_SUCCESS, {
            batchId: moveBatchId,
            totalItems: itemIds.length,
            completedItems: itemIds.length,
            items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
          }, {
            priority: NotificationPriority.LOW,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 2000,
          });
        } catch (error) {
          console.error('❌ [WorkspaceContainer] MOVE failed:', error);
          
          // Emit error notification
          eventBus.emitNotification(NotificationEventType.WORKSPACE_ITEMS_MOVE_ERROR, {
            batchId: moveBatchId,
            totalItems: itemIds.length,
            completedItems: 0,
            failedItems: itemIds.length,
            items: itemIds.map(id => ({ id, name: '', type: 'file' as const })),
            error: error instanceof Error ? error.message : 'Failed to move items',
          }, {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          });
          
          throw error; // Re-throw to prevent local state update
        }
      },
    }),
    []
  );

  // Create rename operation callback for database persistence
  const renameCallback = useCallback(
    async (itemId: string, newName: string, itemType: 'file' | 'folder') => {
      try {
        const result =
          itemType === 'folder'
            ? await renameFolderAction(itemId, newName)
            : await renameFileAction(itemId, newName);

        if (result.success) {
          // Use event-driven notifications
          if (itemType === 'folder') {
            eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_RENAME_SUCCESS, {
              folderId: itemId,
              folderName: newName,
            }, {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            });
          } else {
            eventBus.emitNotification(NotificationEventType.WORKSPACE_FILE_RENAME_SUCCESS, {
              fileId: itemId,
              fileName: newName,
              fileSize: 0, // We don't have this info here
            }, {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 2000,
            });
          }
        } else {
          throw new Error(result.error || `Failed to rename ${itemType}`);
        }
      } catch (error) {
        // Use event-driven error notification
        const errorMessage = error instanceof Error ? error.message : `Failed to rename ${itemType}`;
        
        eventBus.emitNotification(
          itemType === 'folder' 
            ? NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR 
            : NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
          {
            ...(itemType === 'folder' 
              ? { folderId: itemId, folderName: newName }
              : { fileId: itemId, fileName: newName, fileSize: 0 }),
            error: errorMessage,
          },
          {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          }
        );
        
        throw error; // Re-throw to prevent local state update
      }
    },
    []
  );

  // Create context menu provider for tree items
  const contextMenuProvider: ContextMenuProvider = useCallback(
    (item: TreeItem, itemInstance: any) => {
      const menuItems: ContextMenuItem[] = [];

      // Don't show context menu for workspace root
      if (item.id === workspaceData?.workspace?.id) {
        return null;
      }

      // Get selected items to determine single vs multiple selection
      const tree = itemInstance?.getTree?.();
      const selectedTreeItems = tree?.getSelectedItems?.() || [];
      const isItemSelected = selectedTreeItems.some((si: any) => si.getId() === item.id);
      const isMultipleSelection = isItemSelected && selectedTreeItems.length > 1;
      const deleteCount = isMultipleSelection ? selectedTreeItems.length : 1;

      // Only show rename for single selection
      if (!isMultipleSelection) {
        menuItems.push({
          label: 'Rename',
          icon: <Edit2 className='h-4 w-4' />,
          onClick: () => {
            itemInstance.startRenaming();
          },
        });
      }

      // Delete is always available
      menuItems.push({
        label: deleteCount > 1 ? `Delete ${deleteCount} items` : 'Delete',
        icon: <Trash2 className='h-4 w-4' />,
        destructive: true,
        onClick: () => {
          // If multiple items are selected, delete all of them
          // Otherwise, just delete the right-clicked item
          let itemsToDeleteArray: BatchOperationItem[] = [];
          
          if (isMultipleSelection) {
            // Multiple items selected and the right-clicked item is one of them
            // Delete all selected items
            itemsToDeleteArray = selectedTreeItems.map((selectedItem: any) => {
              const itemData = selectedItem.getItemData();
              return {
                id: selectedItem.getId(),
                name: selectedItem.getItemName?.() || itemData?.name || 'Unknown',
                type: selectedItem.isFolder?.() ? 'folder' : 'file',
              } as BatchOperationItem;
            });
          } else {
            // Single item or right-clicked item is not in selection
            // Just delete the right-clicked item
            itemsToDeleteArray = [{
              id: item.id,
              name: item.name,
              type: isFolder(item) ? 'folder' : 'file',
            }];
          }
          
          setItemsToDelete(itemsToDeleteArray);
          setShowDeleteModal(true);
        },
      });

      // Folder-specific items - only show for single selection
      if (isFolder(item) && !isMultipleSelection) {
        menuItems.push({ separator: true });

        menuItems.push({
          label: 'New Folder',
          icon: <FolderPlus className='h-4 w-4' />,
          onClick: async () => {
            // Prompt for folder name
            const folderName = prompt('Enter folder name:');
            if (!folderName || !folderName.trim()) return;
            
            try {
              // Create folder inside the selected folder
              const result = await createFolderAction(folderName.trim(), item.id);
              
              if (result.success && result.data) {
                // Add to tree immediately for responsive UI
                if (treeInstance?.addFolderToTree) {
                  treeInstance.addFolderToTree(result.data);
                }
                
                // Use event-driven notification system
                eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_SUCCESS, {
                  folderId: result.data.id,
                  folderName: result.data.name,
                  parentId: item.id,
                });
              } else {
                eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
                  folderId: '', // No ID since creation failed
                  folderName: folderName.trim(),
                  parentId: item.id,
                  error: result.error || 'Failed to create folder',
                });
              }
            } catch (error) {
              eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_CREATE_ERROR, {
                folderId: '', // No ID since creation failed
                folderName: folderName.trim(),
                parentId: item.id,
                error: error instanceof Error ? error.message : 'Failed to create folder',
              });
            }
          },
        });

        menuItems.push({
          label: 'Generate Link',
          icon: <Link2 className='h-4 w-4' />,
          onClick: async () => {
            try {
              const result = await generateLinkFromFolderAction({ folderId: item.id });
              
              if (result.success && result.data) {
                // Build the link URL
                const linkUrl = generateLinkUrl(
                  result.data.slug,
                  result.data.topic || null,
                  { absolute: true }
                );
                
                // Use event-driven notification system for success
                eventBus.emitNotification(NotificationEventType.LINK_GENERATE_SUCCESS, {
                  linkId: result.data.id,
                  linkTitle: result.data.title || item.name,
                  linkUrl: linkUrl,
                  linkType: 'generated' as const,
                  folderName: item.name,
                });
                
                // Show interactive notification with copy and view actions
                showGeneratedLinkNotification({
                  linkId: result.data.id,
                  linkUrl,
                  folderName: item.name,
                });
              } else {
                // Use event-driven notification system for error
                eventBus.emitNotification(NotificationEventType.LINK_GENERATE_ERROR, {
                  linkId: '', // No ID since generation failed
                  linkTitle: item.name,
                  folderName: item.name,
                  error: result.error || 'Failed to generate link',
                });
              }
            } catch (error) {
              eventBus.emitNotification(NotificationEventType.LINK_GENERATE_ERROR, {
                linkId: '', // No ID since generation failed
                linkTitle: item.name,
                folderName: item.name,
                error: error instanceof Error ? error.message : 'Failed to generate link',
              });
            }
          },
        });
      }

      return menuItems;
    },
    [workspaceData?.workspace?.id, treeInstance, setItemsToDelete, setShowDeleteModal]
  );

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
  
  // Handle external file drops from outside the application
  const handleExternalFileDrop = useCallback((files: File[], targetFolderId: string | null, folderStructure?: { [folder: string]: File[] }) => {
    console.log('📁 External files dropped:', {
      fileCount: files.length,
      targetFolderId,
      fileNames: files.map(f => f.name),
      hasFolderStructure: !!folderStructure
    });
    
    // Store dropped files for processing
    setDroppedFiles({ files, targetFolderId });
    
    // TODO: Handle folder structure by creating folders first if needed
    if (folderStructure) {
      console.log('📂 Folder structure detected:', Object.keys(folderStructure));
      // In the future, we could automatically create the folder structure
      // For now, we'll just upload all files to the target folder
    }
    
    // Open upload modal to handle the files
    // Access the store directly since we're in a callback
    useWorkspaceModalStore.getState().openUploadModal(workspaceData?.workspace?.id, targetFolderId || undefined);
  }, [workspaceData?.workspace?.id]);

  // Handle tree ready callback and extend with needed methods
  const handleTreeReady = useCallback(
    (tree: any) => {
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
            parentId:
              folder.parentFolderId || workspaceData?.workspace?.id || null,
            path: folder.path || '/',
            depth: folder.depth || 0,
            fileCount: 0,
            totalSize: 0,
            isArchived: false,
            sortOrder: folder.sortOrder || 999,
            children: [],
            record: folder,
          };

          const parentId =
            folder.parentFolderId || workspaceData?.workspace?.id || '';
          addTreeItem(tree, parentId, treeFolder, treeIdRef.current);
        },
        // Add a method to add file after successful server action
        addFileToTree: (file: any) => {
          if (!tree || !treeIdRef.current || !file) return;

          const treeFile: TreeFileItem = {
            id: file.id,
            name: file.fileName || file.originalName || file.name || 'Unnamed',
            type: 'file',
            parentId: file.folderId || workspaceData?.workspace?.id || null,
            mimeType: file.mimeType || 'application/octet-stream',
            fileSize: file.fileSize || 0,
            extension:
              file.extension || file.fileName?.split('.').pop() || null,
            thumbnailPath: file.thumbnailPath || null,
            processingStatus: file.processingStatus || 'completed',
            sortOrder: file.sortOrder || 999,
            record: file,
          };

          const parentId = file.folderId || workspaceData?.workspace?.id || '';
          addTreeItem(tree, parentId, treeFile, treeIdRef.current);
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
    },
    [selectionMode, isTouchDevice, workspaceData?.workspace?.id]
  );

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
  
  // Listen for folder drop info events
  React.useEffect(() => {
    const handleFolderDropInfo = (data: any) => {
      // Show notification about folders that can't be uploaded
      eventBus.emitNotification(NotificationEventType.WORKSPACE_FOLDER_DROPPED, {
        fileCount: data.fileCount || 0,
        folderCount: data.folderCount || 1,
        message: data.message || 'Folders detected in drop',
      }, {
        priority: NotificationPriority.LOW,
        uiType: NotificationUIType.TOAST_SIMPLE,
        duration: 5000,
      });
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
                    onSearchChange={query => setSearchQuery(query)}
                    showFileSize={true}
                    showFileDate={false}
                    showFileStatus={false}
                    showFolderCount={true}
                    showFolderSize={false}
                    dropCallbacks={dropCallbacks}
                    renameCallback={renameCallback}
                    contextMenuProvider={contextMenuProvider}
                    onExternalFileDrop={handleExternalFileDrop}
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
        onClose={() => {
          closeUploadModal();
          // Clear dropped files after closing modal
          setDroppedFiles(null);
        }}
        workspaceId={modalWorkspaceId || workspaceData?.workspace?.id}
        {...(droppedFiles?.targetFolderId && { folderId: droppedFiles.targetFolderId })}
        onFileUploaded={treeInstance?.addFileToTree}
        {...(droppedFiles?.files && { initialFiles: droppedFiles.files })}
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

// Maintain backward compatibility
export const HomeContainer = WorkspaceContainer;
