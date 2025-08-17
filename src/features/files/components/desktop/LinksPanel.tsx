'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Link as LinkIcon,
  Search,
  ExternalLink,
  Files,
  HardDrive,
  Home,
  Hash,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Badge } from '@/components/ui/shadcn/badge';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/animate-ui/radix/accordion';
import { FileTreeItem } from '../shared/FileTreeItem';
import { ContextMenu } from '../shared/ContextMenu';
import { useFilesManagementStore } from '../../store/files-management-store';
import type { LinkWithFileTree, TreeNode } from '../../types';
import { cn } from '@/lib/utils';

interface LinksPanelProps {
  links: LinkWithFileTree[];
  onDragStart?: (e: React.DragEvent, nodes: TreeNode[]) => void;
  className?: string;
  selectedLinkId?: string | null;
  onLinkSelect?: (linkId: string | null) => void;
}

interface GroupedLinks {
  base: LinkWithFileTree[];
  topic: LinkWithFileTree[];
  generated: LinkWithFileTree[];
}

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

export function LinksPanel({
  links,
  onDragStart,
  className,
  selectedLinkId,
  onLinkSelect,
}: LinksPanelProps) {
  const [highlightedLinkId, setHighlightedLinkId] = useState<string | null>(
    null
  );

  // Handle highlighting when selectedLinkId changes
  useEffect(() => {
    if (selectedLinkId) {
      setHighlightedLinkId(selectedLinkId);
      // Remove highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedLinkId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedLinkId]);

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
    searchQuery,
    toggleFileSelection,
    toggleFolderSelection,
    setSearchQuery,
    openContextMenu,
    handleContextMenuAction,
    deselectAll,
  } = useFilesManagementStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const handleFileSelect = (nodeId: string, isMultiSelect: boolean) => {
    toggleFileSelection(nodeId, isMultiSelect);
  };

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

  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    // Get all selected nodes
    const selectedNodes: TreeNode[] = [];

    // If dragging a selected item, drag all selected items
    if (selectedFiles.has(node.id) || selectedFolders.has(node.id)) {
      links.forEach(link => {
        const collectSelectedNodes = (nodes: TreeNode[]) => {
          nodes.forEach(n => {
            if (selectedFiles.has(n.id) || selectedFolders.has(n.id)) {
              selectedNodes.push(n);
            }
            if (n.children) {
              collectSelectedNodes(n.children);
            }
          });
        };
        collectSelectedNodes(link.fileTree);
      });
    } else {
      // If dragging non-selected item, only drag that item
      selectedNodes.push(node);
    }

    if (onDragStart) {
      onDragStart(e, selectedNodes);
    }

    // Set drag data
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(selectedNodes));
  };

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
                  if (node.type === 'file') {
                    handleFileSelect(node.id, false);
                  } else {
                    toggleFolderSelection(node.id);
                  }
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
                    if (node.type === 'file') {
                      handleFileSelect(node.id, false);
                    } else {
                      toggleFolderSelection(node.id);
                    }
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
            <div draggable onDragStart={e => handleDragStart(e, node)}>
              <FileTreeItem
                node={node}
                level={level}
                isExpanded={isExpanded}
                isSelected={isSelected}
                onToggleExpand={handleFolderToggle}
                onToggleSelect={handleFileSelect}
              />
            </div>
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
    categoryValue: string
  ) => {
    return (
      <AccordionItem value={categoryValue} className='border-0'>
        <AccordionTrigger className='hover:no-underline py-3'>
          <div className='flex items-center gap-2'>
            {icon}
            <span className='text-sm font-semibold'>{title}</span>
            {links.length > 0 && (
              <Badge variant='secondary' className='text-xs ml-2'>
                {links.length}
              </Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          {links.length === 0 ? (
            <div className='px-1 py-4 text-center'>
              <p className='text-xs text-muted-foreground'>
                No {title.toLowerCase()} yet
              </p>
            </div>
          ) : (
            <Accordion type='multiple' className='space-y-2'>
              {links.map(link => {
                const isHighlighted = highlightedLinkId === link.id;

                return (
                  <AccordionItem
                    key={link.id}
                    value={link.id}
                    id={`link-${link.id}`}
                    className={cn(
                      'border rounded-lg transition-all duration-300',
                      isHighlighted ? 'highlight-link' : ''
                    )}
                  >
                    <AccordionTrigger
                      className='hover:no-underline px-3 py-2'
                      onClick={() => onLinkSelect?.(link.id)}
                    >
                      <div className='flex items-center justify-between w-full pr-2'>
                        <div>
                          <h3 className='font-medium text-sm text-left'>
                            {link.title}
                          </h3>
                          <p className='text-xs text-muted-foreground text-left'>
                            /{link.slug}
                            {link.topic ? `/${link.topic}` : ''}
                          </p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                            <div className='flex items-center gap-1'>
                              <Files className='h-3 w-3' />
                              <span>
                                {(() => {
                                  const itemCount = countTreeItems(
                                    link.fileTree
                                  );
                                  return itemCount.total === 1
                                    ? '1 item'
                                    : `${itemCount.total} items`;
                                })()}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <HardDrive className='h-3 w-3' />
                              <span>
                                {link.totalSize
                                  ? formatFileSize(link.totalSize)
                                  : '0 B'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`/${link.slug}${link.topic ? `/${link.topic}` : ''}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='p-1 hover:bg-muted rounded'
                            onClick={e => e.stopPropagation()}
                          >
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='px-3'>
                      {/* File Tree */}
                      {link.fileTree.length > 0 ? (
                        <div className='border-t pt-3'>
                          {renderTreeNodes(link.fileTree)}
                        </div>
                      ) : (
                        <div className='border-t pt-3 text-center py-4'>
                          <p className='text-xs text-muted-foreground'>
                            No files uploaded to this link yet
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className='pb-3 shrink-0'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <LinkIcon className='h-5 w-5 text-primary' />
            <CardTitle className='text-lg'>Shared Files</CardTitle>
          </div>
          <Badge variant='secondary'>{links.length} Links</Badge>
        </div>

        {/* Search */}
        <div className='relative mt-3'>
          <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search files...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-8 h-8'
          />
        </div>
      </CardHeader>

      <CardContent className='flex-1 overflow-hidden p-0'>
        <ScrollArea className='h-full px-4'>
          {links.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <LinkIcon className='h-12 w-12 text-muted-foreground/50 mb-4' />
              <p className='text-sm text-muted-foreground'>
                No links found. Create a link to start sharing files.
              </p>
            </div>
          ) : (
            <Accordion
              type='multiple'
              defaultValue={['base-links', 'topic-links', 'generated-links']}
              className='space-y-4 pb-4'
            >
              {/* Base Link */}
              {renderLinkGroup(
                'Base Link',
                groupedLinks.base,
                <Home className='h-4 w-4 text-primary' />,
                'base-links'
              )}

              {/* Topic-Specific Links */}
              {renderLinkGroup(
                'Topic-Specific Links',
                groupedLinks.topic,
                <Hash className='h-4 w-4 text-blue-500' />,
                'topic-links'
              )}

              {/* Generated Links */}
              {renderLinkGroup(
                'Generated Links',
                groupedLinks.generated,
                <Sparkles className='h-4 w-4 text-purple-500' />,
                'generated-links'
              )}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
