'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { TreeNode } from '@/features/files/types';

interface FileTreeItemProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  isReadOnly?: boolean;
  onToggleExpand?: (nodeId: string) => void;
  onToggleSelect?: (nodeId: string, isMultiSelect: boolean) => void;
  className?: string;
}

export const FileTreeItem = memo(function FileTreeItem({
  node,
  level,
  isExpanded,
  isSelected,
  isReadOnly = false,
  onToggleExpand,
  onToggleSelect,
  className,
}: FileTreeItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (node.type === 'folder' && onToggleExpand) {
      onToggleExpand(node.id);
    } else if (onToggleSelect && !isReadOnly) {
      onToggleSelect(node.id, e.ctrlKey || e.metaKey);
    }
  };


  const getIcon = () => {
    if (node.type === 'folder') {
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
      ) : (
        <Folder className="h-4 w-4 text-muted-foreground" />
      );
    }

    // File icon based on type
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      onClick={handleClick}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={node.type === 'folder' ? isExpanded : undefined}
    >
      {/* Expand/Collapse chevron for folders */}
      {node.type === 'folder' ? (
        <button
          className="p-0.5 hover:bg-muted rounded"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.(node.id);
          }}
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      ) : (
        <span className="w-4" />
      )}

      {/* Selection checkbox */}
      {!isReadOnly && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect?.(node.id, e.shiftKey);
          }}
          className="h-3.5 w-3.5 rounded border-gray-300"
          aria-label={`Select ${node.name}`}
        />
      )}

      {/* Icon */}
      {getIcon()}

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="truncate text-sm">{node.name}</span>
      </div>

      {/* File size */}
      {node.type === 'file' && node.size && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(node.size)}
        </span>
      )}

      {/* Uploader info - moved to the end */}
      {node.metadata?.uploaderName && (
        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md flex-shrink-0 max-w-32 truncate">
          by {node.metadata.uploaderName}
        </span>
      )}

      {/* Selection indicator for read-only mode */}
      {isReadOnly && isSelected && (
        <Check className="h-3 w-3 text-primary" />
      )}
    </div>
  );
});