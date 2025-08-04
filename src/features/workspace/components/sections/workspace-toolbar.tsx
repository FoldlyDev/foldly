'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import { Input } from '@/components/ui/core/shadcn/input';
import {
  FolderPlus,
  Upload,
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
} from '@/components/ui/core/shadcn/dropdown-menu';
import { useWorkspaceUI } from '../../hooks/use-workspace-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFolderAction, batchDeleteItemsAction } from '../../lib/actions';
import { workspaceQueryKeys } from '../../lib/query-keys';
import { setDragOperationActive } from '../../lib/tree-data';
import { toast } from 'sonner';
import {
  BatchOperationModal,
  type BatchOperationItem,
  type BatchOperationProgress,
} from '../modals/batch-operation-modal';

interface WorkspaceToolbarProps {
  className?: string;
  treeInstance?: {
    getSelectedItems?: () => Array<{
      getId: () => string;
      getItemName: () => string;
      isFolder: () => boolean;
    }>;
    getItemInstance?: (
      id: string
    ) => { expand: () => void; isExpanded: () => boolean } | null;
    addFolder?: (name: string, parentId?: string) => string | null;
    deleteItems?: (itemIds: string[]) => void;
    expandAll?: () => void;
    collapseAll?: () => void;
    isTouchDevice?: () => boolean;
    isSelectionMode?: () => boolean;
    setSelectionMode?: (mode: boolean) => void;
  };
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

  const { openUploadModal } = useWorkspaceUI();
  
  // Get mobile state from tree instance
  const isMobile = treeInstance?.isTouchDevice?.() || false;
  
  // Use external selection mode state if provided, otherwise fallback to tree instance
  const isSelectionMode = selectionMode ?? (treeInstance?.isSelectionMode?.() || false);
  
  // Handle selection mode toggle
  const handleToggleSelectionMode = () => {
    const newMode = !isSelectionMode;
    // Update external state if handler provided
    if (onSelectionModeChange) {
      onSelectionModeChange(newMode);
    }
    // Also update tree instance if available
    if (treeInstance?.setSelectionMode) {
      treeInstance.setSelectionMode(newMode);
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

      // Set operation active to prevent data rebuilds during batch operation
      setDragOperationActive(true);

      try {
        // Initialize progress
        setBatchProgress({
          completed: 0,
          total: totalItems,
          failed: [],
        });

        // Update the tree UI immediately
        if (treeInstance?.deleteItems) {
          treeInstance.deleteItems(selectedItems);
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
      } finally {
        // Always clear operation state
        setDragOperationActive(false);
      }
    },
    onSuccess: () => {
      // Mark cache as stale but don't refetch immediately
      queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.tree(),
        refetchType: 'none',
      });
      onClearSelection?.();
    },
    onError: error => {
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
      const selectedItems = treeInstance?.getSelectedItems?.() || [];
      const parentFolderId =
        selectedItems.length > 0 ? selectedItems[0]?.getId() : undefined;

      // Add to tree UI immediately
      if (treeInstance?.addFolder) {
        treeInstance.addFolder(trimmedName, parentFolderId);
      }

      const result = await createFolderAction(trimmedName, parentFolderId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create folder');
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
      const selectedTreeItems = treeInstance?.getSelectedItems?.() || [];
      return selectedItems
        .map(id => {
          const treeItem = selectedTreeItems.find(item => {
            try {
              return item?.getId?.() === id;
            } catch {
              return false;
            }
          });

          let name = 'Unknown';
          let type: 'file' | 'folder' = 'file';

          try {
            name = treeItem?.getItemName?.() || 'Unknown';
          } catch {
            name = 'Unknown';
          }

          try {
            type = treeItem?.isFolder?.() === true ? 'folder' : 'file';
          } catch {
            type = 'file';
          }

          return { id, name, type };
        })
        .filter(item => item.name !== 'Unknown'); // Filter out invalid items
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
    const selectedTreeItems = treeInstance?.getSelectedItems?.() || [];
    const selectedFolders = selectedTreeItems.filter(item => item.isFolder?.());

    if (selectedFolders.length === 1) {
      return selectedFolders[0]?.getItemName?.() || 'Selected Folder';
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
                <span>{isMobile ? (isSelectionMode ? 'Exit' : 'Select') : 'Select'}</span>
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
        <div className='flex items-center justify-between px-6 py-2 bg-blue-50 border-b border-[var(--neutral-200)]'>
          <div className='flex items-center gap-3'>
            <span className='text-sm font-medium text-blue-700'>
              {selectedItems.length > 0 ? (
                <>
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                  selected
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
                className='h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50'
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
              {isMobile && isSelectionMode && selectedItems.length === 0 ? 'Cancel' : 'Clear'}
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
