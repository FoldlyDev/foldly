'use client';

import React, { lazy, Suspense, useMemo } from 'react';
import { useTreeFactory } from '../../hooks/tree/use-tree-factory';
import { 
  baseLinkTreeConfig, 
  topicLinkTreeConfig, 
  generatedLinkTreeConfig,
  type TreeConfiguration 
} from '../../lib/tree-configs';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import type { LinkListItem } from '../../types/links';
import type { File, Folder } from '@/lib/database/types';
import type { LinkType } from '../../types';

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
      case 'topic':
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
  
  // Tree operation handlers (only used for interactive trees)
  const handleRename = async (itemId: string, newName: string) => {
    console.log('Rename item:', itemId, 'to:', newName);
    // TODO: Implement rename action via server action
    onRefresh?.();
  };
  
  const handleDelete = async (itemIds: string[]) => {
    console.log('Delete items:', itemIds);
    // TODO: Implement delete action via server action
    onRefresh?.();
  };
  
  const handleDownload = async (itemIds: string[]) => {
    console.log('Download items:', itemIds);
    // TODO: Implement download action
  };
  
  const handleCreateFolder = async (parentId: string, name: string) => {
    console.log('Create folder:', name, 'in parent:', parentId);
    // TODO: Implement create folder action via server action
    onRefresh?.();
  };
  
  const handleMove = async (itemIds: string[], fromParentId: string, toParentId: string) => {
    console.log('Move items:', itemIds, 'from:', fromParentId, 'to:', toParentId);
    // TODO: Implement move action via server action
    onRefresh?.();
  };
  
  const handleReorder = async (parentId: string, oldOrder: string[], newOrder: string[]) => {
    console.log('Reorder in:', parentId, 'new order:', newOrder);
    // TODO: Implement reorder action
    onRefresh?.();
  };
  
  // Use tree factory to create configured tree
  const { treeProps } = useTreeFactory({
    treeId: `${linkType}-link-${linkData.id}`,
    config: treeConfig,
    data: treeData,
    onRename: treeConfig.features.rename ? handleRename : undefined,
    onDelete: treeConfig.features.delete ? handleDelete : undefined,
    onDownload: handleDownload,
    onCreateFolder: treeConfig.permissions.canCreateFolder ? handleCreateFolder : undefined,
    onMove: treeConfig.features.dragDrop ? handleMove : undefined,
    onReorder: treeConfig.features.dragDrop ? handleReorder : undefined,
    onSelectionChange: onFilesSelected,
  });
  
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