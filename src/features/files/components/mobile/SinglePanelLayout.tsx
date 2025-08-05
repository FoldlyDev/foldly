'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Search, ChevronRight, Home, Hash, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/core/shadcn/input';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { ScrollArea } from '@/components/ui/core/shadcn/scroll-area';
import { FileTreeItem } from '../shared/FileTreeItem';
import { ContextMenu } from '../shared/ContextMenu';
import { CopyProgressIndicator } from '../shared/CopyProgressIndicator';
import { WorkspaceFolderPicker } from './WorkspaceFolderPicker';
import { useFilesManagementStore } from '../../store/files-management-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { copyFilesToWorkspaceAction } from '../../lib/actions';
import { toast } from 'sonner';
import type { LinkWithFileTree, TreeNode } from '../../types';
import { cn } from '@/lib/utils';

// Helper function to count total items (files and folders) in a tree
function countTreeItems(nodes: TreeNode[]): { files: number; folders: number; total: number } {
  let files = 0;
  let folders = 0;
  
  const traverse = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.type === 'file') {
        files++;
      } else if (node.type === 'folder') {
        folders++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  
  traverse(nodes);
  return { files, folders, total: files + folders };
}

interface SinglePanelLayoutProps {
  links: LinkWithFileTree[];
  className?: string;
}

interface GroupedLinks {
  base: LinkWithFileTree[];
  topic: LinkWithFileTree[];
  generated: LinkWithFileTree[];
}

export function SinglePanelLayout({ links, className }: SinglePanelLayoutProps) {
  const queryClient = useQueryClient();
  
  // Group links by type
  const groupedLinks = useMemo<GroupedLinks>(() => {
    return links.reduce<GroupedLinks>(
      (acc, link) => {
        switch (link.linkType) {
          case 'base':
            acc.base.push(link);
            break;
          case 'topic':
            acc.topic.push(link);
            break;
          case 'generated':
            acc.generated.push(link);
            break;
          default:
            // Fallback to topic for unknown types
            acc.topic.push(link);
        }
        return acc;
      },
      { base: [], topic: [], generated: [] }
    );
  }, [links]);
  const {
    selectedFiles,
    selectedFolders,
    expandedLinks,
    searchQuery,
    copyOperations,
    contextMenuPosition,
    contextMenuTarget,
    isWorkspaceFolderPickerOpen,
    destinationFolderId,
    selectLink,
    toggleFileSelection,
    toggleLinkExpanded,
    setSearchQuery,
    openContextMenu,
    closeContextMenu,
    handleContextMenuAction,
    closeWorkspaceFolderPicker,
    setDestinationFolder,
    startCopyOperation,
    completeCopyOperation,
    failCopyOperation,
    clearCompletedOperations,
  } = useFilesManagementStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Copy mutation
  const copyMutation = useMutation({
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

  const handleFolderToggle = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleCopyToWorkspace = useCallback((targetFolderId: string | null) => {
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
    copyMutation.mutate({ fileIds, targetFolderId });
    closeWorkspaceFolderPicker();
  }, [selectedFiles, links, startCopyOperation, copyMutation, closeWorkspaceFolderPicker]);

  const renderTreeNodes = (nodes: TreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFiles.has(node.id) || selectedFolders.has(node.id);

      return (
        <div key={node.id}>
          <ContextMenu
            onAction={handleContextMenuAction}
            hasSelection={selectedFiles.size > 0 || selectedFolders.size > 0}
            targetType={node.type}
            isExpanded={isExpanded}
            isSelected={isSelected}
          >
            <FileTreeItem
              node={node}
              level={level}
              isExpanded={isExpanded}
              isSelected={isSelected}
              onToggleExpand={handleFolderToggle}
              onToggleSelect={toggleFileSelection}
            />
          </ContextMenu>
          {node.children && isExpanded && (
            <div>{renderTreeNodes(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderLinkGroup = (title: string, links: LinkWithFileTree[], icon?: React.ReactNode, showCount: boolean = true) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 sticky top-0 bg-background py-2 z-10">
          {icon}
          <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
          {showCount && links.length > 0 && (
            <Badge variant="secondary" className="text-xs">{links.length}</Badge>
          )}
        </div>
        {links.length === 0 ? (
          <div className="px-1 py-4 text-center">
            <p className="text-xs text-muted-foreground">No {title.toLowerCase()} yet</p>
          </div>
        ) : (
          <>
            {links.map(link => {
          const isExpanded = expandedLinks.has(link.id);

          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border p-3"
            >
              {/* Link Header */}
              <button
                className="w-full flex items-center justify-between"
                onClick={() => toggleLinkExpanded(link.id)}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <div className="text-left">
                    <h3 className="font-medium text-sm">{link.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const itemCount = countTreeItems(link.fileTree);
                        return itemCount.total === 1 
                          ? '1 item' 
                          : `${itemCount.total} items`;
                      })()} • {link.totalSize ? formatFileSize(link.totalSize) : '0 B'}
                    </p>
                  </div>
                </div>
              </button>

              {/* File Tree */}
              {isExpanded && link.fileTree.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  {renderTreeNodes(link.fileTree)}
                </div>
              )}

              {/* Empty State */}
              {isExpanded && link.fileTree.length === 0 && (
                <div className="mt-3 border-t pt-3 text-center py-4">
                  <p className="text-xs text-muted-foreground">
                    No files uploaded to this link yet
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Shared Files</h1>
          </div>
          <Badge variant="secondary">{links.length} Links</Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Links List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No links found. Create a link to start sharing files.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Base Link */}
              {renderLinkGroup(
                'Base Link',
                groupedLinks.base,
                <Home className="h-4 w-4 text-primary" />,
                false // Don't show count for base link
              )}
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
              </div>
              
              {/* Topic-Specific Links */}
              {renderLinkGroup(
                'Topic-Specific Links',
                groupedLinks.topic,
                <Hash className="h-4 w-4 text-blue-500" />
              )}
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
              </div>
              
              {/* Generated Links */}
              {renderLinkGroup(
                'Generated Links',
                groupedLinks.generated,
                <Sparkles className="h-4 w-4 text-purple-500" />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Files Bar */}
      {(selectedFiles.size > 0 || selectedFolders.size > 0) && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="border-t bg-background p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedFiles.size + selectedFolders.size} items selected
            </span>
            <div className="flex gap-2">
              <button
                className="text-sm text-muted-foreground"
                onClick={() => {
                  selectedFiles.clear();
                  selectedFolders.clear();
                }}
              >
                Cancel
              </button>
              <button
                className="text-sm text-primary font-medium"
                onClick={() => handleContextMenuAction('copyToWorkspace')}
              >
                Copy to Workspace
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Context Menu - Now integrated directly with FileTreeItem components */}

      {/* Workspace Folder Picker Modal */}
      <WorkspaceFolderPicker
        isOpen={isWorkspaceFolderPickerOpen}
        onClose={closeWorkspaceFolderPicker}
        onSelect={handleCopyToWorkspace}
        selectedFolderId={destinationFolderId}
      />

      {/* Copy Progress */}
      <CopyProgressIndicator
        operations={Array.from(copyOperations.values())}
        onDismiss={clearCompletedOperations}
      />
    </div>
  );
}