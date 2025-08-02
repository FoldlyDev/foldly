'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/core/shadcn/dropdown-menu';
import { useLinkUI } from '../../hooks/use-link-ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { batchDeleteLinkItemsAction } from '../../lib/actions';
import { useStagingStore } from '../../stores/staging-store';
import { useBatchUpload } from '../../hooks/use-batch-upload';
import { linkQueryKeys } from '../../lib/query-keys';
import { setDragOperationActive } from '../../lib/tree-data';
import { toast } from 'sonner';
import {
  BatchOperationModal,
  type BatchOperationItem,
  type BatchOperationProgress,
} from '../modals/batch-operation-modal';
import type { LinkWithOwner } from '../../types';

interface LinkUploadToolbarProps {
  className?: string;
  linkData: LinkWithOwner;
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
    rebuildTree?: () => void; // Add this for manual tree rebuilds
  };
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedItems?: string[];
  onClearSelection?: () => void;
}

export function LinkUploadToolbar({
  className = '',
  linkData,
  treeInstance,
  searchQuery = '',
  setSearchQuery,
  selectedItems = [],
  onClearSelection,
}: LinkUploadToolbarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState<
    BatchOperationProgress | undefined
  >();
  const queryClient = useQueryClient();

  const { openUploadModal } = useLinkUI();
  
  // Get staging state
  const {
    hasStagedItems,
    getStagedItemCount,
    getAllStagedItems,
    isUploading: stagingIsUploading,
    uploadProgress,
    setIsUploading,
    updateUploadProgress,
    clearStaged,
    uploaderName,
    uploaderEmail,
    uploaderMessage,
  } = useStagingStore();
  
  const stagedItemCount = getStagedItemCount();
  const hasStaged = hasStagedItems();

  // Get brand color for styling
  const brandColor = linkData.brandEnabled && linkData.brandColor ? linkData.brandColor : '#3b82f6';

  // Use the batch upload hook (now fixed to handle large files properly)
  const { uploadBatch, isUploading: batchIsUploading, progress: batchUploadProgress } = useBatchUpload();

  // Batch upload mutation with improved file handling
  const batchUploadMutation = useMutation({
    mutationFn: async () => {
      const { files, folders } = getAllStagedItems();
      
      return await uploadBatch({
        files: files.map(file => ({
          id: file.id,
          file: file.file,
          parentFolderId: file.parentFolderId,
          uploaderName: file.uploaderName,
        })),
        folders: folders.map(folder => ({
          id: folder.id,
          name: folder.name,
          parentFolderId: folder.parentFolderId,
        })),
        linkId: linkData.id,
        // linkSlug is not needed since we're uploading from within the link context
        uploaderName,
        uploaderEmail,
        uploaderMessage,
      });
    },
    onMutate: () => {
      setIsUploading(true);
      // Reset progress counters
      updateUploadProgress({ completed: 0, failed: 0 });
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Extract the actual counts from the result
        const uploadedFiles = result.data?.uploadedFiles || 0;
        const createdFolders = result.data?.createdFolders || 0;
        
        // Build a grammatically correct success message
        let message = 'Uploaded ';
        const parts: string[] = [];
        
        // Add folders to message if any were created
        if (createdFolders > 0) {
          parts.push(`${createdFolders} ${createdFolders === 1 ? 'folder' : 'folders'}`);
        }
        
        // Add files to message if any were uploaded
        if (uploadedFiles > 0) {
          parts.push(`${uploadedFiles} ${uploadedFiles === 1 ? 'file' : 'files'}`);
        }
        
        // Create the final message
        if (parts.length > 0) {
          message += parts.join(' and ');
          toast.success(message);
        } else {
          // Fallback for edge case where nothing was successfully processed
          toast.warning('No items were uploaded');
        }
        
        // Update progress to show completion
        if (result.progress) {
          updateUploadProgress({
            completed: result.progress.completed,
            failed: result.progress.failed,
          });
        }
        
        clearStaged();
        
        // Clear tree selection after successful upload
        if (onClearSelection) {
          onClearSelection();
        }
        
        // Refresh tree data
        queryClient.invalidateQueries({ queryKey: linkQueryKeys.tree(linkData.id) });
      } else {
        toast.error(result.error || 'Upload failed');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Main upload handler for staged items
  const handleMainUpload = async () => {
    if (!hasStaged || stagingIsUploading) return;
    
    batchUploadMutation.mutate();
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

        const result = await batchDeleteLinkItemsAction(linkData.id, selectedItems);

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
        queryKey: linkQueryKeys.tree(linkData.id),
        refetchType: 'none',
      });
      onClearSelection?.();
    },
    onError: error => {
      // If database deletion fails, restore the tree state with immediate refetch
      queryClient.invalidateQueries({ queryKey: linkQueryKeys.tree(linkData.id) });
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

  // Get staging store methods
  const { addFolder: addStagedFolder, uploaderName: stagingUploaderName } = useStagingStore();

  // Create folder mutation - now stages the folder instead of creating it immediately
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

      // Add to staging store - this will increment version and trigger tree rebuild
      const stagingId = addStagedFolder(trimmedName, parentFolderId);

      return { id: stagingId, name: trimmedName, parentFolderId };
    },
    onSuccess: () => {
      toast.success('Folder staged for upload');
      setNewFolderName('');
      setIsCreatingFolder(false);
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to stage folder'
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
      console.warn('Error in getBatchOperationItems:', error);
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
      return 'Link Root';
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
      <div className='link-upload-toolbar-main bg-card border rounded-lg p-4 shadow-sm'>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side - Main actions */}
          <div className='link-upload-toolbar-left flex flex-wrap items-center gap-3'>
            {/* Main Upload Button - Only show when there are staged items */}
            {hasStaged && (
              <Button
                onClick={handleMainUpload}
                disabled={stagingIsUploading}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
                style={{
                  background: linkData.brandEnabled && linkData.brandColor && !stagingIsUploading
                    ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                    : undefined
                }}
              >
                {stagingIsUploading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    <span>
                      {batchUploadProgress?.currentItem 
                        ? batchUploadProgress.currentItem 
                        : `Uploading (${batchUploadProgress?.completed || uploadProgress.completed}/${batchUploadProgress?.total || uploadProgress.total})`
                      }
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className='h-4 w-4' />
                    <span>Upload {stagedItemCount} Item{stagedItemCount !== 1 ? 's' : ''}</span>
                  </>
                )}
              </Button>
            )}
            
            {/* Add Files button */}
            <Button
              onClick={() => openUploadModal(linkData.id)}
              variant={hasStaged ? "outline" : "default"}
              className={hasStaged ? "gap-2" : "gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"}
              style={{
                background: linkData.brandEnabled && linkData.brandColor && !hasStaged
                  ? `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`
                  : undefined
              }}
            >
              <Upload className='h-4 w-4' />
              Add Files
            </Button>

            {/* Create folder */}
            {isCreatingFolder ? (
              <div className='link-upload-folder-creation flex items-center gap-2'>
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
                  className='h-9 w-40'
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
            ) : (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setIsCreatingFolder(true)}
                className="gap-2"
              >
                <FolderPlus className='h-4 w-4' />
                New Folder
              </Button>
            )}

            {isCreatingFolder && (
              <span className='text-xs text-muted-foreground'>
                Creating in: {getTargetFolderName()}
              </span>
            )}
          </div>

          {/* Right side - Search and menu */}
          <div className='link-upload-toolbar-right flex items-center gap-3'>
            {/* Search */}
            <div className='relative'>
              <Input
                type='text'
                placeholder='Search files and folders...'
                value={searchQuery}
                onChange={e => setSearchQuery?.(e.target.value)}
                className='h-9 w-64 pl-9'
              />
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            </div>

            {/* More options menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size='sm' variant='outline'>
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

        {/* Mini-actions toolbar - shows when items are selected */}
        {selectedItems.length > 0 && (
          <div className='flex items-center justify-between px-4 py-3 mt-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <div className='flex items-center gap-3'>
              <span className='text-sm font-medium text-blue-700'>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
                selected
              </span>
            </div>

            <div className='flex items-center gap-2'>
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

              <Button
                size='sm'
                variant='ghost'
                className='h-8 px-3'
                onClick={onClearSelection}
              >
                <X className='h-4 w-4 mr-2' />
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

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