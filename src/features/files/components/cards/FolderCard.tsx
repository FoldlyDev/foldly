// FolderCard - Individual Folder Display Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  MoreHorizontal,
  Share2,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
  FileText,
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
import { useFolderCardStore } from '../../hooks';
import { formatFileSize } from '../../utils';
import { getFolderColorValue } from '../../constants';
import type { FolderId } from '../../types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FolderCardProps {
  folderId: FolderId;
  view: 'grid' | 'list' | 'card';
  index: number;
  className?: string;
  showExpansion?: boolean;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FolderCard = memo(
  ({
    folderId,
    view,
    index,
    className,
    showExpansion = false,
  }: FolderCardProps) => {
    // Store-based state - eliminates prop drilling
    const {
      folder,
      isSelected,
      isExpanded,
      isMultiSelectMode,
      computed,
      actions,
    } = useFolderCardStore(folderId);

    // Early return for missing folder
    if (!folder) {
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
      actions.onOpen();
    }, [actions]);

    const handleToggleExpansion = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        actions.onToggleExpansion();
      },
      [actions]
    );

    // Get folder color
    const folderColor = getFolderColorValue(folder.color);

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
          {/* Expansion toggle (if enabled) */}
          {showExpansion && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleToggleExpansion}
              className='p-1 h-auto flex-shrink-0'
            >
              {isExpanded ? (
                <ChevronDown className='w-4 h-4' />
              ) : (
                <ChevronRight className='w-4 h-4' />
              )}
            </Button>
          )}

          {/* Selection checkbox */}
          {isMultiSelectMode && (
            <Checkbox
              checked={isSelected}
              onChange={handleSelect}
              className='flex-shrink-0'
            />
          )}

          {/* Folder icon */}
          <div className='flex-shrink-0'>
            <div
              className='w-8 h-8 rounded flex items-center justify-center'
              style={{ backgroundColor: folderColor }}
            >
              <Folder className='w-5 h-5 text-white' />
            </div>
          </div>

          {/* Folder info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <h3 className='font-medium text-gray-900 truncate'>
                {folder.name}
              </h3>
              <Badge variant='secondary' className='flex-shrink-0'>
                FOLDER
              </Badge>
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-500 mt-1'>
              <span>{computed.fileCount} files</span>
              <span>{formatFileSize(computed.totalSize)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Button
              variant='ghost'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                actions.onOpen();
              }}
            >
              <FolderOpen className='w-4 h-4' />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='sm'>
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={actions.onOpen}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={actions.onRename}>
                  <Edit3 className='w-4 h-4 mr-2' />
                  Rename
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

        {/* Folder icon */}
        <div className='aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center'>
          <div
            className='w-20 h-20 rounded-lg flex items-center justify-center shadow-md'
            style={{ backgroundColor: folderColor }}
          >
            <Folder className='w-10 h-10 text-white' />
          </div>
        </div>

        {/* Folder info */}
        <div className='p-4'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1 min-w-0'>
              <h3
                className='font-medium text-gray-900 truncate'
                title={folder.name}
              >
                {folder.name}
              </h3>
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant='secondary' className='text-xs'>
                  FOLDER
                </Badge>
                <span className='text-xs text-gray-500'>
                  {computed.fileCount} files
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
                <DropdownMenuItem onClick={actions.onOpen}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={actions.onRename}>
                  <Edit3 className='w-4 h-4 mr-2' />
                  Rename
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

          {/* Size info */}
          <p className='text-xs text-gray-500 mt-2'>
            {formatFileSize(computed.totalSize)}
          </p>
        </div>
      </motion.div>
    );
  }
);

FolderCard.displayName = 'FolderCard';

export default FolderCard;
