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
  Edit3,
  Copy,
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
import { useFileCardStore } from '../../hooks/use-files-composite';
import type { FileId } from '@/types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FileCardProps {
  readonly fileId: FileId;
  readonly view: 'grid' | 'list' | 'card';
  readonly index: number;
  readonly className?: string;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FileCard = memo(({ fileId, view, index, className }: FileCardProps) => {
  // Store-based state - eliminates prop drilling
  const { file, isSelected, isMultiSelectMode, computed } =
    useFileCardStore(fileId);

  // Early return for missing file
  if (!file || !computed) {
    return (
      <div className={cn('animate-pulse bg-gray-100 rounded-lg', className)}>
        <div className='h-48 bg-gray-200 rounded-lg' />
      </div>
    );
  }

  // Event handlers using computed values from store
  const handleCardClick = useCallback(() => {
    if (isMultiSelectMode) {
      computed.handleSelect();
    } else {
      computed.handlePreview();
    }
  }, [isMultiSelectMode, computed]);

  const handleSelectClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      computed.handleSelect();
    },
    [computed]
  );

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: index * 0.05, duration: 0.3 },
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    if (type.includes('zip') || type.includes('archive')) return '🗜️';
    return '📁';
  };

  const fileIcon = getFileTypeIcon(file.type);

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
          computed.isProcessing && 'opacity-50',
          computed.isError && 'border-red-200 bg-red-50',
          className
        )}
        onClick={handleCardClick}
        onDragStart={computed.handleDragStart}
        onDragEnd={computed.handleDragEnd}
        draggable
      >
        {/* Selection checkbox */}
        {isMultiSelectMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectClick}
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
            <h3
              className='font-medium text-gray-900 truncate'
              title={file.name}
            >
              {file.name}
            </h3>
            {file.type && (
              <Badge variant='secondary' className='flex-shrink-0 text-xs'>
                {computed.fileExtension.toUpperCase()}
              </Badge>
            )}
            {computed.isProcessing && (
              <Badge variant='outline' className='flex-shrink-0 text-xs'>
                Processing
              </Badge>
            )}
            {computed.isError && (
              <Badge variant='destructive' className='flex-shrink-0 text-xs'>
                Error
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-4 text-sm text-gray-500 mt-1'>
            <span>{computed.formattedSize}</span>
            <span>Modified {computed.formattedDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              computed.handlePreview();
            }}
          >
            <Eye className='w-4 h-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={e => {
              e.stopPropagation();
              computed.handleDownload();
            }}
          >
            <Download className='w-4 h-4' />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={computed.handlePreview}>
                <Eye className='w-4 h-4 mr-2' />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleViewDetails}>
                <Eye className='w-4 h-4 mr-2' />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleDownload}>
                <Download className='w-4 h-4 mr-2' />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleShare}>
                <Share2 className='w-4 h-4 mr-2' />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={computed.handleRename}>
                <Edit3 className='w-4 h-4 mr-2' />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleMove}>
                <FolderOpen className='w-4 h-4 mr-2' />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleCopy}>
                <Copy className='w-4 h-4 mr-2' />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={computed.handleDelete}
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
        computed.isProcessing && 'opacity-50',
        computed.isError && 'border-red-200',
        computed.isBeingDragged && 'opacity-30',
        className
      )}
      onClick={handleCardClick}
      onDragStart={computed.handleDragStart}
      onDragEnd={computed.handleDragEnd}
      draggable
      onFocus={computed.handleFocus}
      tabIndex={0}
    >
      {/* Selection checkbox */}
      {isMultiSelectMode && (
        <div className='absolute top-2 left-2 z-10'>
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectClick}
            className='bg-white shadow-sm'
          />
        </div>
      )}

      {/* File thumbnail/icon */}
      <div className='aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center relative overflow-hidden'>
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className='w-full h-full object-cover rounded-t-lg'
            loading='lazy'
          />
        ) : (
          <span className='text-6xl'>{fileIcon}</span>
        )}

        {/* Processing overlay */}
        {computed.isProcessing && (
          <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-t-lg'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-white'></div>
          </div>
        )}

        {/* Error overlay */}
        {computed.isError && (
          <div className='absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center rounded-t-lg'>
            <span className='text-red-600 text-xl'>⚠️</span>
          </div>
        )}

        {/* Quick actions on hover */}
        <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <div className='flex gap-1'>
            <Button
              variant='secondary'
              size='sm'
              className='h-8 w-8 p-0 bg-white/80 hover:bg-white'
              onClick={e => {
                e.stopPropagation();
                computed.handlePreview();
              }}
            >
              <Eye className='w-4 h-4' />
            </Button>
            <Button
              variant='secondary'
              size='sm'
              className='h-8 w-8 p-0 bg-white/80 hover:bg-white'
              onClick={e => {
                e.stopPropagation();
                computed.handleDownload();
              }}
            >
              <Download className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* File info */}
      <div className='p-4'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <h3
              className='font-medium text-gray-900 truncate text-sm'
              title={file.name}
            >
              {file.name}
            </h3>
            <div className='flex items-center gap-2 mt-1'>
              {file.type && (
                <Badge variant='secondary' className='text-xs'>
                  {computed.fileExtension.toUpperCase()}
                </Badge>
              )}
              <span className='text-xs text-gray-500'>
                {computed.formattedSize}
              </span>
              {computed.isProcessing && (
                <Badge variant='outline' className='text-xs'>
                  Processing
                </Badge>
              )}
              {computed.isError && (
                <Badge variant='destructive' className='text-xs'>
                  Error
                </Badge>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0'
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={computed.handlePreview}>
                <Eye className='w-4 h-4 mr-2' />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleViewDetails}>
                <Eye className='w-4 h-4 mr-2' />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleDownload}>
                <Download className='w-4 h-4 mr-2' />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleShare}>
                <Share2 className='w-4 h-4 mr-2' />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={computed.handleRename}>
                <Edit3 className='w-4 h-4 mr-2' />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleMove}>
                <FolderOpen className='w-4 h-4 mr-2' />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem onClick={computed.handleCopy}>
                <Copy className='w-4 h-4 mr-2' />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={computed.handleDelete}
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
          Modified {computed.formattedDate}
        </p>
      </div>
    </motion.div>
  );
});

FileCard.displayName = 'FileCard';

export default FileCard;
