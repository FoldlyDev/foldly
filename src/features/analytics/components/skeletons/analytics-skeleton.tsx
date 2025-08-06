'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function AnalyticsSkeleton() {
  return (
    <div className='dashboard-container min-h-screen overflow-hidden'>
      {/* Header */}
      <div className='dashboard-header mb-8'>
        <Skeleton className='h-8 sm:h-10 w-64 sm:w-80 mb-2' />
        <Skeleton className='h-5 sm:h-6 w-48 sm:w-72' />
      </div>

      {/* Stats Grid */}
      <div className='dashboard-grid mb-8'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='dashboard-card'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-12' />
              </div>
              <Skeleton className='h-8 w-16' />
              <Skeleton className='h-3 w-24' />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className='dashboard-grid'>
        {/* Main Chart */}
        <div className='dashboard-card lg:col-span-2'>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-4 w-20' />
            </div>
            <Skeleton className='h-64 w-full rounded-lg' />
          </div>
        </div>

        {/* Side Chart */}
        <div className='dashboard-card lg:col-span-2'>
          <div className='space-y-4'>
            <Skeleton className='h-6 w-28' />
            <div className='space-y-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-3 w-3 rounded-full' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <Skeleton className='h-4 w-8' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
