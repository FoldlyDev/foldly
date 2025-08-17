'use client';

import React, { useState } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// FOLDER COMPONENT TYPES
// =============================================================================

/**
 * Folder data structure compatible with database schema and tree component
 */
export interface FolderItem {
  id: string;
  name: string;
  path: string;
  parentFolderId?: string | null;
  depth: number;
  isArchived?: boolean;
  sortOrder?: number;
  fileCount?: number;
  totalSize?: number;
  isExpanded?: boolean;
  isSelected?: boolean;
  isRenaming?: boolean;
  hasChildren?: boolean;
  children?: (FolderItem | any)[]; // Can contain folders or files
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Props for the Folder component
 */
export interface FolderProps {
  folder: FolderItem;
  onClick?: (folder: FolderItem) => void;
  onDoubleClick?: (folder: FolderItem) => void;
  onExpand?: (folder: FolderItem) => void;
  onCollapse?: (folder: FolderItem) => void;
  onRename?: (folder: FolderItem, newName: string) => void;
  onDelete?: (folder: FolderItem) => void;
  onCreateSubfolder?: (folder: FolderItem, name: string) => void;
  showIcon?: boolean;
  showChevron?: boolean;
  showFileCount?: boolean;
  indentLevel?: number;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
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
export function getFolderSummary(folder: FolderItem): string {
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
 * Reusable Folder component for displaying folder items in trees or lists
 */
export const Folder: React.FC<FolderProps> = ({
  folder,
  onClick,
  onDoubleClick,
  onExpand,
  onCollapse,
  showIcon = true,
  showChevron = true,
  showFileCount = false,
  indentLevel = 0,
  className,
  iconClassName,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(folder);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(folder);
  };
  
  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (folder.isExpanded) {
      onCollapse?.(folder);
    } else {
      onExpand?.(folder);
    }
  };
  
  const Icon = folder.isExpanded ? FolderOpenIcon : FolderIcon;
  const ChevronIcon = folder.isExpanded ? ChevronDownIcon : ChevronRightIcon;
  
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 transition-colors',
          folder.isSelected && 'bg-accent',
          folder.isArchived && 'opacity-50',
          className
        )}
        style={{ paddingLeft: `${indentLevel * 20}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showChevron && folder.hasChildren && (
          <button
            onClick={handleChevronClick}
            className="p-0.5 hover:bg-accent rounded"
          >
            <ChevronIcon className="size-3 text-muted-foreground" />
          </button>
        )}
        
        {showChevron && !folder.hasChildren && (
          <div className="size-4" />
        )}
        
        {showIcon && (
          <Icon
            className={cn(
              'size-4 text-muted-foreground flex-shrink-0',
              iconClassName
            )}
          />
        )}
        
        <span className="flex-1 truncate text-sm">
          {folder.name}
        </span>
        
        {showFileCount && folder.fileCount !== undefined && (
          <span className="text-xs text-muted-foreground">
            {folder.fileCount}
          </span>
        )}
        
        {isHovered && onCreateSubfolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const name = prompt('New folder name:');
              if (name) {
                onCreateSubfolder(folder, name);
              }
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            <FolderPlusIcon className="size-3 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {folder.isExpanded && children && (
        <div className="ml-2">
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// FOLDER TREE COMPONENT
// =============================================================================

export interface FolderTreeProps {
  folders: FolderItem[];
  onFolderClick?: (folder: FolderItem) => void;
  onFolderDoubleClick?: (folder: FolderItem) => void;
  onFolderExpand?: (folder: FolderItem) => void;
  onFolderCollapse?: (folder: FolderItem) => void;
  onFolderRename?: (folder: FolderItem, newName: string) => void;
  onFolderDelete?: (folder: FolderItem) => void;
  onCreateSubfolder?: (folder: FolderItem, name: string) => void;
  showFileCount?: boolean;
  className?: string;
}

/**
 * Component for displaying a tree of folders
 */
export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onFolderClick,
  onFolderDoubleClick,
  onFolderExpand,
  onFolderCollapse,
  onFolderRename,
  onFolderDelete,
  onCreateSubfolder,
  showFileCount = false,
  className,
}) => {
  const renderFolder = (folder: FolderItem, level: number = 0) => {
    return (
      <Folder
        key={folder.id}
        folder={folder}
        onClick={onFolderClick}
        onDoubleClick={onFolderDoubleClick}
        onExpand={onFolderExpand}
        onCollapse={onFolderCollapse}
        onRename={onFolderRename}
        onDelete={onFolderDelete}
        onCreateSubfolder={onCreateSubfolder}
        showFileCount={showFileCount}
        indentLevel={level}
      >
        {folder.children?.map((child) => {
          if ('path' in child) {
            // It's a folder
            return renderFolder(child as FolderItem, level + 1);
          }
          // Could render files here if needed
          return null;
        })}
      </Folder>
    );
  };
  
  return (
    <div className={cn('space-y-0.5', className)}>
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
};

// =============================================================================
// FOLDER BREADCRUMB COMPONENT
// =============================================================================

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