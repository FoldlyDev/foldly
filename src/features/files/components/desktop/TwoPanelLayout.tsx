'use client';

import React, { useCallback } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { LinksPanel } from './LinksPanel';
import { WorkspacePanel } from './WorkspacePanel';
import { ContextMenu } from '../shared/ContextMenu';
import { CopyProgressIndicator } from '../shared/CopyProgressIndicator';
import { useFilesManagementStore } from '../../store/files-management-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { copyFilesToWorkspaceAction } from '../../lib/actions';
import { toast } from 'sonner';
import type { LinkWithFileTree, TreeNode } from '../../types';
import { cn } from '@/lib/utils';

interface TwoPanelLayoutProps {
  links: LinkWithFileTree[];
  storageUsed?: number;
  storageLimit?: number;
  className?: string;
}

export function TwoPanelLayout({
  links,
  storageUsed,
  storageLimit,
  className,
}: TwoPanelLayoutProps) {
  const queryClient = useQueryClient();
  const {
    selectedFiles,
    selectedFolders,
    copyOperations,
    contextMenuPosition,
    contextMenuTarget,
    isWorkspaceFolderPickerOpen,
    destinationFolderId,
    startCopyOperation,
    updateCopyProgress,
    completeCopyOperation,
    failCopyOperation,
    clearCompletedOperations,
    closeContextMenu,
    handleContextMenuAction,
    openWorkspaceFolderPicker,
  } = useFilesManagementStore();

  // Copy mutation
  const copyMutation = useMutation({
    mutationFn: async ({ fileIds, targetFolderId }: { fileIds: string[]; targetFolderId: string | null }) => {
      return copyFilesToWorkspaceAction(fileIds, targetFolderId);
    },
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        // Update progress for completed files
        variables.fileIds.forEach(fileId => {
          completeCopyOperation(fileId);
        });

        toast.success('Files copied successfully', {
          description: `${result.data.copiedFiles} files copied to your workspace`,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['storage'] });
      } else {
        // Handle errors
        result.data?.errors.forEach(error => {
          failCopyOperation(error.fileId, error.error);
        });

        toast.error('Copy completed with errors', {
          description: result.error || 'Some files failed to copy',
        });
      }
    },
    onError: (error) => {
      toast.error('Copy failed', {
        description: error instanceof Error ? error.message : 'Failed to copy files',
      });
    },
  });

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, nodes: TreeNode[]) => {
    // Store dragged nodes data
    e.dataTransfer.setData('application/json', JSON.stringify(nodes));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Handle drop on workspace
  const handleDrop = useCallback((e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();

    try {
      const data = e.dataTransfer.getData('application/json');
      const nodes: TreeNode[] = JSON.parse(data);

      // Extract file IDs from nodes
      const fileIds: string[] = [];
      const extractFileIds = (node: TreeNode) => {
        if (node.type === 'file') {
          fileIds.push(node.id);
        }
        if (node.children) {
          node.children.forEach(extractFileIds);
        }
      };
      nodes.forEach(extractFileIds);

      if (fileIds.length === 0) {
        toast.error('No files selected', {
          description: 'Please select files to copy',
        });
        return;
      }

      // Start copy operation
      startCopyOperation(nodes.filter(n => n.type === 'file'));
      
      // Execute copy
      copyMutation.mutate({ fileIds, targetFolderId });
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Drop failed', {
        description: 'Failed to process dropped files',
      });
    }
  }, [startCopyOperation, copyMutation]);

  // Handle context menu copy action
  const handleCopyToWorkspace = useCallback(() => {
    const fileIds = Array.from(selectedFiles);
    
    if (fileIds.length === 0) {
      toast.error('No files selected', {
        description: 'Please select files to copy',
      });
      return;
    }

    // Get selected nodes for progress tracking
    const selectedNodes: TreeNode[] = [];
    links.forEach(link => {
      const collectNodes = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (selectedFiles.has(node.id)) {
            selectedNodes.push(node);
          }
          if (node.children) {
            collectNodes(node.children);
          }
        });
      };
      collectNodes(link.fileTree);
    });

    startCopyOperation(selectedNodes);
    copyMutation.mutate({ fileIds, targetFolderId: destinationFolderId });
  }, [selectedFiles, links, startCopyOperation, copyMutation, destinationFolderId]);

  return (
    <div className={cn('flex gap-4 h-full', className)}>
      {/* Left Panel - Links */}
      <div className="flex-1 min-w-0 flex">
        <LinksPanel
          links={links}
          onDragStart={handleDragStart}
          className="flex-1"
        />
      </div>

      {/* Right Panel - Workspace */}
      <div className="flex-1 min-w-0 flex">
        <WorkspacePanel
          onDrop={handleDrop}
          storageUsed={storageUsed}
          storageLimit={storageLimit}
          className="flex-1"
        />
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenuPosition}
        position={contextMenuPosition || { x: 0, y: 0 }}
        onAction={(action) => {
          if (action === 'copyToWorkspace') {
            handleCopyToWorkspace();
          } else {
            handleContextMenuAction(action);
          }
        }}
        onClose={closeContextMenu}
        hasSelection={selectedFiles.size > 0 || selectedFolders.size > 0}
        targetType={contextMenuTarget?.type}
      />

      {/* Copy Progress */}
      <CopyProgressIndicator
        operations={Array.from(copyOperations.values())}
        onDismiss={clearCompletedOperations}
      />
    </div>
  );
}