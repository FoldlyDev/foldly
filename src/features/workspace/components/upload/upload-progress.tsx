'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/shadcn/progress';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  FileUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadProgressProps {
  isUploading: boolean;
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
}

export function UploadProgress({
  isUploading,
  totalFiles,
  completedFiles,
  failedFiles,
}: UploadProgressProps) {
  if (!isUploading || totalFiles === 0) return null;

  const progress = (completedFiles / totalFiles) * 100;
  const hasErrors = failedFiles > 0;
  const isComplete = completedFiles === totalFiles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        'display-card backdrop-blur-sm shadow-xl',
        hasErrors
          ? 'border-destructive/30 bg-gradient-to-br from-destructive/5 via-background/60 to-destructive/5'
          : isComplete
            ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 via-background/60 to-green-500/5'
            : 'border-primary/30 bg-gradient-to-br from-primary/5 via-background/60 to-primary/5'
      )}
    >
      {/* Premium animated background */}
      <div className='absolute inset-0 pointer-events-none'>
        <motion.div
          animate={{
            x: [0, 100, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent'
        />
        {/* Floating particles */}
        <motion.div
          animate={{
            y: [-20, -40, -20],
            x: [0, 10, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className='absolute top-4 right-4'
        >
          <Sparkles className='w-4 h-4 text-primary/30' />
        </motion.div>
      </div>

      <div className='relative p-6 space-y-4'>
        {/* Premium Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <motion.div
              animate={{
                rotate: isComplete ? 0 : [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 2,
                  repeat: isComplete ? 0 : Infinity,
                  ease: 'linear',
                },
                scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
              }}
              className={cn(
                'p-3 rounded-2xl shadow-lg',
                hasErrors
                  ? 'bg-gradient-to-br from-destructive to-destructive/80 shadow-destructive/30'
                  : isComplete
                    ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/30'
                    : 'bg-gradient-to-br from-primary to-primary/80 shadow-primary/30'
              )}
            >
              {isComplete ? (
                <CheckCircle className='w-5 h-5 text-primary-foreground' />
              ) : (
                <FileUp className='w-5 h-5 text-primary-foreground' />
              )}
            </motion.div>
            <div>
              <p className='text-base font-semibold text-foreground'>
                {isComplete ? 'Upload Complete!' : 'Uploading files...'}
              </p>
              <div className='flex items-center gap-2 mt-1'>
                <span className='text-sm text-muted-foreground font-medium'>
                  {completedFiles} of {totalFiles} files
                </span>
                {hasErrors && (
                  <span className='flex items-center gap-1 text-sm text-destructive font-medium'>
                    <AlertCircle className='w-3 h-3' />
                    {failedFiles} failed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Animated Progress Percentage */}
          <motion.div
            className='text-right'
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <p
              className={cn(
                'text-2xl font-bold',
                hasErrors
                  ? 'text-destructive'
                  : isComplete
                    ? 'text-green-600'
                    : 'text-primary'
              )}
            >
              {Math.round(progress)}%
            </p>
            <p className='text-xs text-muted-foreground font-medium'>
              Progress
            </p>
          </motion.div>
        </div>

        {/* Premium Progress Bar */}
        <div className='relative'>
          <div className='relative h-3 bg-muted rounded-full overflow-hidden shadow-inner'>
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full shadow-sm',
                hasErrors
                  ? 'bg-gradient-to-r from-destructive to-destructive/80'
                  : isComplete
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-primary to-primary/80'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Animated shine effect */}
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-background/30 to-transparent animate-shimmer' />

              {/* Progress glow */}
              <div className='absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/30 rounded-full blur-xl' />
            </motion.div>
          </div>

          {/* Progress segments */}
          <div className='absolute inset-0 flex'>
            {Array.from({ length: totalFiles }).map((_, index) => (
              <div
                key={index}
                className='flex-1 border-r border-border/30 last:border-r-0'
              />
            ))}
          </div>
        </div>

        {/* Status Details */}
        <AnimatePresence mode='wait'>
          {completedFiles > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='space-y-2 pt-2'
            >
              {completedFiles > failedFiles && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className='flex items-center gap-2'
                >
                  <div className='p-1 rounded-full bg-green-500/10'>
                    <CheckCircle className='w-3.5 h-3.5 text-green-600' />
                  </div>
                  <span className='text-sm text-green-600 font-medium'>
                    {completedFiles - failedFiles} file
                    {completedFiles - failedFiles !== 1 ? 's' : ''} uploaded
                    successfully
                  </span>
                </motion.div>
              )}

              {hasErrors && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className='flex items-center gap-2'
                >
                  <div className='p-1 rounded-full bg-destructive/10'>
                    <AlertCircle className='w-3.5 h-3.5 text-destructive' />
                  </div>
                  <span className='text-sm text-destructive font-medium'>
                    {failedFiles} file{failedFiles !== 1 ? 's' : ''} failed to
                    upload
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
