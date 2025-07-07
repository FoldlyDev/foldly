// FilesList - Files and Folders List Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FileCard, FolderCard } from '../cards';
import { useFilesListStore } from '../../hooks';
import {
  sortFiles,
  sortFolders,
  filterFiles,
  filterFolders,
} from '../../utils';
import type { ViewMode } from '../../types';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface FilesListProps {
  className?: string;
  viewMode?: ViewMode;
  showFolders?: boolean;
  showFiles?: boolean;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const FilesList = memo(
  ({
    className,
    viewMode: propViewMode,
    showFolders = true,
    showFiles = true,
  }: FilesListProps) => {
    // Store-based state - eliminates prop drilling
    const {
      files,
      folders,
      viewMode: storeViewMode,
      sortBy,
      sortOrder,
      searchQuery,
      activeFilters,
      computed,
      isLoading,
    } = useFilesListStore();

    // Use prop view mode or store view mode
    const effectiveViewMode = propViewMode || storeViewMode;

    // Memoized filtered and sorted data
    const processedFolders = useMemo(() => {
      if (!showFolders) return [];

      let processed = folders;

      // Apply filters
      if (searchQuery || Object.keys(activeFilters).length > 0) {
        processed = filterFolders(processed, searchQuery, activeFilters);
      }

      // Apply sorting
      processed = sortFolders(processed, sortBy, sortOrder);

      return processed;
    }, [folders, showFolders, searchQuery, activeFilters, sortBy, sortOrder]);

    const processedFiles = useMemo(() => {
      if (!showFiles) return [];

      let processed = files;

      // Apply filters
      if (searchQuery || Object.keys(activeFilters).length > 0) {
        processed = filterFiles(processed, searchQuery, activeFilters);
      }

      // Apply sorting
      processed = sortFiles(processed, sortBy, sortOrder);

      return processed;
    }, [files, showFiles, searchQuery, activeFilters, sortBy, sortOrder]);

    // Loading state
    if (isLoading) {
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='animate-pulse'>
              <div className='h-20 bg-gray-200 rounded-lg' />
            </div>
          ))}
        </div>
      );
    }

    // Empty state
    if (processedFolders.length === 0 && processedFiles.length === 0) {
      return (
        <div className={cn('text-center py-12', className)}>
          <div className='text-gray-500'>
            <p className='text-lg font-medium'>No files or folders found</p>
            <p className='text-sm mt-1'>
              {computed.isFiltered
                ? 'Try adjusting your search or filters'
                : 'Upload files or create folders to get started'}
            </p>
          </div>
        </div>
      );
    }

    // Grid/Card layout
    if (effectiveViewMode === 'grid' || effectiveViewMode === 'card') {
      return (
        <div className={cn('grid gap-4', className)}>
          {/* Folders */}
          <AnimatePresence mode='popLayout'>
            {processedFolders.map((folder, index) => (
              <motion.div
                key={folder.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  effectiveViewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                )}
              >
                <FolderCard
                  folderId={folder.id}
                  view={effectiveViewMode}
                  index={index}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Files */}
          <AnimatePresence mode='popLayout'>
            {processedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  effectiveViewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                )}
              >
                <FileCard
                  fileId={file.id}
                  view={effectiveViewMode}
                  index={processedFolders.length + index}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      );
    }

    // List layout
    return (
      <div className={cn('space-y-2', className)}>
        {/* Folders */}
        <AnimatePresence mode='popLayout'>
          {processedFolders.map((folder, index) => (
            <motion.div
              key={folder.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FolderCard folderId={folder.id} view='list' index={index} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Files */}
        <AnimatePresence mode='popLayout'>
          {processedFiles.map((file, index) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FileCard
                fileId={file.id}
                view='list'
                index={processedFolders.length + index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

FilesList.displayName = 'FilesList';

export default FilesList;
