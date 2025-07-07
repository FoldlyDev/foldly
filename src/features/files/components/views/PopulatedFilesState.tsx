// PopulatedFilesState - Main Files View Component
// Following 2025 React patterns with Zustand store integration
// Eliminates prop drilling through composite hooks

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FilesList } from '../lists';
import { useFilesListStore } from '../../hooks';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface PopulatedFilesStateProps {
  className?: string;
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

const PopulatedFilesState = memo(({ className }: PopulatedFilesStateProps) => {
  // Store-based state - eliminates prop drilling
  const { viewMode, computed } = useFilesListStore();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className={cn('space-y-6', className)}
    >
      {/* Files List */}
      <FilesList viewMode={viewMode} />

      {/* Summary */}
      <div className='text-center text-sm text-gray-500 py-4'>
        <p>
          {computed.totalFolders > 0 && (
            <span>
              {computed.totalFolders} folder
              {computed.totalFolders !== 1 ? 's' : ''}
            </span>
          )}
          {computed.totalFolders > 0 && computed.totalFiles > 0 && (
            <span> • </span>
          )}
          {computed.totalFiles > 0 && (
            <span>
              {computed.totalFiles} file{computed.totalFiles !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
});

PopulatedFilesState.displayName = 'PopulatedFilesState';

export default PopulatedFilesState;
