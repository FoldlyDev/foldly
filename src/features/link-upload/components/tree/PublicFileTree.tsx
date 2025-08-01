'use client';

import { useState, useEffect } from 'react';
import { FileIcon, FolderIcon, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/core/shadcn/button';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { cn } from '@/lib/utils';
import { usePublicFiles } from '../../hooks/use-public-files';
import { formatBytes, formatDateTime } from '../../lib/utils/format';
import { downloadFileAction } from '../../lib/actions/download-file';
import type { FileTreeNode } from '../../types';

interface PublicFileTreeProps {
  linkId: string;
  compact?: boolean;
}

export function PublicFileTree({ linkId, compact }: PublicFileTreeProps) {
  const { data: tree, isLoading } = usePublicFiles(linkId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (isLoading) {
    return <FileTreeSkeleton compact={compact} />;
  }

  if (!tree || tree.length === 0) {
    return (
      <div className={cn(
        'text-center text-muted-foreground',
        compact ? 'py-8' : 'py-12'
      )}>
        <FileIcon className={cn('mx-auto mb-3', compact ? 'h-8 w-8' : 'h-12 w-12')} />
        <p className={compact ? 'text-sm' : 'text-base'}>No files uploaded yet</p>
      </div>
    );
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleDownload = async (node: FileTreeNode) => {
    if (node.type !== 'file' || !node.downloadUrl) return;

    try {
      await downloadFileAction({ fileId: node.id });
      // Open download URL
      window.open(node.downloadUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className={cn('space-y-1', compact && 'text-sm')}>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          expanded={expandedNodes.has(node.id)}
          onToggle={toggleNode}
          onDownload={handleDownload}
          depth={0}
          compact={compact}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: FileTreeNode;
  expanded: boolean;
  onToggle: (nodeId: string) => void;
  onDownload: (node: FileTreeNode) => void;
  depth: number;
  compact?: boolean;
}

function TreeNode({
  node,
  expanded,
  onToggle,
  onDownload,
  depth,
  compact,
}: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = depth * (compact ? 16 : 20) + 8;

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors',
          'cursor-pointer select-none'
        )}
        style={{ paddingLeft }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id);
          } else if (node.type === 'file') {
            onDownload(node);
          }
        }}
      >
        {hasChildren && (
          <button
            className="p-0.5 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        {node.type === 'folder' ? (
          <FolderIcon className={cn('text-muted-foreground', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        ) : (
          <FileIcon className={cn('text-muted-foreground', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        )}

        <span className="flex-1 truncate">{node.name}</span>

        {node.type === 'file' && (
          <>
            {!compact && node.size && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(node.size)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn('opacity-0 group-hover:opacity-100', compact ? 'h-6 w-6' : 'h-8 w-8')}
              onClick={(e) => {
                e.stopPropagation();
                onDownload(node);
              }}
            >
              <Download className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expanded={false}
              onToggle={onToggle}
              onDownload={onDownload}
              depth={depth + 1}
              compact={compact}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FileTreeSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5">
          <Skeleton className={cn('rounded', compact ? 'h-4 w-4' : 'h-5 w-5')} />
          <Skeleton className={cn('flex-1', compact ? 'h-4' : 'h-5')} />
          <Skeleton className={cn(compact ? 'h-4 w-12' : 'h-5 w-16')} />
        </div>
      ))}
    </div>
  );
}