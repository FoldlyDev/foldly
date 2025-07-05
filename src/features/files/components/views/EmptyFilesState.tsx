// EmptyFilesState - Empty State Component for Files
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Upload, FolderPlus, Files } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/shadcn/button';
import { useFilesListStore } from '../../hooks';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface EmptyFilesStateProps {
  className?: string;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const EmptyFilesState = memo(({ className }: EmptyFilesStateProps) => {
  // Store-based state - eliminates prop drilling
  const { computed, actions } = useFilesListStore();

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
        {computed.isFiltered ? 'No files found' : 'No files yet'}
      </motion.h2>

      {/* Description */}
      <motion.p variants={itemVariants} className='text-gray-600 mb-8 max-w-sm'>
        {computed.isFiltered
          ? "Try adjusting your search criteria or filters to find what you're looking for."
          : 'Upload your first files or create folders to organize your workspace.'}
      </motion.p>

      {/* Actions */}
      {!computed.isFiltered && (
        <motion.div
          variants={itemVariants}
          className='flex flex-col sm:flex-row gap-3'
        >
          <Button
            onClick={actions.onUpload}
            size='lg'
            className='flex items-center gap-2'
          >
            <Upload className='w-5 h-5' />
            Upload Files
          </Button>
          <Button
            onClick={actions.onCreateFolder}
            variant='outline'
            size='lg'
            className='flex items-center gap-2'
          >
            <FolderPlus className='w-5 h-5' />
            Create Folder
          </Button>
        </motion.div>
      )}

      {/* Clear filters for filtered state */}
      {computed.isFiltered && (
        <motion.div variants={itemVariants} className='mt-4'>
          <Button onClick={actions.onClearFilters} variant='outline' size='lg'>
            Clear Filters
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
});

EmptyFilesState.displayName = 'EmptyFilesState';

export default EmptyFilesState;
