'use client';

import { Skeleton } from '@/components/ui/feedback/skeleton-loader';

export function SettingsSkeleton() {
  return (
    <div className='min-h-screen overflow-hidden'>
      {/* Header Skeleton */}
      <div className='workspace-header'>
        <div className='workspace-header-content'>
          <div className='workspace-header-text'>
            <Skeleton className='h-8 sm:h-10 w-32 mb-2' />
            <Skeleton className='h-5 sm:h-6 w-64' />
          </div>
        </div>
      </div>

      {/* Settings Content - Clerk UserProfile skeleton */}
      <div className='flex items-center justify-center'>
        <div className='w-full max-w-4xl'>
          <div className='rounded-lg border foldly-glass'>
            {/* Navigation Tabs */}
            <div className='p-6'>
              <div className='flex gap-2 p-2 rounded-lg foldly-glass mb-6'>
                <Skeleton className='h-8 w-24 dark:bg-white/10' />
                <Skeleton className='h-8 w-20 dark:bg-white/10' />
                <Skeleton className='h-8 w-16 dark:bg-white/10' />
                <Skeleton className='h-8 w-16 dark:bg-white/10' />
              </div>
            </div>

            {/* Content */}
            <div className='p-6 pt-0 space-y-6'>
              {/* Profile Section */}
              <div className='space-y-4'>
                <Skeleton className='h-6 w-48 dark:bg-white/10' />
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-16 w-16 rounded-full flex-shrink-0' />
                  <div className='space-y-2 flex-1'>
                    <Skeleton className='h-4 w-32 dark:bg-white/10' />
                    <Skeleton className='h-3 w-48 dark:bg-white/10' />
                  </div>
                </div>
              </div>

              {/* Form Sections */}
              {[...Array(3)].map((_, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className='space-y-4 pt-6 border-t'
                >
                  <Skeleton className='h-5 w-40 dark:bg-white/10' />

                  {/* Form Fields */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {[...Array(2)].map((_, fieldIndex) => (
                      <div key={fieldIndex} className='space-y-2'>
                        <Skeleton className='h-4 w-20 dark:bg-white/10' />
                        <Skeleton className='h-10 w-full rounded-md dark:bg-white/10' />
                      </div>
                    ))}
                  </div>

                  {/* Section Actions */}
                  <div className='flex justify-end'>
                    <Skeleton className='h-9 w-20 rounded-md dark:bg-white/10' />
                  </div>
                </div>
              ))}

              {/* Security Section */}
              <div className='space-y-4 pt-6 border-t'>
                <Skeleton className='h-5 w-36 dark:bg-white/10' />
                <div className='space-y-3'>
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <Skeleton className='w-5 h-5 rounded-full' />
                        <div className='space-y-1'>
                          <Skeleton className='h-3 w-24 dark:bg-white/10' />
                          <Skeleton className='h-3 w-32 dark:bg-white/10' />
                        </div>
                      </div>
                      <Skeleton className='h-8 w-16 rounded-md dark:bg-white/10' />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsSkeleton;