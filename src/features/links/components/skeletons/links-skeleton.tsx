'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function LinksSkeleton() {
  return (
    <div className='dashboard-container'>
      {/* Header */}
      <div className='dashboard-header mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <Skeleton className='h-8 sm:h-10 w-64 sm:w-80 mb-2' />
            <Skeleton className='h-5 sm:h-6 w-48 sm:w-72' />
          </div>
          <Skeleton className='h-10 w-32 rounded-xl' />
        </div>
      </div>

      {/* Overview Cards */}
      <div className='dashboard-grid mb-8'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='dashboard-card'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-5' />
                <Skeleton className='h-4 w-12' />
              </div>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-3 w-28' />
            </div>
          </div>
        ))}
      </div>

      {/* Filters/Search */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <Skeleton className='h-10 flex-1 max-w-sm rounded-md' />
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-24 rounded-md' />
          <Skeleton className='h-10 w-20 rounded-md' />
        </div>
      </div>

      {/* Links Grid */}
      <div className='dashboard-grid'>
        {[...Array(6)].map((_, i) => (
          <div key={i} className='dashboard-card'>
            <div className='space-y-4'>
              {/* Link Header */}
              <div className='flex items-start justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-3 w-48' />
                </div>
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>

              {/* Link Stats */}
              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-8' />
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-12' />
                </div>
              </div>

              {/* Link Actions */}
              <div className='flex items-center justify-between pt-2 border-t'>
                <Skeleton className='h-6 w-16 rounded-full' />
                <div className='flex gap-2'>
                  <Skeleton className='h-8 w-8 rounded-md' />
                  <Skeleton className='h-8 w-8 rounded-md' />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
