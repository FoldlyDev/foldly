'use client';

import { Skeleton } from '@/components/feedback/skeleton-loader';

export function WorkspaceHeaderSkeleton() {
  return (
    <div className='workspace-header-content'>
      <div className='workspace-header-text'>
        <Skeleton className='h-8 sm:h-10 w-64 sm:w-80 mb-2' />
        <Skeleton className='h-5 sm:h-6 w-48 sm:w-72' />
      </div>
      <div className='workspace-header-actions'>
        <Skeleton className='h-10 w-10 rounded-xl' />
        <Skeleton className='h-10 w-10 rounded-xl hidden sm:block' />
        <Skeleton className='h-10 w-32 sm:w-40 rounded-xl' />
        <Skeleton className='h-10 w-10 rounded-xl sm:hidden' />
      </div>
    </div>
  );
}

export function WorkspaceToolbarSkeleton() {
  return (
    <div className='workspace-toolbar'>
      <div className='workspace-toolbar-main'>
        <div className='workspace-toolbar-left'>
          <Skeleton className='h-8 w-28 rounded-md dark:bg-white/10' />
        </div>
        <div className='workspace-toolbar-right'>
          <div className='workspace-search-container'>
            <Skeleton className='h-8 w-full rounded-md dark:bg-white/10' />
          </div>
          <Skeleton className='h-8 w-8 rounded-md dark:bg-white/10' />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceTreeSkeleton() {
  return (
    <div className='workspace-tree-container'>
      <div className='workspace-tree-wrapper'>
        <div
          className='workspace-tree-content'
          style={{ overflow: 'hidden', height: 'auto' }}
        >
          {/* Root folders skeleton - reduced items to prevent overflow */}
          <div className='space-y-1'>
            {[...Array(2)].map((_, i) => (
              <div key={i} className='flex items-center gap-2 p-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 flex-1 max-w-40 dark:bg-white/10' />
              </div>
            ))}

            {/* Nested items */}
            <div className='ml-6 space-y-1'>
              {[...Array(1)].map((_, i) => (
                <div key={i} className='flex items-center gap-2 p-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 flex-1 max-w-32 dark:bg-white/10' />
                </div>
              ))}
            </div>

            {/* More root items */}
            {[...Array(1)].map((_, i) => (
              <div key={i + 2} className='flex items-center gap-2 p-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 flex-1 max-w-36 dark:bg-white/10' />
              </div>
            ))}
          </div>
        </div>

        <div className='workspace-tree-footer'>
          <Skeleton className='h-3 w-48 mx-auto dark:bg-white/10' />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className='dashboard-container workspace-layout h-screen overflow-hidden'>
      <div className='workspace-header'>
        <WorkspaceHeaderSkeleton />
      </div>

      <WorkspaceToolbarSkeleton />

      <WorkspaceTreeSkeleton />
    </div>
  );
}
