'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Link as LinkIcon,
  Search,
  ChevronRight,
  Home,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import { FileTreeItem } from '../shared/FileTreeItem';
import { ContextMenu } from '../shared/ContextMenu';
import { CopyProgressIndicator } from '../shared/CopyProgressIndicator';
import { WorkspaceFolderPicker } from './WorkspaceFolderPicker';
import { useFilesManagementStore } from '../../store/files-management-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  copyFilesToWorkspaceAction,
  copyTreeNodesToWorkspaceAction,
} from '../../lib/actions';
import { toast } from 'sonner';
import type { LinkWithFileTree, TreeNode } from '../../types';
import { cn } from '@/lib/utils';

// Helper function to count total items (files and folders) in a tree
function countTreeItems(nodes: TreeNode[]): {
  files: number;
  folders: number;
  total: number;
} {
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
  selectedLinkId?: string | null;
  onLinkSelect?: (linkId: string | null) => void;
}

interface GroupedLinks {
  base: LinkWithFileTree[];
  topic: LinkWithFileTree[];
  generated: LinkWithFileTree[];
}

export function SinglePanelLayout({
  links,
  className,
  selectedLinkId,
  onLinkSelect,
}: SinglePanelLayoutProps) {
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
    deselectAll,
  } = useFilesManagementStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Copy mutation with tree nodes support
  const copyTreeMutation = useMutation({
    mutationFn: async ({
      nodes,
      targetFolderId,
    }: {
      nodes: TreeNode[];
      targetFolderId: string | null;
    }) => {
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
          description =
            copiedFolders === 1
              ? 'Folder and its contents copied to your workspace'
              : 'Folders and their contents copied to your workspace';
        } else if (copiedFiles > 0) {
          title = `Copied ${copiedFiles} file${copiedFiles !== 1 ? 's' : ''}`;
          description =
            copiedFiles === 1
              ? 'File copied to your workspace'
              : 'Files copied to your workspace';
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
    onError: error => {
      toast.error('Copy failed', {
        description:
          error instanceof Error ? error.message : 'Failed to copy files',
      });
    },
  });

  const handleSelectAll = useCallback(() => {
    // Select all files and folders from all links
    links.forEach(link => {
      const collectNodes = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file') {
            selectedFiles.add(node.id);
          } else {
            selectedFolders.add(node.id);
          }
          if (node.children) {
            collectNodes(node.children);
          }
        });
      };
      collectNodes(link.fileTree);
    });
    // Force re-render by creating new sets
    toggleFileSelection(Array.from(selectedFiles)[0] || '', false);
  }, [links, selectedFiles, selectedFolders, toggleFileSelection]);

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

  const handleCopyToWorkspace = useCallback(
    (targetFolderId: string | null) => {
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
        const collectNodes = (
          nodes: TreeNode[],
          parentSelected: boolean = false
        ) => {
          nodes.forEach(node => {
            const isSelected =
              selectedFiles.has(node.id) || selectedFolders.has(node.id);

            // If this node is selected or its parent is selected, include it
            if ((isSelected || parentSelected) && !processedIds.has(node.id)) {
              processedIds.add(node.id);

              // Clone the node with its children
              const clonedNode: TreeNode = {
                ...node,
                children: node.children ? [] : undefined,
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
        const collectChildNodes = (
          node: TreeNode,
          parentSelected: boolean
        ): TreeNode | null => {
          if (processedIds.has(node.id)) return null;
          processedIds.add(node.id);

          const clonedNode: TreeNode = {
            ...node,
            children: node.children ? [] : undefined,
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
      copyTreeMutation.mutate({ nodes: selectedNodes, targetFolderId });
      closeWorkspaceFolderPicker();
    },
    [
      selectedFiles,
      selectedFolders,
      links,
      startCopyOperation,
      copyTreeMutation,
      closeWorkspaceFolderPicker,
    ]
  );

  const renderTreeNodes = (
    nodes: TreeNode[],
    level: number = 0
  ): React.ReactNode => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected =
        selectedFiles.has(node.id) || selectedFolders.has(node.id);

      return (
        <div key={node.id}>
          <ContextMenu
            nodeId={node.id}
            onAction={action => {
              switch (action) {
                case 'expand':
                case 'collapse':
                  handleFolderToggle(node.id);
                  break;
                case 'select':
                  toggleFileSelection(node.id, false);
                  break;
                case 'selectAll':
                  handleSelectAll();
                  break;
                case 'deselectAll':
                  deselectAll();
                  break;
                case 'copyToWorkspace':
                  // First select the item if not selected
                  if (!isSelected) {
                    toggleFileSelection(node.id, false);
                  }
                  handleContextMenuAction(action);
                  break;
                case 'viewDetails':
                  // TODO: Implement view details modal
                  console.log('View details for:', node);
                  break;
                default:
                  handleContextMenuAction(action);
              }
            }}
            hasSelection={selectedFiles.size > 0 || selectedFolders.size > 0}
            targetType={node.type}
            isExpanded={isExpanded}
            isSelected={isSelected}
            onOpenChange={open => {
              if (open) {
                openContextMenu(
                  { x: 0, y: 0 },
                  { id: node.id, type: node.type }
                );
              }
            }}
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

  const renderLinkGroup = (
    title: string,
    links: LinkWithFileTree[],
    icon?: React.ReactNode,
    showCount: boolean = true
  ) => {
    return (
      <div className='space-y-3'>
        <div className='flex items-center gap-2 px-1 sticky top-0 bg-background py-2 z-10'>
          {icon}
          <h3 className='text-sm font-semibold text-muted-foreground'>
            {title}
          </h3>
          {showCount && links.length > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {links.length}
            </Badge>
          )}
        </div>
        {links.length === 0 ? (
          <div className='px-1 py-4 text-center'>
            <p className='text-xs text-muted-foreground'>
              No {title.toLowerCase()} yet
            </p>
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
                  className='rounded-lg border p-3'
                >
                  {/* Link Header */}
                  <button
                    className='w-full flex items-center justify-between'
                    onClick={() => toggleLinkExpanded(link.id)}
                  >
                    <div className='flex items-center gap-2'>
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )}
                      />
                      <div className='text-left'>
                        <h3 className='font-medium text-sm'>{link.title}</h3>
                        <p className='text-xs text-muted-foreground'>
                          {(() => {
                            const itemCount = countTreeItems(link.fileTree);
                            return itemCount.total === 1
                              ? '1 item'
                              : `${itemCount.total} items`;
                          })()}{' '}
                          •{' '}
                          {link.totalSize
                            ? formatFileSize(link.totalSize)
                            : '0 B'}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* File Tree */}
                  {isExpanded && link.fileTree.length > 0 && (
                    <div className='mt-3 border-t pt-3'>
                      {renderTreeNodes(link.fileTree)}
                    </div>
                  )}

                  {/* Empty State */}
                  {isExpanded && link.fileTree.length === 0 && (
                    <div className='mt-3 border-t pt-3 text-center py-4'>
                      <p className='text-xs text-muted-foreground'>
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
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <LinkIcon className='h-5 w-5 text-primary' />
            <h1 className='text-lg font-semibold'>Shared Files</h1>
          </div>
          <Badge variant='secondary'>{links.length} Links</Badge>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search files...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-8 h-9'
          />
        </div>
      </div>

      {/* Links List */}
      <ScrollArea className='flex-1'>
        <div className='p-4 space-y-3'>
          {links.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <LinkIcon className='h-12 w-12 text-muted-foreground/50 mb-4' />
              <p className='text-sm text-muted-foreground'>
                No links found. Create a link to start sharing files.
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Base Link */}
              {renderLinkGroup(
                'Base Link',
                groupedLinks.base,
                <Home className='h-4 w-4 text-primary' />,
                false // Don't show count for base link
              )}

              {/* Divider */}
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t' />
                </div>
              </div>

              {/* Topic-Specific Links */}
              {renderLinkGroup(
                'Topic-Specific Links',
                groupedLinks.topic,
                <Hash className='h-4 w-4 text-blue-500' />
              )}

              {/* Divider */}
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t' />
                </div>
              </div>

              {/* Generated Links */}
              {renderLinkGroup(
                'Generated Links',
                groupedLinks.generated,
                <Sparkles className='h-4 w-4 text-purple-500' />
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
          className='border-t bg-background p-4'
        >
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>
              {selectedFiles.size + selectedFolders.size} items selected
            </span>
            <div className='flex gap-2'>
              <button
                className='text-sm text-muted-foreground'
                onClick={() => {
                  selectedFiles.clear();
                  selectedFolders.clear();
                }}
              >
                Cancel
              </button>
              <button
                className='text-sm text-primary font-medium'
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
