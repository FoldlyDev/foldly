'use client';

import { useQuery } from '@tanstack/react-query';
import { TreeContainer, TreeProvider } from '@/components/file-tree';
import { buildWorkspaceTree } from '@/lib/hooks/file-tree/use-tree-utils';
import {
  workspaceQueryKeys,
  fetchWorkspaceTreeAction,
} from '@/features/workspace/lib';
import { ContentLoader } from '@/components/ui';
import { motion } from 'framer-motion';

interface WorkspaceTreeViewProps {
  className?: string;
}

export function WorkspaceTreeView({ className }: WorkspaceTreeViewProps) {
  // Fetch workspace tree data
  const {
    data: workspaceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: workspaceQueryKeys.tree(),
    queryFn: async () => {
      const result = await fetchWorkspaceTreeAction();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch workspace tree');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className={`workspace-tree-loading ${className || ''}`}>
        <ContentLoader />
        <p className='text-sm text-[var(--neutral-500)] mt-4 text-center'>
          Loading your workspace files...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`workspace-tree-error ${className || ''}`}>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-6 h-6 text-red-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-red-800 mb-2'>
            Failed to load workspace
          </h3>
          <p className='text-red-600 text-sm'>
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (!workspaceData) {
    return (
      <div className={`workspace-tree-empty ${className || ''}`}>
        <div className='bg-[var(--neutral-50)] border border-[var(--neutral-200)] rounded-lg p-6 text-center'>
          <p className='text-[var(--neutral-500)]'>
            No workspace data available
          </p>
        </div>
      </div>
    );
  }

  // Build tree data from workspace files and folders
  const treeData = buildWorkspaceTree(
    workspaceData.folders,
    workspaceData.files,
    {
      sortFunction: (a, b) => {
        // Folders first, then files
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        // Then alphabetically
        return a.name.localeCompare(b.name);
      },
      maxDepth: 10,
    }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`workspace-tree-view ${className || ''}`}
    >
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-[var(--quaternary)] mb-2'>
          {workspaceData.workspace.name}
        </h2>
        <p className='text-[var(--neutral-600)] text-sm'>
          {workspaceData.folders.length} folders • {workspaceData.files.length}{' '}
          files
        </p>
      </div>

      <div className='bg-white rounded-lg border border-[var(--neutral-200)] overflow-hidden'>
        <TreeProvider
          contextType='workspace'
          contextId={workspaceData.workspace.id}
        >
          <TreeContainer
            contextType='workspace'
            data={treeData}
            multiSelect={true}
            dragEnabled={true}
            contextMenuEnabled={true}
            className='min-h-[400px]'
          />
        </TreeProvider>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'
      >
        <div className='bg-blue-50 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <div>
              <p className='text-blue-600 text-sm font-medium'>Total Files</p>
              <p className='text-blue-800 text-lg font-bold'>
                {workspaceData.files.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-green-50 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0'
                />
              </svg>
            </div>
            <div>
              <p className='text-green-600 text-sm font-medium'>Folders</p>
              <p className='text-green-800 text-lg font-bold'>
                {workspaceData.folders.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-purple-50 rounded-lg p-4'>
          <div className='flex items-center'>
            <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4'
                />
              </svg>
            </div>
            <div>
              <p className='text-purple-600 text-sm font-medium'>
                Storage Used
              </p>
              <p className='text-purple-800 text-lg font-bold'>
                {Math.round(
                  workspaceData.files.reduce(
                    (total, file) => total + file.fileSize,
                    0
                  ) /
                    1024 /
                    1024
                )}{' '}
                MB
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
