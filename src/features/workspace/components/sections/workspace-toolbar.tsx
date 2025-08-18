'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import {
  FolderPlus,
  Search,
  MoreVertical,
  Minimize2,
  Maximize2,
  X,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
// import { useWorkspaceUI } from '../../hooks/use-workspace-ui'; // TODO: Re-enable when needed
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolderAction, batchDeleteItemsAction } from '../../lib/actions';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { toast } from 'sonner';
import { addTreeItem, removeTreeItem, getTreeId } from '@/components/file-tree/core/tree';
import type { TreeItem as TreeItemType, TreeFolderItem } from '@/components/file-tree/types/tree-types';
import {
  BatchOperationModal,
  type BatchOperationItem,
  type BatchOperationProgress,
} from '../modals/batch-operation-modal';

interface WorkspaceToolbarProps {
  className?: string;
  treeInstance?: any; // Using the new tree instance from @headless-tree/react
  workspaceId?: string; // Need workspace ID for operations
  treeData?: Record<string, TreeItemType>; // Need access to tree data
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedItems?: string[];
  onClearSelection?: () => void;
  selectionMode?: boolean;
  onSelectionModeChange?: (mode: boolean) => void;
}

export function WorkspaceToolbar({
  className = '',
  treeInstance,
  workspaceId,
  treeData = {},
  searchQuery = '',
  setSearchQuery,
  selectedItems = [],
  onClearSelection,
  selectionMode = false,
  onSelectionModeChange,
}: WorkspaceToolbarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState<
    BatchOperationProgress | undefined
  >();
  const queryClient = useQueryClient();

  // const { openUploadModal } = useWorkspaceUI(); // TODO: Re-enable when needed

  // For now, detect mobile using window width
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Use external selection mode state
  const isSelectionMode = selectionMode || false;

  // Handle selection mode toggle
  const handleToggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    // Update external state if handler provided
    if (onSelectionModeChange) {
      onSelectionModeChange(newMode);
    }
  };

  // Collapse all functionality
  const handleCollapseAll = () => {
    if (treeInstance?.collapseAll) {
      treeInstance.collapseAll();
      toast.success('All folders collapsed');
    }
  };

  // Expand all functionality
  const handleExpandAll = () => {
    if (treeInstance?.expandAll) {
      treeInstance.expandAll();
      toast.success('All folders expanded');
    }
  };

  // Enhanced batch delete mutation with progress tracking
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      if (selectedItems.length === 0) {
        throw new Error('No items selected');
      }

      const totalItems = selectedItems.length;

      // Initialize progress
      setBatchProgress({
        completed: 0,
        total: totalItems,
        failed: [],
      });

      // Update the tree UI immediately using new API (following inline toolbar pattern)
      const treeId = getTreeId(treeInstance);
      if (treeInstance && treeId) {
        // Remove items from tree using the new API
        removeTreeItem(treeInstance, selectedItems, treeId);
        
        // Clear selection after deletion
        if (treeInstance.clearSelection) {
          treeInstance.clearSelection();
        }
      }

      // Track progress
      setBatchProgress(prev =>
        prev ? { ...prev, currentItem: 'Processing items...' } : undefined
      );

      const result = await batchDeleteItemsAction(selectedItems);

      if (!result.success) {
        setBatchProgress(prev =>
          prev
            ? {
                ...prev,
                failed: [result.error || 'Unknown error'],
                completed: totalItems,
              }
            : undefined
        );
        throw new Error(result.error || 'Failed to delete items');
      }

      // Mark as complete
      setBatchProgress(prev => {
        if (!prev) return undefined;
        const { currentItem, ...rest } = prev;
        return {
          ...rest,
          completed: totalItems,
        };
      });

      return result.data;
    },
    onSuccess: () => {
      // Mark cache as stale but don't refetch immediately
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
        refetchType: 'none',
      });
      onClearSelection?.();
    },
    onError: () => {
      // If database deletion fails, restore the tree state with immediate refetch
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
    },
    onSettled: () => {
      // Auto-close modal after a delay for successful operations
      if (batchProgress?.completed === selectedItems.length) {
        setTimeout(() => {
          setShowBatchModal(false);
          setBatchProgress(undefined);
        }, 2000);
      }
    },
  });

  // Create folder mutation - simplified
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const trimmedName = folderName.trim();
      if (!trimmedName) {
        throw new Error('Folder name cannot be empty');
      }

      // Get selected folder from tree if available
      const state = treeInstance?.getState?.();
      const selectedTreeItems = state?.selectedItems || [];
      
      // Determine parent folder ID
      let parentFolderId = selectedTreeItems.length > 0 ? selectedTreeItems[0] : undefined;
      
      // Check if the selected item is actually a folder
      if (parentFolderId && treeData[parentFolderId]) {
        const selectedItem = treeData[parentFolderId];
        
        // If selected item is a file, use its parent folder
        if (selectedItem && selectedItem.type === 'file') {
          parentFolderId = selectedItem.parentId || undefined;
        }
      }
      
      // IMPORTANT: If parentFolderId is the workspace ID, set it to undefined
      // The database expects null/undefined for root folders, not the workspace ID
      if (parentFolderId === workspaceId) {
        parentFolderId = undefined;
      }

      // Create folder data with all required fields
      const newFolderId = `folder-temp-${Date.now()}`; // Temp ID until database returns real one
      const newFolder: TreeFolderItem = {
        id: newFolderId,
        name: trimmedName,
        type: 'folder',
        path: '/' + trimmedName,
        depth: 1,
        fileCount: 0,
        totalSize: 0,
        isArchived: false,
        sortOrder: 0,
        children: [],
        parentId: parentFolderId,
      };

      // Add to tree UI immediately using new API
      const treeId = getTreeId(treeInstance);
      
      if (treeInstance && treeId) {
        // Use workspace ID as parent if no parent folder selected (for UI only)
        const targetParentId = parentFolderId || workspaceId;
        
        // Check if folder with this name already exists and add suffix if needed
        if (targetParentId && treeData[targetParentId]) {
          const parentItem = treeData[targetParentId];
          if (parentItem.type === 'folder') {
            const parentFolder = parentItem as TreeFolderItem;
            let finalName = trimmedName;
            let suffix = 2;
            
            // Keep checking for existing names and increment suffix
            while (parentFolder.children?.some(childId => {
              const child = treeData[childId];
              return child && child.name === finalName;
            })) {
              finalName = `${trimmedName} (${suffix})`;
              suffix++;
            }
            
            // Update the folder name if it was changed
            if (finalName !== trimmedName) {
              newFolder.name = finalName;
              newFolder.path = '/' + finalName;
            }
          }
        }
        
        if (targetParentId) {
          addTreeItem(treeInstance, targetParentId, newFolder, treeId);
        }
      }

      // Use the potentially modified name for the database action too
      const finalFolderName = newFolder.name;
      
      const result = await createFolderAction(finalFolderName, parentFolderId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
      }
      
      // Replace temp ID with real database ID if available
      if (result.data?.id && treeData[newFolderId]) {
        // Update the folder with the real ID
        const realFolder = { ...treeData[newFolderId], id: result.data.id };
        delete treeData[newFolderId];
        treeData[result.data.id] = realFolder;
        
        // Update parent's children array if needed
        const targetParentId = parentFolderId || workspaceId;
        if (targetParentId && treeData[targetParentId] && treeData[targetParentId].type === 'folder') {
          const parent = treeData[targetParentId] as TreeFolderItem;
          if (parent.children) {
            const index = parent.children.indexOf(newFolderId);
            if (index !== -1) {
              parent.children[index] = result.data.id;
            }
          }
        }
      }
      
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      toast.success('Folder created successfully');
      setNewFolderName('');
      setIsCreatingFolder(false);
    },
    onError: error => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.tree() });
      toast.error(
        error instanceof Error ? error.message : 'Failed to create folder'
      );
    },
  });

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolderMutation.mutate(newFolderName);
    }
  };

  // Convert selected items to BatchOperationItem format
  const getBatchOperationItems = (): BatchOperationItem[] => {
    try {
      return selectedItems
        .map(id => {
          const item = treeData[id];
          if (!item) {
            return null;
          }

          return {
            id,
            name: item.name,
            type: item.type as 'file' | 'folder',
          };
        })
        .filter((item): item is BatchOperationItem => item !== null);
    } catch (error) {
      // Error in getBatchOperationItems - return empty array
      return [];
    }
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) return;

    // Always show the modal for confirmation (both single and multiple items)
    setShowBatchModal(true);
  };

  const handleBatchDeleteConfirm = async () => {
    batchDeleteMutation.mutate();
  };

  // Get the container folder name for new folder creation
  const getTargetFolderName = () => {
    const selectedFolders = selectedItems.filter(id => {
      const item = treeData[id];
      return item && item.type === 'folder';
    });

    if (selectedFolders.length === 1) {
      const folderId = selectedFolders[0];
      if (folderId) {
        const folder = treeData[folderId];
        return folder?.name || 'Selected Folder';
      }
      return 'Selected Folder';
    } else if (selectedFolders.length > 1) {
      return 'Multiple Folders';
    } else {
      return 'Workspace Root';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
      className={`${className}`}
    >
      {/* Main toolbar */}
      <div className='workspace-toolbar-main'>
        {/* Left side - Main actions */}
        <div className='workspace-toolbar-left'>
          {/* Selection mode toggle - show for all users */}
          <div className='flex items-center mr-3'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={isSelectionMode}
                onChange={handleToggleSelectionMode}
                className='sr-only'
              />
              <Button
                size='sm'
                variant={isSelectionMode ? 'default' : 'ghost'}
                onClick={handleToggleSelectionMode}
                className='flex items-center'
                type='button'
              >
                {isSelectionMode ? (
                  <CheckSquare className='h-4 w-4 mr-2' />
                ) : (
                  <Square className='h-4 w-4 mr-2' />
                )}
                <span>
                  {isMobile ? (isSelectionMode ? 'Exit' : 'Select') : 'Select'}
                </span>
              </Button>
            </label>
          </div>

          {/* Create folder */}
          {isCreatingFolder ? (
            <div className='workspace-folder-creation'>
              <div className='workspace-folder-input-group'>
                <Input
                  type='text'
                  placeholder='Folder name'
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleCreateFolder();
                    } else if (e.key === 'Escape') {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }
                  }}
                  className='workspace-folder-input h-8'
                  autoFocus
                />
                <Button
                  size='sm'
                  onClick={handleCreateFolder}
                  disabled={
                    !newFolderName.trim() || createFolderMutation.isPending
                  }
                >
                  Create
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
              <span className='text-xs text-muted-foreground'>
                Creating in: {getTargetFolderName()}
              </span>
            </div>
          ) : (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className='h-4 w-4 mr-2' />
              New Folder
            </Button>
          )}
        </div>

        {/* Right side - Search and menu */}
        <div className='workspace-toolbar-right'>
          {/* Search - always visible */}
          <div className='workspace-search-container'>
            <Input
              type='text'
              placeholder='Search files and folders...'
              value={searchQuery}
              onChange={e => setSearchQuery?.(e.target.value)}
              className='h-8 w-full pl-8'
            />
            <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          </div>

          {/* More options menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='ghost'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={handleExpandAll}>
                <Maximize2 className='h-4 w-4 mr-2' />
                Expand All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCollapseAll}>
                <Minimize2 className='h-4 w-4 mr-2' />
                Collapse All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mini-actions toolbar - shows when items are selected or in selection mode */}
      {(selectedItems.length > 0 || (isMobile && isSelectionMode)) && (
        <div className='flex items-center justify-between px-6 py-2 bg-tertiary/10 dark:bg-primary/10 border-b border-neutral-200 dark:border-border'>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-tertiary dark:text-primary'>
              {selectedItems.length > 0 ? (
                <>
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? 's' : ''} selected
                </>
              ) : (
                'Tap items to select'
              )}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            {selectedItems.length > 0 && (
              <Button
                size='sm'
                variant='ghost'
                className='h-8 px-3 text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                onClick={handleDelete}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </Button>
            )}

            <Button
              size='sm'
              variant='ghost'
              className='h-8 px-3'
              onClick={() => {
                onClearSelection?.();
                // Exit selection mode on mobile when clearing
                if (isMobile && isSelectionMode) {
                  handleToggleSelectionMode();
                }
              }}
            >
              <X className='h-4 w-4 mr-2' />
              {isMobile && isSelectionMode && selectedItems.length === 0
                ? 'Cancel'
                : 'Clear'}
            </Button>
          </div>
        </div>
      )}

      {/* Batch Delete Modal */}
      <BatchOperationModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false);
          setBatchProgress(undefined);
        }}
        operation='delete'
        items={getBatchOperationItems()}
        onConfirm={handleBatchDeleteConfirm}
        progress={batchProgress}
        isProcessing={batchDeleteMutation.isPending}
      />
    </motion.div>
  );
}
