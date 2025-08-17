'use client';

import React from 'react';
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  AudioWaveform,
  ArchiveIcon,
  CodeIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { TreeFileItem } from '../types/display-types';

// =============================================================================
// FILE COMPONENT TYPES
// =============================================================================

/**
 * Props for the File component - Pure display component
 */
export interface FileProps {
  file: TreeFileItem;
  showIcon?: boolean;
  showSize?: boolean;
  showDate?: boolean;
  showStatus?: boolean;
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
    return AudioWaveform;
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
  const codeExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'java',
    'cpp',
    'c',
    'h',
    'cs',
    'php',
    'rb',
    'go',
    'rs',
    'swift',
  ];
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
 * Pure display component for files - renders file information only
 * All interactions are handled by the parent tree component
 */
export const File: React.FC<FileProps> = ({
  file,
  showIcon = true,
  showSize = false,
  showDate = false,
  showStatus = false,
  className,
  iconClassName,
}) => {
  const Icon = getFileIcon(file.mimeType, file.extension);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded px-1 py-0.5 transition-colors',
        file.isSelected && 'bg-accent',
        file.isFocused && 'ring-2 ring-primary ring-offset-1',
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            'size-4 text-muted-foreground flex-shrink-0',
            iconClassName
          )}
        />
      )}

      <span className='flex-1 truncate text-sm'>
        {file.originalName || file.fileName}
      </span>

      {showSize && (
        <span className='text-xs text-muted-foreground'>
          {formatFileSize(file.fileSize)}
        </span>
      )}

      {showDate && file.uploadedAt && (
        <span className='text-xs text-muted-foreground'>
          {formatFileDate(file.uploadedAt)}
        </span>
      )}

      {showStatus && file.processingStatus && (
        <span
          className={cn('text-xs', {
            'text-blue-500': file.processingStatus === 'processing',
            'text-green-500': file.processingStatus === 'completed',
            'text-red-500': file.processingStatus === 'failed',
            'text-gray-500': file.processingStatus === 'pending',
          })}
        >
          {file.processingStatus === 'processing' && 'Processing...'}
          {file.processingStatus === 'failed' && 'Failed'}
          {file.processingStatus === 'pending' && 'Pending'}
        </span>
      )}

      {showStatus && file.virusScanStatus === 'infected' && (
        <span className='text-xs text-red-600 font-semibold'>⚠️ Infected</span>
      )}
    </div>
  );
};

// =============================================================================
// FILE LIST COMPONENT
// =============================================================================

export interface FileListProps {
  files: TreeFileItem[];
  showIcon?: boolean;
  showSize?: boolean;
  showDate?: boolean;
  showStatus?: boolean;
  className?: string;
}

/**
 * Pure display component for rendering a list of files
 */
export const FileList: React.FC<FileListProps> = ({
  files,
  showIcon = true,
  showSize = true,
  showDate = false,
  showStatus = false,
  className,
}) => {
  return (
    <div className={cn('space-y-1', className)}>
      {files.map(file => (
        <File
          key={file.id}
          file={file}
          showIcon={showIcon}
          showSize={showSize}
          showDate={showDate}
          showStatus={showStatus}
        />
      ))}
    </div>
  );
};

export default File;
