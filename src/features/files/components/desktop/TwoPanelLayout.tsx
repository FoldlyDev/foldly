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
import { copyFilesToWorkspaceAction, copyTreeNodesToWorkspaceAction } from '../../lib/actions';
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

  // Copy mutation with tree nodes support
  const copyTreeMutation = useMutation({
    mutationFn: async ({ nodes, targetFolderId }: { nodes: TreeNode[]; targetFolderId: string | null }) => {
      return copyTreeNodesToWorkspaceAction(nodes, targetFolderId);
    },
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        // Update progress for completed files
        const extractFileIds = (node: TreeNode): string[] => {
          const fileIds: string[] = [];
          if (node.type === 'file') {
            fileIds.push(node.id);
          }
          if (node.children) {
            node.children.forEach(child => {
              fileIds.push(...extractFileIds(child));
            });
          }
          return fileIds;
        };
        
        variables.nodes.forEach(node => {
          extractFileIds(node).forEach(fileId => {
            completeCopyOperation(fileId);
          });
        });

        // Create dynamic notification message
        const { copiedFiles, copiedFolders } = result.data;
        let title = 'Copied successfully';
        let description = '';
        
        if (copiedFolders > 0 && copiedFiles > 0) {
          title = `Copied ${copiedFolders} folder${copiedFolders !== 1 ? 's' : ''} and ${copiedFiles} file${copiedFiles !== 1 ? 's' : ''}`;
          description = 'Files and folders copied to your workspace with structure preserved';
        } else if (copiedFolders > 0) {
          title = `Copied ${copiedFolders} folder${copiedFolders !== 1 ? 's' : ''}`;
          description = 'Folder structure copied to your workspace';
        } else if (copiedFiles > 0) {
          title = `Copied ${copiedFiles} file${copiedFiles !== 1 ? 's' : ''}`;
          description = 'Files copied to your workspace';
        }

        toast.success(title, { description });

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

  // Fallback copy mutation for context menu (files only)
  const copyFilesMutation = useMutation({
    mutationFn: async ({ fileIds, targetFolderId }: { fileIds: string[]; targetFolderId: string | null }) => {
      return copyFilesToWorkspaceAction(fileIds, targetFolderId);
    },
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        variables.fileIds.forEach(fileId => {
          completeCopyOperation(fileId);
        });

        const { copiedFiles } = result.data;
        toast.success(`Copied ${copiedFiles} file${copiedFiles !== 1 ? 's' : ''}`, {
          description: 'Files copied to your workspace',
        });

        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['storage'] });
      } else {
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

      if (nodes.length === 0) {
        toast.error('No items selected', {
          description: 'Please select files or folders to copy',
        });
        return;
      }

      // Start copy operation (track files for progress)
      const extractFiles = (node: TreeNode): TreeNode[] => {
        const files: TreeNode[] = [];
        if (node.type === 'file') {
          files.push(node);
        }
        if (node.children) {
          node.children.forEach(child => {
            files.push(...extractFiles(child));
          });
        }
        return files;
      };
      
      const allFiles = nodes.flatMap(extractFiles);
      startCopyOperation(allFiles);
      
      // Execute copy with full tree structure
      copyTreeMutation.mutate({ nodes, targetFolderId });
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Drop failed', {
        description: 'Failed to process dropped items',
      });
    }
  }, [startCopyOperation, copyTreeMutation]);

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
    copyFilesMutation.mutate({ fileIds, targetFolderId: destinationFolderId });
  }, [selectedFiles, links, startCopyOperation, copyFilesMutation, destinationFolderId]);

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

      {/* Context Menu - Now integrated directly within LinksPanel */}

      {/* Copy Progress */}
      <CopyProgressIndicator
        operations={Array.from(copyOperations.values())}
        onDismiss={clearCompletedOperations}
      />
    </div>
  );
}