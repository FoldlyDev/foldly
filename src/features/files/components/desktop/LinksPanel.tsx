'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Link as LinkIcon, 
  Search, 
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Files,
  HardDrive,
  Home,
  Hash,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/core/shadcn/card';
import { Input } from '@/components/ui/core/shadcn/input';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { ScrollArea } from '@/components/ui/core/shadcn/scroll-area';
import { FileTreeItem } from '../shared/FileTreeItem';
import { ContextMenu } from '../shared/ContextMenu';
import { useFilesManagementStore } from '../../store/files-management-store';
import type { LinkWithFileTree, TreeNode } from '../../types';
import { cn } from '@/lib/utils';

interface LinksPanelProps {
  links: LinkWithFileTree[];
  onDragStart?: (e: React.DragEvent, nodes: TreeNode[]) => void;
  className?: string;
}

interface GroupedLinks {
  base: LinkWithFileTree[];
  topic: LinkWithFileTree[];
  generated: LinkWithFileTree[];
}

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

export function LinksPanel({ links, onDragStart, className }: LinksPanelProps) {

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
    selectedLinkId,
    selectedFiles,
    selectedFolders,
    expandedLinks,
    searchQuery,
    selectLink,
    toggleFileSelection,
    toggleFolderSelection,
    toggleLinkExpanded,
    setSearchQuery,
    openContextMenu,
  } = useFilesManagementStore();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, node)}
            >
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

  const renderLinkGroup = (title: string, links: LinkWithFileTree[], icon?: React.ReactNode, showCount: boolean = true) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
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
          const isSelected = selectedLinkId === link.id;

          return (
            <motion.div
              key={link.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                'rounded-lg border p-3 transition-colors cursor-pointer',
                isSelected ? 'border-primary bg-accent' : 'hover:bg-accent/50'
              )}
            >
              {/* Link Header */}
              <div
                className="flex items-center justify-between"
                onClick={() => {
                  selectLink(link.id);
                  toggleLinkExpanded(link.id);
                }}
              >
                <div className="flex items-center gap-2">
                  <button
                    className="p-0.5 hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLinkExpanded(link.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-medium text-sm">{link.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      /{link.slug}{link.topic ? `/${link.topic}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/${link.slug}${link.topic ? `/${link.topic}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-muted rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Link Stats */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Files className="h-3 w-3" />
                  <span>{(() => {
                    const itemCount = countTreeItems(link.fileTree);
                    return itemCount.total === 1 
                      ? '1 item' 
                      : `${itemCount.total} items`;
                  })()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{link.totalSize ? formatFileSize(link.totalSize) : '0 B'}</span>
                </div>
              </div>

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
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Shared Files</CardTitle>
          </div>
          <Badge variant="secondary">{links.length} Links</Badge>
        </div>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4">
          {links.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                No links found. Create a link to start sharing files.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}