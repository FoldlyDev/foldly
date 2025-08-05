'use client';

import React, { useCallback } from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { LinksPanel } from './LinksPanel';
import { WorkspacePanel } from './WorkspacePanel';
import { ContextMenu } from '../shared/ContextMenu';
import { CopyProgressIndicator } from '../shared/CopyProgressIndicator';
import { WorkspaceFolderPicker } from '../mobile/WorkspaceFolderPicker';
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
    closeWorkspaceFolderPicker,
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
          description = 'Everything has been copied to your workspace';
        } else if (copiedFolders > 0) {
          title = `Copied ${copiedFolders} folder${copiedFolders !== 1 ? 's' : ''}`;
          description = copiedFolders === 1 
            ? 'Folder and its contents copied to your workspace'
            : 'Folders and their contents copied to your workspace';
        } else if (copiedFiles > 0) {
          title = `Copied ${copiedFiles} file${copiedFiles !== 1 ? 's' : ''}`;
          description = copiedFiles === 1
            ? 'File copied to your workspace'
            : 'Files copied to your workspace';
        }

        toast.success(title, { description });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
        queryClient.invalidateQueries({ queryKey: ['storage'] });
        
        // Failsafe: ensure copy state is cleared after successful operation
        // This handles cases where file IDs might not match perfectly
        setTimeout(() => {
          const store = useFilesManagementStore.getState();
          if (store.isCopying) {
            console.warn('[CopyOperation] Forcing clear of copy state after successful operation');
            store.clearCompletedOperations();
          }
        }, 500);
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
    const folderIds = Array.from(selectedFolders);
    
    if (fileIds.length === 0 && folderIds.length === 0) {
      toast.error('No items selected', {
        description: 'Please select files or folders to copy',
      });
      return;
    }

    // Get all selected nodes (files and folders) with their full tree structure
    const selectedNodes: TreeNode[] = [];
    const processedIds = new Set<string>();
    
    links.forEach(link => {
      const collectNodes = (nodes: TreeNode[], parentSelected: boolean = false) => {
        nodes.forEach(node => {
          const isSelected = selectedFiles.has(node.id) || selectedFolders.has(node.id);
          
          // If this node is selected or its parent is selected, include it
          if ((isSelected || parentSelected) && !processedIds.has(node.id)) {
            processedIds.add(node.id);
            
            // Clone the node with its children
            const clonedNode: TreeNode = {
              ...node,
              children: node.children ? [] : undefined
            };
            
            // If parent is not selected, add this as a root node
            if (!parentSelected) {
              selectedNodes.push(clonedNode);
            }
            
            // Process children
            if (node.children) {
              clonedNode.children = [];
              node.children.forEach(child => {
                const childClone = collectChildNodes(child, true);
                if (childClone) {
                  clonedNode.children!.push(childClone);
                }
              });
            }
          }
        });
      };
      
      // Helper to collect child nodes when parent is selected
      const collectChildNodes = (node: TreeNode, parentSelected: boolean): TreeNode | null => {
        if (processedIds.has(node.id)) return null;
        processedIds.add(node.id);
        
        const clonedNode: TreeNode = {
          ...node,
          children: node.children ? [] : undefined
        };
        
        if (node.children) {
          node.children.forEach(child => {
            const childClone = collectChildNodes(child, true);
            if (childClone) {
              clonedNode.children!.push(childClone);
            }
          });
        }
        
        return clonedNode;
      };
      
      collectNodes(link.fileTree);
    });

    // Extract all files for progress tracking
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
    
    const allFiles = selectedNodes.flatMap(extractFiles);
    startCopyOperation(allFiles);
    
    // Use tree copy mutation to preserve folder structure
    copyTreeMutation.mutate({ nodes: selectedNodes, targetFolderId: destinationFolderId });
  }, [selectedFiles, selectedFolders, links, startCopyOperation, copyTreeMutation, destinationFolderId]);

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

      {/* Workspace Folder Picker Modal */}
      <WorkspaceFolderPicker
        isOpen={isWorkspaceFolderPickerOpen}
        onClose={closeWorkspaceFolderPicker}
        onSelect={handleCopyToWorkspace}
        selectedFolderId={destinationFolderId}
      />
    </div>
  );
}