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
  Star,
  Pin,
  Copy,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/core/shadcn/dropdown-menu';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { Checkbox } from '@/components/ui/core/shadcn/checkbox';
import { useFolderCardStore } from '../../hooks/use-files-composite';
import type { FolderId } from '@/types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FolderCardProps {
  readonly folderId: FolderId;
  readonly view: 'grid' | 'list' | 'card';
  readonly index: number;
  readonly className?: string;
  readonly showExpansion?: boolean;
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
    const { folder, isSelected, isExpanded, isMultiSelectMode, computed } =
      useFolderCardStore(folderId);

    // Early return for missing folder
    if (!folder || !computed) {
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
        computed.handleNavigate();
      }
    }, [isMultiSelectMode, computed]);

    const handleSelectClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        computed.handleSelect();
      },
      [computed]
    );

    const handleToggleExpansion = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        computed.handleExpand();
      },
      [computed]
    );

    // Use default folder styling for MVP
    const defaultFolderColor = '#3b82f6'; // Blue theme color

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
            computed.isCurrentFolder && 'bg-green-50 border-green-200',
            computed.isDraggedOver && 'bg-blue-100 border-blue-300',
            className
          )}
          onClick={handleCardClick}
          onDragOver={computed.handleDragOver}
          onDragLeave={computed.handleDragLeave}
          onDrop={computed.handleDrop}
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
              onCheckedChange={handleSelectClick}
              className='flex-shrink-0'
            />
          )}

          {/* Folder icon */}
          <div className='flex-shrink-0'>
            <div
              className='w-8 h-8 rounded flex items-center justify-center'
              style={{ backgroundColor: defaultFolderColor }}
            >
              {computed.isCurrentFolder ? (
                <FolderOpen className='w-5 h-5 text-white' />
              ) : (
                <Folder className='w-5 h-5 text-white' />
              )}
            </div>
          </div>

          {/* Folder info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <h3
                className='font-medium text-gray-900 truncate'
                title={folder.name}
              >
                {folder.name}
              </h3>
              <Badge variant='secondary' className='flex-shrink-0 text-xs'>
                FOLDER
              </Badge>
              {computed.isFavorite && (
                <Star className='w-3 h-3 text-yellow-500 fill-current' />
              )}
              {computed.isPinned && (
                <Pin className='w-3 h-3 text-blue-500 fill-current' />
              )}
              {computed.folderStats.isEmpty && (
                <Badge variant='outline' className='text-xs'>
                  Empty
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-500 mt-1'>
              <span>{computed.folderStats.fileCount} files</span>
              {computed.folderStats.subfolderCount > 0 && (
                <span>{computed.folderStats.subfolderCount} folders</span>
              )}
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
                computed.handleNavigate();
              }}
            >
              <FolderOpen className='w-4 h-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={e => {
                e.stopPropagation();
                computed.handleToggleFavorite();
              }}
              className={computed.isFavorite ? 'text-yellow-500' : ''}
            >
              <Star
                className={cn('w-4 h-4', computed.isFavorite && 'fill-current')}
              />
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
                <DropdownMenuItem onClick={computed.handleNavigate}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={computed.handleViewDetails}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={computed.handleToggleFavorite}>
                  <Star
                    className={cn(
                      'w-4 h-4 mr-2',
                      computed.isFavorite && 'fill-current text-yellow-500'
                    )}
                  />
                  {computed.isFavorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={computed.handleTogglePin}>
                  <Pin
                    className={cn(
                      'w-4 h-4 mr-2',
                      computed.isPinned && 'fill-current text-blue-500'
                    )}
                  />
                  {computed.isPinned ? 'Unpin' : 'Pin'}
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
                <DropdownMenuItem onClick={computed.handleShare}>
                  <Share2 className='w-4 h-4 mr-2' />
                  Share
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
          computed.isCurrentFolder && 'ring-2 ring-green-500 ring-offset-2',
          computed.isDraggedOver &&
            'ring-2 ring-blue-300 ring-offset-2 bg-blue-50',
          className
        )}
        onClick={handleCardClick}
        onDragOver={computed.handleDragOver}
        onDragLeave={computed.handleDragLeave}
        onDrop={computed.handleDrop}
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

        {/* Favorite/Pin indicators */}
        <div className='absolute top-2 right-2 z-10 flex gap-1'>
          {computed.isFavorite && (
            <div className='bg-white/80 rounded-full p-1'>
              <Star className='w-3 h-3 text-yellow-500 fill-current' />
            </div>
          )}
          {computed.isPinned && (
            <div className='bg-white/80 rounded-full p-1'>
              <Pin className='w-3 h-3 text-blue-500 fill-current' />
            </div>
          )}
        </div>

        {/* Folder icon */}
        <div className='aspect-square bg-gray-50 rounded-t-lg flex items-center justify-center relative'>
          <div
            className='w-20 h-20 rounded-lg flex items-center justify-center shadow-md'
            style={{ backgroundColor: defaultFolderColor }}
          >
            {computed.isCurrentFolder ? (
              <FolderOpen className='w-10 h-10 text-white' />
            ) : (
              <Folder className='w-10 h-10 text-white' />
            )}
          </div>

          {/* Quick actions on hover */}
          <div className='absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
            <div className='flex gap-1'>
              <Button
                variant='secondary'
                size='sm'
                className='h-8 w-8 p-0 bg-white/80 hover:bg-white'
                onClick={e => {
                  e.stopPropagation();
                  computed.handleNavigate();
                }}
              >
                <FolderOpen className='w-4 h-4' />
              </Button>
              <Button
                variant='secondary'
                size='sm'
                className={cn(
                  'h-8 w-8 p-0 bg-white/80 hover:bg-white',
                  computed.isFavorite && 'text-yellow-500'
                )}
                onClick={e => {
                  e.stopPropagation();
                  computed.handleToggleFavorite();
                }}
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    computed.isFavorite && 'fill-current'
                  )}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Folder info */}
        <div className='p-4'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1 min-w-0'>
              <h3
                className='font-medium text-gray-900 truncate text-sm'
                title={folder.name}
              >
                {folder.name}
              </h3>
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant='secondary' className='text-xs'>
                  FOLDER
                </Badge>
                <span className='text-xs text-gray-500'>
                  {computed.folderStats.fileCount} files
                </span>
                {computed.folderStats.subfolderCount > 0 && (
                  <span className='text-xs text-gray-500'>
                    {computed.folderStats.subfolderCount} folders
                  </span>
                )}
                {computed.folderStats.isEmpty && (
                  <Badge variant='outline' className='text-xs'>
                    Empty
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
                <DropdownMenuItem onClick={computed.handleNavigate}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={computed.handleViewDetails}>
                  <FolderOpen className='w-4 h-4 mr-2' />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={computed.handleToggleFavorite}>
                  <Star
                    className={cn(
                      'w-4 h-4 mr-2',
                      computed.isFavorite && 'fill-current text-yellow-500'
                    )}
                  />
                  {computed.isFavorite
                    ? 'Remove from Favorites'
                    : 'Add to Favorites'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={computed.handleTogglePin}>
                  <Pin
                    className={cn(
                      'w-4 h-4 mr-2',
                      computed.isPinned && 'fill-current text-blue-500'
                    )}
                  />
                  {computed.isPinned ? 'Unpin' : 'Pin'}
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
                <DropdownMenuItem onClick={computed.handleShare}>
                  <Share2 className='w-4 h-4 mr-2' />
                  Share
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

          {/* Size and modified date */}
          <div className='flex items-center justify-between text-xs text-gray-500 mt-2'>
            <span>{computed.formattedSize}</span>
            <span>Modified {computed.formattedDate}</span>
          </div>
        </div>
      </motion.div>
    );
  }
);

FolderCard.displayName = 'FolderCard';

export default FolderCard;
