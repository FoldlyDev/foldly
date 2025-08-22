'use client';

import { Skeleton } from '@/components/feedback/skeleton-loader';

export function BillingSkeleton() {
  return (
    <div className='min-h-screen overflow-hidden'>
      {/* Header Skeleton */}
      <div className='dashboard-header mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <Skeleton className='h-8 sm:h-10 w-64 sm:w-80 mb-2' />
            <Skeleton className='h-5 sm:h-6 w-48 sm:w-72' />
          </div>
        </div>
      </div>

      {/* Pricing Section Skeleton */}
      <div className='space-y-6'>
        {/* Description Skeleton */}
        <div className='space-y-2'>
          <Skeleton className='h-6 w-48 dark:bg-white/10' />
          <Skeleton className='h-4 w-80 max-w-full dark:bg-white/10' />
        </div>

        {/* Pricing Cards Grid - 3 subscription plan cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='rounded-lg border foldly-glass p-6'>
              {/* Plan Header */}
              <div className='text-center space-y-2 mb-6'>
                <Skeleton className='h-6 w-24 mx-auto dark:bg-white/10' />
                <Skeleton className='h-4 w-32 mx-auto dark:bg-white/10' />
              </div>

              {/* Price Section */}
              <div className='text-center space-y-1 mb-6'>
                <Skeleton className='h-10 w-20 mx-auto dark:bg-white/10' />
                <Skeleton className='h-3 w-16 mx-auto dark:bg-white/10' />
              </div>

              {/* Features List */}
              <div className='space-y-3 py-4 mb-6'>
                {[...Array(5)].map((_, j) => (
                  <div key={j} className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-4 rounded-full flex-shrink-0' />
                    <Skeleton className='h-4 flex-1 dark:bg-white/10' />
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <Skeleton className='h-10 w-full rounded-md dark:bg-white/10' />
            </div>
          ))}
        </div>

        {/* Current Plan Section (if user has a subscription) */}
        <div className='mt-12 max-w-4xl mx-auto'>
          <div className='rounded-lg border foldly-glass p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <Skeleton className='h-5 w-32 mb-2 dark:bg-white/10' />
                <Skeleton className='h-4 w-48 dark:bg-white/10' />
              </div>
              <Skeleton className='h-8 w-24 rounded-md dark:bg-white/10' />
            </div>

            {/* Usage Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6'>
              {[...Array(3)].map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-4 w-24 dark:bg-white/10' />
                  <Skeleton className='h-6 w-32 dark:bg-white/10' />
                  <Skeleton className='h-2 w-full rounded-full' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingSkeleton;
