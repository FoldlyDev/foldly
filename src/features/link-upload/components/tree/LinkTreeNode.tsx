'use client';

import React, { Fragment } from 'react';
import { cn } from '@/lib/utils';
import {
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  ChevronRight,
  ChevronDown,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import type { ItemInstance } from '@headless-tree/core';
import type { LinkTreeItem } from '../../lib/tree-data';

interface LinkTreeNodeProps {
  item: ItemInstance<LinkTreeItem>;
  onDownload?: ((item: ItemInstance<LinkTreeItem>) => void) | undefined;
  isDragging?: boolean;
  isStaged?: boolean;
  stagingStatus?: 'staged' | 'uploading' | 'completed' | 'failed';
}

export function LinkTreeNode({
  item,
  onDownload,
  isDragging = false,
  isStaged = false,
  stagingStatus,
}: LinkTreeNodeProps) {
  const itemId = item.getId();
  const itemData = item.getItemData();
  const isFolder = !itemData?.isFile;
  const isExpanded = item.isExpanded();
  const isSelected = item.isSelected();
  const isFocused = item.isFocused();
  const isDragTarget = item.isDragTarget();
  const level = item.getItemMeta()?.level ?? 0;

  if (item.isRenaming()) {
    return (
      <div className='renaming-item' style={{ marginLeft: `${level * 20}px` }}>
        <input
          {...item.getRenameInputProps()}
          className='px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary'
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      {...item.getProps()}
      className={cn(
        'tree-item relative flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-all duration-200 w-full text-left cursor-pointer',
        !isStaged &&
          isSelected &&
          'bg-accent text-accent-foreground ring-1 ring-primary/20',
        !isStaged && isFocused && 'ring-2 ring-primary/40',
        isDragTarget && 'bg-primary/10 ring-2 ring-primary',
        isDragging && 'opacity-40',
        stagingStatus === 'uploading' && 'animate-pulse',
        stagingStatus === 'failed' &&
          'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400',
        stagingStatus === 'completed' && 'bg-green-50 dark:bg-green-950/20'
      )}
      style={{ paddingLeft: `${level * 20 + 8}px` }}
      data-item-id={itemId}
    >
      {/* Chevron for folders */}
      {isFolder && (
        <button
          onClick={e => {
            e.stopPropagation();
            if (isExpanded) {
              item.collapse();
            } else {
              item.expand();
            }
          }}
          className='p-0.5 hover:bg-accent rounded transition-colors'
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
        >
          {isExpanded ? (
            <ChevronDown className='h-3 w-3' />
          ) : (
            <ChevronRight className='h-3 w-3' />
          )}
        </button>
      )}

      {/* Icon */}
      {isFolder ? (
        isExpanded ? (
          <FolderOpenIcon className='h-4 w-4 text-primary' />
        ) : (
          <FolderIcon className='h-4 w-4 text-muted-foreground' />
        )
      ) : (
        <FileIcon className='h-4 w-4 text-muted-foreground' />
      )}

      {/* Name */}
      <span className='flex-1 truncate'>{itemData?.name || 'Unnamed'}</span>

      {/* Staging status indicator - only show for uploading, completed, or failed states */}
      {isStaged && stagingStatus && stagingStatus !== 'staged' && (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full',
            stagingStatus === 'uploading' &&
              'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
            stagingStatus === 'completed' &&
              'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
            stagingStatus === 'failed' &&
              'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
          )}
        >
          {stagingStatus === 'uploading' && 'Uploading...'}
          {stagingStatus === 'completed' && 'Uploaded'}
          {stagingStatus === 'failed' && 'Failed'}
        </span>
      )}

      {/* Download button for files */}
      {!isFolder && onDownload && !isStaged && (
        <button
          onClick={e => {
            e.stopPropagation();
            onDownload(item);
          }}
          className='h-6 px-2 hover:bg-accent rounded transition-colors opacity-0 group-hover:opacity-100'
          aria-label='Download file'
        >
          <Download className='h-3 w-3' />
        </button>
      )}
    </div>
  );
}
