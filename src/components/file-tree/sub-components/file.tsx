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
import { Input } from '@/components/ui/shadcn/input';
import type { TreeFileItem } from '../types/display-types';
import type { ItemInstance } from '@headless-tree/core';
import type { TreeItem as TreeItemType } from '../types/tree-types';

// =============================================================================
// FILE COMPONENT TYPES
// =============================================================================

/**
 * Props for the File component - Pure display component
 */
export interface FileProps {
  file: TreeFileItem;
  itemInstance?: ItemInstance<TreeItemType>; // Optional for rename support
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
  itemInstance,
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
        'flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5 relative',
        file.isSelected &&
          'bg-primary/20 dark:bg-primary/15 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-tertiary dark:before:bg-secondary before:rounded-full',
        className
      )}
      data-focused={file.isFocused}
    >
      {showIcon && (
        <Icon
          className={cn(
            'size-4 text-muted-foreground flex-shrink-0',
            iconClassName
          )}
        />
      )}

      {file.isRenaming && itemInstance ? (
        <div className='flex-1 flex items-center gap-1'>
          <Input
            {...itemInstance.getRenameInputProps()}
            autoFocus
            className='flex-1 h-6 px-1 py-0 text-sm'
            data-rename-input={file.id}
            onKeyDown={e => {
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
            type='button'
            className='p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors'
            onClick={() => {
              // Get the input element by data attribute and trigger blur to save
              const input = document.querySelector(
                `input[data-rename-input="${file.id}"]`
              ) as HTMLInputElement;
              if (input) {
                input.blur();
              }
            }}
            title='Save (Enter)'
          >
            <svg
              className='w-3.5 h-3.5 text-green-600 dark:text-green-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </button>
          <button
            type='button'
            className='p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
            onClick={() => {
              // Trigger escape key event to cancel rename
              const input = document.querySelector(
                `input[data-rename-input="${file.id}"]`
              ) as HTMLInputElement;
              if (input) {
                const escapeEvent = new KeyboardEvent('keydown', {
                  key: 'Escape',
                  bubbles: true,
                });
                input.dispatchEvent(escapeEvent);
              }
            }}
            title='Cancel (Esc)'
          >
            <svg
              className='w-3.5 h-3.5 text-red-600 dark:text-red-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      ) : (
        <span className='flex-1 truncate text-sm'>
          {file.originalName || file.fileName}
        </span>
      )}

      {showSize && (
        <span className='text-xs text-muted-foreground translate-y-0.5'>
          {formatFileSize(file.fileSize)}
        </span>
      )}

      {showDate && file.uploadedAt && (
        <span className='text-xs text-muted-foreground translate-y-0.5'>
          {formatFileDate(file.uploadedAt)}
        </span>
      )}

      {showStatus && file.processingStatus && (
        <span
          className={cn('text-xs translate-y-0.5', {
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
        <span className='text-xs text-red-600 font-semibold translate-y-0.5'>
          ⚠️ Infected
        </span>
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
