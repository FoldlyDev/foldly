'use client';

import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react';
import { useTreeFactory } from '../../hooks/tree/use-tree-factory';
import { 
  baseLinkTreeConfig, 
  topicLinkTreeConfig, 
  generatedLinkTreeConfig,
  type TreeConfiguration 
} from '../../lib/tree-configs';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import { batchDeleteLinkItemsAction } from '../../lib/actions/link-file-actions';
import { useQueryClient } from '@tanstack/react-query';
import { filesQueryKeys } from '../../lib/query-keys';
import type { LinkListItem } from '../../types/links';
import type { File, Folder } from '@/lib/database/types';
import type { LinkType } from '../../types';
import type { TreeItem } from '@/components/file-tree/types';
import { isFolder } from '@/components/file-tree/types';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

export interface LinkTreeProps {
  linkData: LinkListItem;
  linkType: LinkType;
  files: File[];
  folders?: Folder[];
  onFilesSelected?: (fileIds: string[]) => void;
  onRefresh?: () => void;
}

/**
 * Link tree component that uses the tree factory with appropriate configuration
 * based on the link type. This component is fully modular and reusable.
 */
export function LinkTree({
  linkData,
  linkType,
  files,
  folders = [],
  onFilesSelected,
  onRefresh,
}: LinkTreeProps) {
  // Select the appropriate configuration based on link type
  const treeConfig: TreeConfiguration = useMemo(() => {
    switch (linkType) {
      case 'base':
        return baseLinkTreeConfig;
      case 'custom':
        return topicLinkTreeConfig;
      case 'generated':
        return generatedLinkTreeConfig;
      default:
        return baseLinkTreeConfig;
    }
  }, [linkType]);

  // Transform data to tree structure
  const treeData = useMemo(() => {
    // Create a virtual root for the link
    const linkRoot = {
      id: linkData.id,
      name: linkData.title,
      userId: 'system', // Virtual user
      createdAt: linkData.createdAt,
      updatedAt: linkData.createdAt,
    };
    
    // Transform folders and files to tree structure
    return transformToTreeStructure(folders, files, linkRoot);
  }, [linkData, folders, files]);
  
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Tree operation handlers - Only delete is implemented for link owners
  const handleDelete = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0 || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Call the server action to delete items
      const result = await batchDeleteLinkItemsAction(itemIds, linkData.id);
      
      if (result.success) {
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.linkFiles(linkData.id),
        });
        
        // Call refresh callback if provided
        onRefresh?.();
        
        // Show success notification (if notification system is available)
        console.log(`Successfully deleted ${result.data?.deletedFiles || 0} files and ${result.data?.deletedFolders || 0} folders`);
      } else {
        // Show error notification
        console.error('Failed to delete items:', result.error);
      }
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [linkData.id, isDeleting, queryClient, onRefresh]);
  
  const handleDownload = useCallback(async (itemIds: string[]) => {
    console.log('Download items:', itemIds);
    // TODO: Implement download action if needed
  }, []);
  
  // These operations are not available for link owners
  const handleRename = undefined; // Link owners cannot rename
  const handleCreateFolder = undefined; // Link owners cannot create folders
  const handleMove = undefined; // Link owners cannot move items
  const handleReorder = undefined; // Link owners cannot reorder items
  
  // Use tree factory to create configured tree - pass only defined handlers
  const factoryProps: Parameters<typeof useTreeFactory>[0] = {
    treeId: `${linkType}-link-${linkData.id}`,
    config: treeConfig,
    data: treeData,
  };
  
  // Only add handlers that are defined
  if (treeConfig.features.delete && handleDelete) {
    factoryProps.onDelete = handleDelete;
  }
  if (handleDownload) {
    factoryProps.onDownload = handleDownload;
  }
  if (onFilesSelected) {
    factoryProps.onSelectionChange = onFilesSelected;
  }
  
  const { treeProps } = useTreeFactory(factoryProps);
  
  // Check if we have data to display
  const hasData = Object.keys(treeData).length > 0;
  
  if (!hasData) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-empty">
          <p className="files-tree-empty-text">No files or folders yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="files-tree-wrapper">
      <div className="files-tree-content">
        <Suspense
          fallback={
            <div className="files-tree-loading">
              <div className="files-tree-spinner" />
            </div>
          }
        >
          <FileTree 
            {...treeProps} 
            initialExpandedItems={[linkData.id]} 
          />
        </Suspense>
      </div>
    </div>
  );
}