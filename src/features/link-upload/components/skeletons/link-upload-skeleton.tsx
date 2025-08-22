'use client';

import { Skeleton } from '@/components/ui/shadcn/skeleton';

export function LinkUploadSkeleton() {
  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-muted/20 overflow-hidden'>
      {/* Header skeleton */}
      <div className='border-b bg-gradient-to-r from-background to-muted/30 sticky top-0 z-40'>
        <div className='container mx-auto px-4 py-6 max-w-7xl'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-12 w-12 rounded-xl' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-6 w-64' />
              <div className='flex items-center gap-4'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-36' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        {/* Toolbar skeleton */}
        <div className='mb-6'>
          <div className='bg-card border rounded-lg p-4 shadow-sm'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-9 w-24' />
                <Skeleton className='h-9 w-28' />
              </div>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-9 w-64' />
                <Skeleton className='h-9 w-9' />
              </div>
            </div>
          </div>
        </div>

        {/* Tree skeleton */}
        <div className='space-y-2'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className='flex items-center gap-2 py-2'>
              <Skeleton className='h-4 w-4 rounded dark:bg-white/10' />
              <Skeleton className='h-4 w-4 rounded dark:bg-white/10' />
              <Skeleton
                className={`h-4 ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-48' : 'w-24'}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
