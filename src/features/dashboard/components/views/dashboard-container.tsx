'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { DashboardHeader } from '../sections/dashboard-header';
import { AnalyticsCards } from '../sections/analytics-cards';
import { QuickActions } from '../sections/quick-actions';
import { EmptyState } from './empty-state';
import { ContentLoader } from '@/components/ui';
import type { DashboardOverview } from '@/types';

interface HomeContainerProps {
  readonly data?: DashboardOverview & {
    readonly storageUsed: string; // UI-friendly formatted storage
    readonly totalViews: number;
    readonly avgFilesPerLink: number;
    readonly recentUploads: number;
  };
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function HomeContainer({
  data,
  isLoading = false,
  error = null,
}: HomeContainerProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  const mockData: HomeContainerProps['data'] = {
    totalLinks: 0,
    totalFiles: 0,
    totalSize: 0,
    activeLinks: 0,
    totalUploads: 0,
    recentActivity: [],
    topLinks: [],
    storageUsed: '0 MB',
    totalViews: 0,
    avgFilesPerLink: 0,
    recentUploads: 0,
  };

  const dashboardData = data || mockData;
  const hasData = dashboardData.totalLinks > 0 || dashboardData.totalFiles > 0;

  useEffect(() => {
    if (isLoaded && !isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isLoading]);

  // Core action handlers aligned with Foldly's workflow
  const handleCreateBaseLink = () => {
    router.push('/dashboard/links?action=create&type=base');
  };

  const handleCreateCustomLink = () => {
    router.push('/dashboard/links?action=create&type=custom');
  };

  const handleViewLinks = () => {
    router.push('/dashboard/links');
  };

  const handleManageFiles = () => {
    router.push('/dashboard/files');
  };

  const handleViewAnalytics = () => {
    router.push('/dashboard/analytics');
  };

  if (!isLoaded || isLoading) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <div
          className='home-container w-full mx-auto'
          style={{
            maxWidth: 'var(--container-max-width, 2000px)',
            padding: 'var(--content-spacing) var(--container-padding)',
          }}
        >
          <div className='loading-container'>
            <ContentLoader />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)] flex items-center justify-center'>
        <div className='error-container'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='analytics-card w-full max-w-md mx-auto text-center'
          >
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-6 h-6 sm:w-8 sm:h-8 text-red-500'
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
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Something went wrong
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='w-full sm:w-auto px-6 py-2.5 bg-[var(--primary)] text-[var(--quaternary)] rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base'
            >
              Try Again
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      {/* Container with responsive padding following design system */}
      <div
        className='home-container w-full mx-auto'
        style={{
          maxWidth: 'var(--container-max-width, 2000px)',
          padding: 'var(--content-spacing) var(--container-padding)',
        }}
      >
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--content-spacing)',
              }}
            >
              {/* Header Section - Keep existing greeting, notifications, icons */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <DashboardHeader
                  totalLinks={dashboardData.totalLinks}
                  totalFiles={dashboardData.totalFiles}
                />
              </motion.div>

              {hasData ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className='space-y-6 lg:space-y-8'
                >
                  {/* Analytics Cards - Keep existing styling but with Foldly-specific metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.6 }}
                  >
                    <AnalyticsCards data={dashboardData} />
                  </motion.div>

                  {/* Redesigned Action Center - Focus on Foldly's Multi-Link Value Prop */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    <QuickActions
                      onCreateLink={handleCreateBaseLink}
                      onManageFiles={handleManageFiles}
                      onViewLinks={handleViewLinks}
                      onShareLink={handleViewAnalytics}
                    />
                  </motion.div>

                  {/* Activity Overview - Replace redundant content with actionable insights */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className='recent-items-grid'
                  >
                    {/* Recent File Collections - Most Important for Users */}
                    <div className='analytics-card'>
                      <div
                        className='flex items-center justify-between'
                        style={{ marginBottom: 'var(--content-spacing)' }}
                      >
                        <h3 className='card-title truncate'>
                          Recent File Collections
                        </h3>
                        <div className='card-icon bg-blue-50 rounded-lg flex items-center justify-center'>
                          <svg
                            className='w-1/2 h-1/2 text-blue-600'
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
                      </div>
                      <div className='space-y-3'>
                        <div className='text-center py-8 text-[var(--neutral-500)]'>
                          <p className='text-sm'>
                            Your recent file uploads will appear here once
                            people start using your links
                          </p>
                          <button
                            onClick={handleManageFiles}
                            className='mt-3 text-[var(--primary)] hover:text-[var(--primary-dark)] text-sm font-medium'
                          >
                            View all files →
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Link Performance - Key Business Metrics */}
                    <div className='analytics-card'>
                      <div
                        className='flex items-center justify-between'
                        style={{ marginBottom: 'var(--content-spacing)' }}
                      >
                        <h3 className='card-title truncate'>
                          Link Performance
                        </h3>
                        <div className='card-icon bg-green-50 rounded-lg flex items-center justify-center'>
                          <svg
                            className='w-1/2 h-1/2 text-green-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
                            />
                          </svg>
                        </div>
                      </div>
                      <div className='space-y-3'>
                        <div className='text-center py-8 text-[var(--neutral-500)]'>
                          <p className='text-sm'>
                            Create your first upload link to start tracking
                            performance
                          </p>
                          <button
                            onClick={handleViewLinks}
                            className='mt-3 text-[var(--primary)] hover:text-[var(--primary-dark)] text-sm font-medium'
                          >
                            Manage links →
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <EmptyState
                    type='dashboard'
                    onCreateLink={handleCreateBaseLink}
                    onLearnMore={() => router.push('/dashboard/links')}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Maintain backward compatibility
export const DashboardContainer = HomeContainer;
