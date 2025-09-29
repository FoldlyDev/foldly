'use client';

import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react';
import { useTreeFactory } from '../../hooks/tree/use-tree-factory';
import { useLinkContent } from '../../hooks/use-files-data';
import { 
  baseLinkTreeConfig, 
  topicLinkTreeConfig, 
  generatedLinkTreeConfig,
  type TreeConfiguration 
} from '../../lib/tree-configs';
import { transformToTreeStructure } from '@/components/file-tree/utils/transform';
import { batchDeleteLinkItemsAction } from '../../lib/actions/link-file-actions';
import { copyLinkItemsToWorkspaceAction, type CopyItem } from '../../lib/actions/copy-to-workspace-actions';
import { useQueryClient } from '@tanstack/react-query';
import { filesQueryKeys } from '../../lib/query-keys';
import { QueryInvalidationService } from '@/lib/services/query/query-invalidation-service';
import { eventBus, NotificationEventType, NotificationPriority, NotificationUIType } from '@/features/notifications/core';
import type { LinkListItem } from '../../types/links';
import type { LinkType } from '../../types';
import { isFolder } from '@/components/file-tree/types';

// Lazy load the file-tree component
const FileTree = lazy(() => import('@/components/file-tree/core/tree'));

export interface LinkTreeProps {
  linkData: LinkListItem;
  linkType: LinkType;
  onRefresh?: () => void;
}

/**
 * Link tree component that uses the tree factory with appropriate configuration
 * based on the link type. This component is fully modular and reusable.
 * It fetches its own files and folders data.
 */
export function LinkTree({
  linkData,
  linkType,
  onRefresh,
}: LinkTreeProps) {
  // Fetch both files and folders for this specific link
  const { data: linkContent, isLoading: filesLoading, error: filesError } = useLinkContent(linkData.id);
  
  // Extract files and folders from the content
  const files = useMemo(() => {
    if (!linkContent?.files) return [];
    return linkContent.files;
  }, [linkContent]);
  
  const folders = useMemo(() => {
    if (!linkContent?.folders) return [];
    return linkContent.folders;
  }, [linkContent]);
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
  
  // Check if we have actual content (files or folders)
  const hasContent = useMemo(() => {
    return files.length > 0 || folders.length > 0;
  }, [files, folders]);
  
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [treeInstance, setTreeInstance] = useState<any>(null);
  
  // Tree operation handlers - Only delete is implemented for link owners
  const handleDelete = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0 || isDeleting) return;
    
    try {
      setIsDeleting(true);
      
      // Optimistically remove items from tree immediately for responsive UI
      if (treeInstance?.removeItems) {
        treeInstance.removeItems(itemIds);
      }
      
      // Call the server action to delete items
      const result = await batchDeleteLinkItemsAction(itemIds, linkData.id);
      
      if (result.success) {
        // Invalidate queries to refresh data (in case of any server-side changes)
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.linkContent(linkData.id),
        });
        
        // Call refresh callback if provided
        onRefresh?.();
        
        // Show success notification (if notification system is available)
        console.log(`Successfully deleted ${result.data?.deletedFiles || 0} files and ${result.data?.deletedFolders || 0} folders`);
      } else {
        // On error, refresh to restore true state
        await queryClient.invalidateQueries({
          queryKey: filesQueryKeys.linkContent(linkData.id),
        });
        
        // Show error notification
        console.error('Failed to delete items:', result.error);
      }
    } catch (error) {
      // On error, refresh to restore true state
      await queryClient.invalidateQueries({
        queryKey: filesQueryKeys.linkContent(linkData.id),
      });
      console.error('Error deleting items:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [linkData.id, isDeleting, queryClient, onRefresh, treeInstance]);
  
  const handleDownload = useCallback(async (itemIds: string[]) => {
    console.log('Download items:', itemIds);
    // TODO: Implement download action if needed
  }, []);
  
  // Handle copy to workspace
  const handleCopyToWorkspace = useCallback(async (itemIds: string[]) => {
    // Get the actual items data to determine types (defined outside try for catch block access)
    const itemsToCopy: CopyItem[] = itemIds.map(id => {
      const item = treeData[id];
      if (!item) {
        console.warn(`Item ${id} not found in tree data`);
        return null;
      }
      return {
        id: item.id,
        name: item.name,
        type: isFolder(item) ? 'folder' : 'file',
      };
    }).filter(Boolean) as CopyItem[];

    if (itemsToCopy.length === 0) {
      // Use a workspace error event for consistency
      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_FILE_UPLOAD_ERROR,
        { 
          fileId: '',
          fileName: 'No items selected',
          error: 'No valid items selected'
        },
        { priority: NotificationPriority.HIGH, uiType: NotificationUIType.TOAST_SIMPLE, duration: 3000 }
      );
      return;
    }

    try {

      // Show loading notification using copy events
      const copyBatchId = `copy-to-workspace-${Date.now()}`;
      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_ITEMS_COPY_START,
        {
          batchId: copyBatchId,
          totalItems: itemsToCopy.length,
          completedItems: 0,
          items: itemsToCopy.map((item: CopyItem) => ({ 
            id: item.id, 
            name: item.name, 
            type: item.type as 'file' | 'folder' 
          })),
        },
        {
          priority: NotificationPriority.MEDIUM,
          uiType: NotificationUIType.TOAST_SIMPLE,
          duration: 0, // Keep showing until complete
        }
      );

      // Call the server action
      const result = await copyLinkItemsToWorkspaceAction(
        itemsToCopy,
        linkData.id,
        null // Copy to workspace root by default
      );

      if (result.success && result.data) {
        const { copiedFiles, copiedFolders, failedItems } = result.data;
        
        // Use centralized invalidation service to update all workspace queries
        await QueryInvalidationService.invalidateWorkspaceData(queryClient);

        // Show success or partial success message using copy events
        if (failedItems.length === 0) {
          eventBus.emitNotification(
            NotificationEventType.WORKSPACE_ITEMS_COPY_SUCCESS,
            {
              batchId: copyBatchId,
              totalItems: itemsToCopy.length,
              completedItems: itemsToCopy.length,
              items: itemsToCopy.map(item => ({ 
                id: item.id, 
                name: item.name, 
                type: item.type as 'file' | 'folder' 
              })),
            },
            {
              priority: NotificationPriority.LOW,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 3000,
            }
          );
        } else {
          // Use partial success event for partial failures
          eventBus.emitNotification(
            NotificationEventType.WORKSPACE_ITEMS_COPY_PARTIAL,
            {
              batchId: copyBatchId,
              totalItems: itemsToCopy.length,
              completedItems: itemsToCopy.length - failedItems.length,
              failedItems: failedItems.length,
              items: itemsToCopy.map(item => ({ 
                id: item.id, 
                name: item.name, 
                type: item.type as 'file' | 'folder' 
              })),
              error: `Copied ${copiedFiles} files and ${copiedFolders} folders. ${failedItems.length} items failed.`,
            },
            {
              priority: NotificationPriority.MEDIUM,
              uiType: NotificationUIType.TOAST_SIMPLE,
              duration: 5000,
            }
          );
        }
      } else {
        eventBus.emitNotification(
          NotificationEventType.WORKSPACE_ITEMS_COPY_ERROR,
          {
            batchId: copyBatchId,
            totalItems: itemsToCopy.length,
            completedItems: 0,
            failedItems: itemsToCopy.length,
            items: itemsToCopy.map(item => ({ 
              id: item.id, 
              name: item.name, 
              type: item.type as 'file' | 'folder' 
            })),
            error: result.error || 'Failed to copy items to workspace',
          },
          {
            priority: NotificationPriority.HIGH,
            uiType: NotificationUIType.TOAST_SIMPLE,
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error('Failed to copy items to workspace:', error);
      // Use copy error for unexpected errors
      eventBus.emitNotification(
        NotificationEventType.WORKSPACE_ITEMS_COPY_ERROR,
        { 
          batchId: `copy-error-${Date.now()}`,
          totalItems: itemsToCopy.length,
          completedItems: 0,
          failedItems: itemsToCopy.length,
          items: itemsToCopy.map((item: CopyItem) => ({ 
            id: item.id, 
            name: item.name, 
            type: item.type as 'file' | 'folder' 
          })),
          error: error instanceof Error ? error.message : 'An unexpected error occurred'
        },
        { 
          priority: NotificationPriority.HIGH, 
          uiType: NotificationUIType.TOAST_SIMPLE, 
          duration: 5000 
        }
      );
    }
  }, [linkData.id, treeData, queryClient]);
  
  // Use tree factory to create configured tree - pass only defined handlers
  const factoryProps: Parameters<typeof useTreeFactory>[0] = {
    treeId: `${linkType}-link-${linkData.id}`,
    config: treeConfig,
    data: treeData,
    treeType: 'link', // Enable cross-tree drag for link trees
    linkId: linkData.id, // Pass link ID for cross-tree operations
    onTreeReady: (tree: any) => {
      setTreeInstance(tree);
    },
  };
  
  // Only add handlers that are defined
  if (treeConfig.features.delete && handleDelete) {
    factoryProps.onDelete = handleDelete;
  }
  if (handleDownload) {
    factoryProps.onDownload = handleDownload;
  }
  if (handleCopyToWorkspace) {
    factoryProps.onCopyToWorkspace = handleCopyToWorkspace;
  }
  // Don't override onSelectionChange - let the factory handle it internally
  // This was causing the infinite loop by adding an external handler
  
  const { treeProps } = useTreeFactory(factoryProps);
  
  // Loading state
  if (filesLoading) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-loading">
          <div className="files-tree-spinner" />
        </div>
      </div>
    );
  }

  // Error state
  if (filesError) {
    return (
      <div className="files-tree-wrapper">
        <div className="files-tree-empty">
          <p className="files-tree-empty-text text-destructive">
            Failed to load files
          </p>
        </div>
      </div>
    );
  }
  
  // Empty state - show "No files available" instead of tree with upload highlight
  if (!hasContent) {
    return (
      <div className="files-tree-wrapper">
        <div className="flex flex-col items-center justify-center h-32 p-6">
          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              No files uploaded yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Share this link to collect files
            </p>
          </div>
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
            showEmptyState={false} // Never show the upload highlight for link trees
          />
        </Suspense>
      </div>
    </div>
  );
}