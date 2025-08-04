'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/shallow';
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

// Import extracted components
import { ToolbarSearch } from '../toolbar/ToolbarSearch';
import { FolderCreation } from '../toolbar/FolderCreation';
import { UploadActions } from '../toolbar/UploadActions';
import { ViewControls } from '../toolbar/ViewControls';
import { SelectionActions } from '../toolbar/SelectionActions';

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
    rebuildTree?: () => void;
  };
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedItems?: string[];
  onClearSelection?: () => void;
  selectedFolderId?: string;
  selectedFolderName?: string;
}

export function LinkUploadToolbar({
  className = '',
  linkData,
  treeInstance,
  searchQuery = '',
  setSearchQuery,
  selectedItems = [],
  onClearSelection,
  selectedFolderId,
  selectedFolderName = 'Link Root',
}: LinkUploadToolbarProps) {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchProgress, setBatchProgress] = useState<
    BatchOperationProgress | undefined
  >();
  const queryClient = useQueryClient();

  // Get staging state - with useShallow to prevent infinite loops
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
  } = useStagingStore(
    useShallow((state) => ({
      hasStagedItems: state.hasStagedItems,
      getStagedItemCount: state.getStagedItemCount,
      getAllStagedItems: state.getAllStagedItems,
      isUploading: state.isUploading,
      uploadProgress: state.uploadProgress,
      setIsUploading: state.setIsUploading,
      updateUploadProgress: state.updateUploadProgress,
      clearStaged: state.clearStaged,
      uploaderName: state.uploaderName,
      uploaderEmail: state.uploaderEmail,
      uploaderMessage: state.uploaderMessage,
    }))
  );
  
  const stagedItemCount = getStagedItemCount();
  const hasStaged = hasStagedItems();

  // Batch upload hook
  const {
    uploadBatch,
    isUploading: batchIsUploading,
    progress: batchUploadProgress,
  } = useBatchUpload({
    linkId: linkData.id,
    onComplete: async results => {
      clearStaged();
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(
          `Successfully uploaded ${successCount} item${successCount !== 1 ? 's' : ''}`
        );
        
        // Invalidate tree data to refresh the UI
        await queryClient.invalidateQueries({
          queryKey: linkQueryKeys.tree(linkData.id),
        });
      }
      
      if (failCount > 0) {
        toast.error(
          `Failed to upload ${failCount} item${failCount !== 1 ? 's' : ''}`
        );
      }

      setIsUploading(false);
      updateUploadProgress({ completed: 0, total: 0 });
      setBatchProgress(undefined);
    },
    onProgress: progress => {
      updateUploadProgress({
        completed: progress.completed,
        total: progress.total,
      });
      setBatchProgress(progress);
    },
  });

  // Handle main upload button
  const handleMainUpload = async () => {
    if (!hasStaged) return;

    const allItems = getAllStagedItems();
    if (allItems.length === 0) return;

    setIsUploading(true);
    updateUploadProgress({ completed: 0, total: allItems.length });

    try {
      await uploadBatch(allItems, {
        uploaderName: uploaderName || 'Anonymous',
        uploaderEmail: uploaderEmail || undefined,
        uploaderMessage: uploaderMessage || undefined,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
      setIsUploading(false);
      updateUploadProgress({ completed: 0, total: 0 });
    }
  };

  // Delete mutation
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      if (selectedItems.length === 0) {
        throw new Error('No items selected');
      }

      // Set drag operation as active to prevent tree updates during deletion
      setDragOperationActive(true);

      try {
        return await batchDeleteLinkItemsAction({
          linkId: linkData.id,
          itemIds: selectedItems,
        });
      } finally {
        // Reset drag operation state after deletion
        setDragOperationActive(false);
      }
    },
    onSuccess: result => {
      if (result.success) {
        const successCount = result.data?.deletedCount || 0;
        toast.success(
          `Deleted ${successCount} item${successCount !== 1 ? 's' : ''}`
        );

        // Clear selection
        if (onClearSelection) {
          onClearSelection();
        }

        // Invalidate and refetch tree data
        queryClient.invalidateQueries({
          queryKey: linkQueryKeys.tree(linkData.id),
        });
      } else {
        toast.error(result.error || 'Failed to delete items');
      }
      setShowBatchModal(false);
    },
    onError: error => {
      console.error('Delete error:', error);
      toast.error('Failed to delete items. Please try again.');
      setShowBatchModal(false);
    },
  });

  // Helper functions - use props instead of calculating from tree
  const getSelectedFolderId = () => {
    return selectedFolderId;
  };

  const getTargetFolderName = () => {
    return selectedFolderName || 'Link Root';
  };

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
        .filter(item => item.name !== 'Unknown');
    } catch (error) {
      console.warn('Error in getBatchOperationItems:', error);
      return [];
    }
  };

  const handleDelete = () => {
    if (selectedItems.length === 0) return;
    setShowBatchModal(true);
  };

  const handleBatchDeleteConfirm = async () => {
    batchDeleteMutation.mutate();
  };

  const isUploading = stagingIsUploading || batchIsUploading;

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
            <UploadActions
              linkData={linkData}
              hasStaged={hasStaged}
              stagedItemCount={stagedItemCount}
              isUploading={isUploading}
              uploadProgress={batchUploadProgress || uploadProgress}
              onMainUpload={handleMainUpload}
            />

            <FolderCreation
              linkId={linkData.id}
              getSelectedFolderId={getSelectedFolderId}
              getTargetFolderName={getTargetFolderName}
            />

            {/* View controls */}
            <ViewControls
              onExpandAll={treeInstance?.expandAll}
              onCollapseAll={treeInstance?.collapseAll}
            />
          </div>

          {/* Right side - Search and selection */}
          <div className='link-upload-toolbar-right flex items-center gap-3'>
            {/* Search */}
            {setSearchQuery && (
              <ToolbarSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}

            {/* Selection actions */}
            <SelectionActions
              selectedCount={selectedItems.length}
              onDelete={handleDelete}
              onClearSelection={onClearSelection || (() => {})}
              isDeleting={batchDeleteMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Batch operation modal */}
      {showBatchModal && (
        <BatchOperationModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          operation='delete'
          selectedItems={getBatchOperationItems()}
          onConfirm={handleBatchDeleteConfirm}
        />
      )}
    </motion.div>
  );
}