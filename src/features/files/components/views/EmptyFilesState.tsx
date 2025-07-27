// EmptyFilesState - Empty State Component for Files
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Upload, FolderPlus, Files } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core/shadcn/button';
import { useFilesListStore } from '../../hooks/use-files-composite';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface EmptyFilesStateProps {
  className?: string;
  onUpload?: () => void;
  onCreateFolder?: () => void;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const EmptyFilesState = memo(
  ({ className, onUpload, onCreateFolder }: EmptyFilesStateProps) => {
    // Store-based state - eliminates prop drilling
    const { filters, openUploadModal, openCreateFolderModal, clearFilters } =
      useFilesListStore();

    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className={cn(
          'flex flex-col items-center justify-center py-16 px-4 text-center',
          className
        )}
      >
        {/* Icon */}
        <motion.div variants={itemVariants} className='mb-6'>
          <div className='w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center'>
            <Files className='w-12 h-12 text-gray-400' />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          variants={itemVariants}
          className='text-2xl font-semibold text-gray-900 mb-2'
        >
          {filters.hasActiveFilters ? 'No files found' : 'No shared files yet'}
        </motion.h2>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className='text-gray-600 mb-8 max-w-sm text-center'
        >
          {filters.hasActiveFilters
            ? "Try adjusting your search criteria or filters to find what you're looking for."
            : 'No files have been shared with you yet. Files uploaded via your share links will appear here for you to organize and copy to your workspace.'}
        </motion.p>

        {/* Actions */}
        {!filters.hasActiveFilters && (
          <motion.div
            variants={itemVariants}
            className='flex flex-col sm:flex-row gap-3 mb-8'
          >
            <Button
              onClick={() => window.open('/dashboard/links', '_blank')}
              size='lg'
              className='flex items-center gap-2'
            >
              <Upload className='w-5 h-5' />
              Create Upload Link
            </Button>
            <Button
              onClick={onCreateFolder || openCreateFolderModal}
              variant='outline'
              size='lg'
              className='flex items-center gap-2'
            >
              <FolderPlus className='w-5 h-5' />
              Create Folder
            </Button>
          </motion.div>
        )}

        {/* Info box */}
        {!filters.hasActiveFilters && (
          <motion.div
            variants={itemVariants}
            className='p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto'
          >
            <div className='flex items-start gap-3'>
              <div className='text-blue-600 text-xl'>💡</div>
              <div className='text-sm text-blue-800'>
                <div className='font-medium mb-1'>How it works:</div>
                <p>
                  Files uploaded through your share links will appear here. You
                  can then organize them into folders and copy them to your
                  workspace for permanent storage.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Clear filters for filtered state */}
        {filters.hasActiveFilters && (
          <motion.div variants={itemVariants} className='mt-4'>
            <Button onClick={clearFilters} variant='outline' size='lg'>
              Clear Filters
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }
);

EmptyFilesState.displayName = 'EmptyFilesState';

export default EmptyFilesState;
