'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, FolderOpen, Move, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  TreeOperationState,
  TreeOperationType,
} from '../../hooks/use-tree-operation-status';

interface TreeOperationOverlayProps {
  operationState: TreeOperationState;
  onCancel?: () => void;
  className?: string;
}

const operationConfig = {
  move: {
    icon: Move,
    title: 'Moving Files',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  delete: {
    icon: Trash2,
    title: 'Deleting Files',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  batch_move: {
    icon: Move,
    title: 'Moving Multiple Items',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  batch_delete: {
    icon: Trash2,
    title: 'Deleting Multiple Items',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  reorder: {
    icon: FolderOpen,
    title: 'Reordering Items',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
} as const;

function ProgressBar({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-3', className)}>
      <motion.div
        className='bg-blue-600 h-3 rounded-full'
        initial={{ width: '0%' }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

function SpinningIconLoader({
  Icon,
  className,
  iconColor = 'text-gray-600',
}: {
  Icon: React.ComponentType<any>;
  className?: string;
  iconColor?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {/* Static Icon */}
      <Icon className={cn('w-10 h-10', iconColor)} />

      {/* Spinning Circle around the icon */}
      <motion.div
        className='absolute inset-0 pointer-events-none'
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg className='w-10 h-10' viewBox='0 0 40 40' fill='none'>
          <circle
            cx='20'
            cy='20'
            r='16'
            stroke='currentColor'
            strokeWidth='3'
            strokeLinecap='round'
            strokeDasharray='60 40'
            className='text-blue-600'
          />
        </svg>
      </motion.div>
    </div>
  );
}

function StatusIcon({
  status,
  operationType,
  className,
}: {
  status: TreeOperationState['status'];
  operationType: TreeOperationType | null;
  className?: string;
}) {
  if (status === 'success') {
    return (
      <CheckCircle className={cn('w-10 h-10 text-green-600', className)} />
    );
  }

  if (status === 'error') {
    return <XCircle className={cn('w-10 h-10 text-red-600', className)} />;
  }

  if (
    operationType &&
    ['analyzing', 'processing', 'completing'].includes(status)
  ) {
    const config = operationConfig[operationType];
    return (
      <SpinningIconLoader
        Icon={config.icon}
        iconColor={config.color}
        {...(className && { className })}
      />
    );
  }

  return (
    <SpinningIconLoader Icon={FolderOpen} {...(className && { className })} />
  );
}

export function TreeOperationOverlay({
  operationState,
  onCancel,
  className,
}: TreeOperationOverlayProps) {
  const { status, operationType, progress, error } = operationState;

  if (status === 'idle') {
    return null;
  }

  const config = operationType ? operationConfig[operationType] : null;
  const canCancel = onCancel && ['analyzing', 'processing'].includes(status);

  return (
    <AnimatePresence mode='wait'>
      {/* Full-screen backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          // Fixed positioning for full-screen coverage
          'fixed inset-0 z-[9999]',
          // Backdrop with blur
          'bg-black/40 backdrop-blur-sm',
          // Flex centering
          'flex items-center justify-center p-4',
          // Prevent interaction with underlying elements
          'overscroll-contain',
          className
        )}
        onClick={e => {
          // Prevent clicks on backdrop from propagating
          e.stopPropagation();
        }}
      >
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{
            duration: 0.2,
            ease: [0.4, 0.0, 0.2, 1], // Custom ease for smooth feel
          }}
          className={cn(
            'relative max-w-lg w-full mx-auto',
            'bg-white rounded-xl shadow-2xl border',
            config?.borderColor || 'border-gray-200',
            'overflow-hidden'
          )}
          onClick={e => {
            // Prevent clicks on modal content from closing modal
            e.stopPropagation();
          }}
        >
          {/* Header Section */}
          <div
            className={cn(
              'px-6 py-6 border-b border-gray-100',
              config?.bgColor || 'bg-gray-50'
            )}
          >
            <div className='flex items-center space-x-4'>
              <StatusIcon
                status={status}
                operationType={operationType}
                className='flex-shrink-0'
              />
              <div className='flex-1 min-w-0'>
                <h3 className='text-xl font-semibold text-gray-900 mb-1'>
                  {status === 'success'
                    ? 'Operation Complete'
                    : status === 'error'
                      ? 'Operation Failed'
                      : config?.title || 'Processing...'}
                </h3>
                <p className='text-sm text-gray-600'>
                  {progress?.stage ||
                    'Please wait while we process your request...'}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className='px-6 py-6 space-y-6'>
            {/* Progress Section */}
            {progress && status !== 'error' && (
              <div className='space-y-3'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='text-gray-600 font-medium'>
                    Progress: {progress.current} of {progress.total} items
                  </span>
                  <span className='text-blue-600 font-semibold'>
                    {Math.round((progress.current / progress.total) * 100)}%
                  </span>
                </div>
                <ProgressBar
                  current={progress.current}
                  total={progress.total}
                />
                {progress.currentItem && (
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <p className='text-xs text-gray-500 mb-1'>
                      Currently processing:
                    </p>
                    <p className='text-sm text-gray-700 font-medium truncate'>
                      {progress.currentItem}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && error && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <div className='flex items-start space-x-2'>
                  <XCircle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
                  <div>
                    <h4 className='text-sm font-medium text-red-800 mb-1'>
                      Error occurred
                    </h4>
                    <p className='text-sm text-red-700'>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className='text-center'>
              {status === 'analyzing' && (
                <div className='bg-blue-50 rounded-lg p-4'>
                  <p className='text-sm text-blue-700'>
                    🔍 Analyzing selected items and checking for nested
                    content...
                  </p>
                </div>
              )}
              {status === 'processing' && (
                <div className='bg-orange-50 rounded-lg p-4'>
                  <p className='text-sm text-orange-700'>
                    ⚡ Processing{' '}
                    {operationType?.includes('move') ? 'moves' : 'deletions'},
                    please do not close this window...
                  </p>
                </div>
              )}
              {status === 'completing' && (
                <div className='bg-green-50 rounded-lg p-4'>
                  <p className='text-sm text-green-700'>
                    ✨ Almost done! Finalizing changes and updating workspace...
                  </p>
                </div>
              )}
              {status === 'success' && (
                <div className='bg-green-50 rounded-lg p-4'>
                  <p className='text-sm text-green-700 font-medium'>
                    ✅ All operations completed successfully!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Section */}
          {(canCancel || status === 'error') && (
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-100'>
              <div className='flex justify-center'>
                {canCancel && (
                  <button
                    onClick={onCancel}
                    className='px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  >
                    Cancel Operation
                  </button>
                )}
                {status === 'error' && onCancel && (
                  <button
                    onClick={onCancel}
                    className='px-6 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 hover:border-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
