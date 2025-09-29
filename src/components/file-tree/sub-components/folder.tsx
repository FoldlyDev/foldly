'use client';

import React from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Archive,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { Input } from '@/components/ui/shadcn/input';
import type { TreeFolderItem } from '../types/display-types';
import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

// =============================================================================
// FOLDER COMPONENT TYPES
// =============================================================================

/**
 * Props for the Folder component - Pure display component
 */
export interface FolderProps {
  folder: TreeFolderItem;
  itemInstance?: ItemInstance<TreeItemType>; // Optional for rename support
  showIcon?: boolean;
  showChevron?: boolean;
  showFileCount?: boolean;
  showSize?: boolean;
  className?: string;
  iconClassName?: string;
}

// =============================================================================
// FOLDER UTILITY FUNCTIONS
// =============================================================================

/**
 * Get folder path segments
 */
export function getFolderPathSegments(path: string): string[] {
  return path.split('/').filter(segment => segment.length > 0);
}

/**
 * Get parent folder path
 */
export function getParentFolderPath(path: string): string {
  const segments = getFolderPathSegments(path);
  segments.pop();
  return segments.length > 0 ? '/' + segments.join('/') : '/';
}

/**
 * Create full path for a subfolder
 */
export function createSubfolderPath(parentPath: string, folderName: string): string {
  const cleanParentPath = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath;
  return `${cleanParentPath}/${folderName}`;
}

/**
 * Format folder size to human-readable format
 */
export function formatFolderSize(bytes: number): string {
  if (bytes === 0) return 'Empty';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get folder statistics summary
 */
export function getFolderSummary(folder: TreeFolderItem): string {
  const parts = [];
  
  if (folder.fileCount !== undefined) {
    parts.push(`${folder.fileCount} file${folder.fileCount !== 1 ? 's' : ''}`);
  }
  
  if (folder.totalSize !== undefined && folder.totalSize > 0) {
    parts.push(formatFolderSize(folder.totalSize));
  }
  
  return parts.join(' • ');
}

// =============================================================================
// FOLDER COMPONENT
// =============================================================================

/**
 * Pure display component for folders - renders folder information only
 * All interactions and hierarchy are handled by the parent tree component
 */
export const Folder: React.FC<FolderProps> = ({
  folder,
  itemInstance,
  showIcon = true,
  showChevron = true,
  showFileCount = false,
  showSize = false,
  className,
  iconClassName,
}) => {
  const Icon = folder.isExpanded ? FolderOpenIcon : FolderIcon;
  const ChevronIcon = folder.isExpanded ? ChevronDownIcon : ChevronRightIcon;
  
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5 relative',
        folder.isSelected && 'bg-primary/20 dark:bg-primary/15 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-tertiary dark:before:bg-secondary before:rounded-full',
        folder.isArchived && 'opacity-50',
        className
      )}
      data-focused={folder.isFocused}
    >
      {showChevron && folder.hasChildren && (
        <span data-chevron className="flex items-center justify-center cursor-pointer hover:bg-muted/80 rounded p-0.5">
          <ChevronIcon className="size-3 text-muted-foreground" />
        </span>
      )}
      
      {showChevron && !folder.hasChildren && (
        <div className="size-4" />
      )}
      
      {showIcon && (
        <>
          {folder.isArchived ? (
            <Archive
              className={cn(
                'size-4 text-muted-foreground flex-shrink-0',
                iconClassName
              )}
            />
          ) : (
            <Icon
              className={cn(
                'size-4 text-muted-foreground flex-shrink-0',
                iconClassName
              )}
            />
          )}
        </>
      )}
      
      {folder.isRenaming && itemInstance ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            {...itemInstance.getRenameInputProps()}
            autoFocus
            className="flex-1 h-6 px-1 py-0 text-sm"
            data-rename-input={folder.id}
            onKeyDown={(e) => {
              // Handle Enter key to confirm rename
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur(); // This will trigger the rename completion
              }
              // Handle Escape key to cancel rename
              if (e.key === 'Escape') {
                // The getRenameInputProps handles escape internally
                e.preventDefault();
              }
            }}
          />
          <button
            type="button"
            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            onClick={() => {
              // Get the input element by data attribute and trigger blur to save
              const input = document.querySelector(`input[data-rename-input="${folder.id}"]`) as HTMLInputElement;
              if (input) {
                input.blur();
              }
            }}
            title="Save (Enter)"
          >
            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={() => {
              // Trigger escape key event to cancel rename
              const input = document.querySelector(`input[data-rename-input="${folder.id}"]`) as HTMLInputElement;
              if (input) {
                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
                input.dispatchEvent(escapeEvent);
              }
            }}
            title="Cancel (Esc)"
          >
            <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <span className="flex-1 truncate text-sm flex items-center gap-1">
          {folder.name}
          {folder.hasGeneratedLink && (
            <span title="This folder has a generated link">
              <Link2 className="size-3 text-blue-500 dark:text-blue-400 flex-shrink-0" />
            </span>
          )}
        </span>
      )}
      
      {showFileCount && folder.fileCount !== undefined && (
        <span className="text-xs text-muted-foreground">
          {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
        </span>
      )}
      
      {showSize && folder.totalSize !== undefined && folder.totalSize > 0 && (
        <span className="text-xs text-muted-foreground">
          {formatFolderSize(folder.totalSize)}
        </span>
      )}
    </div>
  );
};

// =============================================================================
// FOLDER BREADCRUMB COMPONENT
// =============================================================================
// Note: The tree hierarchy is handled by headless-tree, not by a separate FolderTree component
// Use the Folder component within TreeItem/TreeItemLabel for proper tree rendering

export interface FolderBreadcrumbProps {
  path: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

/**
 * Component for displaying folder breadcrumb navigation
 */
export const FolderBreadcrumb: React.FC<FolderBreadcrumbProps> = ({
  path,
  onNavigate,
  className,
}) => {
  const segments = getFolderPathSegments(path);
  
  return (
    <div className={cn('flex items-center gap-1 text-sm', className)}>
      <button
        onClick={() => onNavigate?.('/')}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        Root
      </button>
      
      {segments.map((segment, index) => {
        const segmentPath = '/' + segments.slice(0, index + 1).join('/');
        
        return (
          <React.Fragment key={segmentPath}>
            <ChevronRightIcon className="size-3 text-muted-foreground" />
            <button
              onClick={() => onNavigate?.(segmentPath)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {segment}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Folder;