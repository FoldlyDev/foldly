'use client';

import React from 'react';
import { Skeleton } from '@/components/feedback/skeleton-loader';
import { Loader2 } from 'lucide-react';

interface UserProfileSkeletonProps {
  showLoadingMessage?: boolean;
  loadingMessage?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const UserProfileSkeleton: React.FC<UserProfileSkeletonProps> = ({
  showLoadingMessage = true,
  loadingMessage = 'Loading user profile...',
  variant = 'default',
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'compact':
        return {
          tabsCount: 3,
          sectionsCount: 2,
          spacing: 'space-y-3',
          cardPadding: 'p-4',
        };
      case 'detailed':
        return {
          tabsCount: 5,
          sectionsCount: 4,
          spacing: 'space-y-6',
          cardPadding: 'p-8',
        };
      default:
        return {
          tabsCount: 4,
          sectionsCount: 3,
          spacing: 'space-y-4',
          cardPadding: 'p-6',
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className='w-full max-w-4xl'>
      <div className='rounded-lg border foldly-glass'>
        <div className={config.cardPadding}>
          {/* Navigation Tabs */}
          <div className='flex gap-2 p-2 rounded-lg foldly-glass mb-6'>
            {[...Array(config.tabsCount)].map((_, i) => (
              <Skeleton
                key={i}
                className={`h-8 ${i === 0 ? 'w-24' : i === 1 ? 'w-20' : 'w-16'} dark:bg-white/10`}
              />
            ))}
          </div>
        </div>

        <div className={`${config.cardPadding} pt-0`}>
          <div className={config.spacing}>
            {/* Profile Header Section */}
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
            {[...Array(config.sectionsCount)].map((_, sectionIndex) => (
              <div key={sectionIndex} className='space-y-4 pt-6 border-t'>
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

                {/* Additional Content for Some Sections */}
                {sectionIndex === 0 && (
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-24 dark:bg-white/10' />
                    <Skeleton className='h-10 w-full rounded-md dark:bg-white/10' />
                  </div>
                )}

                {/* Section Actions */}
                <div className='flex justify-end'>
                  <Skeleton className='h-9 w-20 rounded-md dark:bg-white/10' />
                </div>
              </div>
            ))}

            {/* Security Section (if detailed) */}
            {variant === 'detailed' && (
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
            )}
          </div>
        </div>
      </div>

      {/* Loading Message */}
      {showLoadingMessage && (
        <div className='text-center mt-6'>
          <div className='inline-flex items-center gap-2 text-muted-foreground text-sm'>
            <Loader2 className='w-4 h-4 animate-spin' />
            {loadingMessage}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

export const ClerkUserProfileSkeleton: React.FC<
  Pick<UserProfileSkeletonProps, 'loadingMessage'>
> = ({ loadingMessage = 'Loading Clerk user profile...' }) => (
  <UserProfileSkeleton
    variant='detailed'
    loadingMessage={loadingMessage}
    showLoadingMessage={true}
  />
);

export const QuickUserProfileSkeleton: React.FC = () => (
  <UserProfileSkeleton variant='compact' showLoadingMessage={false} />
);

export const DetailedUserProfileSkeleton: React.FC<
  Pick<UserProfileSkeletonProps, 'loadingMessage'>
> = ({ loadingMessage = 'Loading profile settings...' }) => (
  <UserProfileSkeleton variant='detailed' loadingMessage={loadingMessage} />
);
