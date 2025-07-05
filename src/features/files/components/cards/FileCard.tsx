// FileCard - Individual File Display Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MoreHorizontal,
  Download,
  Share2,
  Eye,
  Trash2,
  FolderOpen,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Badge } from '@/components/ui/shadcn/badge';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { useFileCardStore } from '../../hooks';
import { formatDate, formatFileSize } from '../../utils';
import { getFileIcon } from '../../constants';
import type { FileId } from '../../types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FileCardProps {
  fileId: FileId;
  view: 'grid' | 'list' | 'card';
  index: number;
  className?: string;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FileCard = memo(({ fileId, view, index, className }: FileCardProps) => {
  // Store-based state - eliminates prop drilling
  const { file, isSelected, isMultiSelectMode, computed, actions } =
    useFileCardStore(fileId);

  // Early return for missing file
  if (!file) {
    return (
      <div className={cn('animate-pulse bg-gray-100 rounded-lg', className)}>
        <div className='h-48 bg-gray-200 rounded-lg' />
      </div>
    );
  }

  // Event handlers
  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      actions.onSelect(e.metaKey || e.ctrlKey);
    },
    [actions]
  );

  const handleCardClick = useCallback(() => {
    actions.onPreview();
  }, [actions]);

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // TODO: Implement download functionality
      console.log('Download file:', file.name);
    },
    [file.name]
  );

  // Get file icon
  const fileIcon = getFileIcon(file.type);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.1, duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  // Render based on view mode
  if (view === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        initial='hidden'
        animate='visible'
        whileHover='hover'
        className={cn(
          'group flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors',
          isSelected && 'bg-blue-50 border-blue-200',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Selection checkbox */}
        {isMultiSelectMode && (
          <Checkbox
            checked={isSelected}
            onChange={handleSelect}
            className='flex-shrink-0'
          />
        )}

        {/* File icon */}
        <div className='flex-shrink-0'>
          <span className='text-2xl'>{fileIcon}</span>
        </div>

        {/* File info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h3 className='font-medium text-gray-900 truncate'>{file.name}</h3>
            <Badge variant='secondary' className='flex-shrink-0'>
              {file.type.toUpperCase()}
            </Badge>
          </div>
          <div className='flex items-center gap-4 text-sm text-gray-500 mt-1'>
            <span>{formatFileSize(file.size)}</span>
            <span>Modified {formatDate(file.updatedAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              actions.onPreview();
            }}
          >
            <Eye className='w-4 h-4' />
          </Button>
          <Button variant='ghost' size='sm' onClick={handleDownload}>
            <Download className='w-4 h-4' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={actions.onPreview}>
                <Eye className='w-4 h-4 mr-2' />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className='w-4 h-4 mr-2' />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.onShare}>
                <Share2 className='w-4 h-4 mr-2' />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.onMove}>
                <FolderOpen className='w-4 h-4 mr-2' />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={actions.onDelete}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  // Grid/Card view
  return (
    <motion.div
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      whileHover='hover'
      className={cn(
        'group relative bg-white rounded-lg border shadow-sm hover:shadow-md cursor-pointer transition-all',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Selection checkbox */}
      {isMultiSelectMode && (
        <div className='absolute top-2 left-2 z-10'>
          <Checkbox
            checked={isSelected}
            onChange={handleSelect}
            className='bg-white shadow-sm'
          />
        </div>
      )}

      {/* File thumbnail/icon */}
      <div className='aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center'>
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className='w-full h-full object-cover rounded-t-lg'
          />
        ) : (
          <span className='text-6xl'>{fileIcon}</span>
        )}
      </div>

      {/* File info */}
      <div className='p-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <h3
              className='font-medium text-gray-900 truncate'
              title={file.name}
            >
              {file.name}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              <Badge variant='secondary' className='text-xs'>
                {file.type.toUpperCase()}
              </Badge>
              <span className='text-xs text-gray-500'>
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='opacity-0 group-hover:opacity-100 transition-opacity'
              >
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={actions.onPreview}>
                <Eye className='w-4 h-4 mr-2' />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className='w-4 h-4 mr-2' />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.onShare}>
                <Share2 className='w-4 h-4 mr-2' />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={actions.onMove}>
                <FolderOpen className='w-4 h-4 mr-2' />
                Move
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={actions.onDelete}
                className='text-red-600 hover:text-red-700'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Modified date */}
        <p className='text-xs text-gray-500 mt-2'>
          Modified {formatDate(file.updatedAt)}
        </p>
      </div>
    </motion.div>
  );
});

FileCard.displayName = 'FileCard';

export default FileCard;
