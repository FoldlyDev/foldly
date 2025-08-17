'use client';

import React from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { TreeFolderItem } from '../types/display-types';

// =============================================================================
// FOLDER COMPONENT TYPES
// =============================================================================

/**
 * Props for the Folder component - Pure display component
 */
export interface FolderProps {
  folder: TreeFolderItem;
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
        'flex items-center gap-1 rounded px-1 py-0.5 transition-colors',
        folder.isSelected && 'bg-accent',
        folder.isFocused && 'ring-2 ring-primary ring-offset-1',
        folder.isArchived && 'opacity-50',
        className
      )}
    >
      {showChevron && folder.hasChildren && (
        <ChevronIcon className="size-3 text-muted-foreground" />
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
      
      <span className="flex-1 truncate text-sm">
        {folder.name}
      </span>
      
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