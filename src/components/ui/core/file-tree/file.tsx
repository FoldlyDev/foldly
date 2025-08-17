'use client';

import React from 'react';
import { FileIcon, FileTextIcon, ImageIcon, VideoIcon, AudioIcon, ArchiveIcon, CodeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// FILE COMPONENT TYPES
// =============================================================================

/**
 * File data structure compatible with database schema and tree component
 */
export interface FileItem {
  id: string;
  name: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  extension?: string | null;
  thumbnailPath?: string | null;
  downloadCount?: number;
  isSelected?: boolean;
  isRenaming?: boolean;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Props for the File component
 */
export interface FileProps {
  file: FileItem;
  onClick?: (file: FileItem) => void;
  onDoubleClick?: (file: FileItem) => void;
  onRename?: (file: FileItem, newName: string) => void;
  onDelete?: (file: FileItem) => void;
  showIcon?: boolean;
  showSize?: boolean;
  showDate?: boolean;
  className?: string;
  iconClassName?: string;
}

// =============================================================================
// FILE UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the appropriate icon for a file based on its MIME type
 */
export function getFileIcon(mimeType: string, extension?: string | null) {
  // Images
  if (mimeType.startsWith('image/')) {
    return ImageIcon;
  }
  
  // Videos
  if (mimeType.startsWith('video/')) {
    return VideoIcon;
  }
  
  // Audio
  if (mimeType.startsWith('audio/')) {
    return AudioIcon;
  }
  
  // Archives
  if (
    mimeType.includes('zip') ||
    mimeType.includes('tar') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z')
  ) {
    return ArchiveIcon;
  }
  
  // Code files
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift'];
  if (extension && codeExtensions.includes(extension.toLowerCase())) {
    return CodeIcon;
  }
  
  // Text documents
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('document') ||
    mimeType.includes('pdf')
  ) {
    return FileTextIcon;
  }
  
  // Default file icon
  return FileIcon;
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to readable string
 */
export function formatFileDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return null;
  return fileName.substring(lastDot + 1).toLowerCase();
}

// =============================================================================
// FILE COMPONENT
// =============================================================================

/**
 * Reusable File component for displaying file items in trees, lists, or grids
 */
export const File: React.FC<FileProps> = ({
  file,
  onClick,
  onDoubleClick,
  showIcon = true,
  showSize = false,
  showDate = false,
  className,
  iconClassName,
}) => {
  const Icon = getFileIcon(file.mimeType, file.extension);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(file);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick?.(file);
  };
  
  return (
    <div
      className={cn(
        'flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 transition-colors',
        file.isSelected && 'bg-accent',
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {showIcon && (
        <Icon
          className={cn(
            'size-4 text-muted-foreground flex-shrink-0',
            iconClassName
          )}
        />
      )}
      
      <span className="flex-1 truncate text-sm">
        {file.name || file.fileName}
      </span>
      
      {showSize && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.fileSize)}
        </span>
      )}
      
      {showDate && file.createdAt && (
        <span className="text-xs text-muted-foreground">
          {formatFileDate(file.createdAt)}
        </span>
      )}
      
      {file.processingStatus === 'processing' && (
        <span className="text-xs text-blue-500">Processing...</span>
      )}
      
      {file.processingStatus === 'failed' && (
        <span className="text-xs text-red-500">Failed</span>
      )}
    </div>
  );
};

// =============================================================================
// FILE LIST COMPONENT
// =============================================================================

export interface FileListProps {
  files: FileItem[];
  onFileClick?: (file: FileItem) => void;
  onFileDoubleClick?: (file: FileItem) => void;
  onFileRename?: (file: FileItem, newName: string) => void;
  onFileDelete?: (file: FileItem) => void;
  showIcon?: boolean;
  showSize?: boolean;
  showDate?: boolean;
  className?: string;
}

/**
 * Component for displaying a list of files
 */
export const FileList: React.FC<FileListProps> = ({
  files,
  onFileClick,
  onFileDoubleClick,
  onFileRename,
  onFileDelete,
  showIcon = true,
  showSize = true,
  showDate = false,
  className,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {files.map((file) => (
        <File
          key={file.id}
          file={file}
          onClick={onFileClick}
          onDoubleClick={onFileDoubleClick}
          onRename={onFileRename}
          onDelete={onFileDelete}
          showIcon={showIcon}
          showSize={showSize}
          showDate={showDate}
        />
      ))}
    </div>
  );
};

export default File;