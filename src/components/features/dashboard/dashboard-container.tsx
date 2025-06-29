'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

import { DashboardHeader } from './dashboard-header';
import { AnalyticsCards } from './analytics-cards';
import { QuickActions } from './quick-actions';
import { EmptyState } from './empty-state';
import { ContentLoader } from '@/components/ui';

interface DashboardData {
  totalLinks: number;
  totalFiles: number;
  storageUsed: string;
  activeLinks: number;
  totalViews: number;
  avgFilesPerLink: number;
  recentUploads: number;
}

interface DashboardContainerProps {
  data?: DashboardData;
  isLoading?: boolean;
  error?: string | null;
}

export function DashboardContainer({
  data,
  isLoading = false,
  error = null,
}: DashboardContainerProps) {
  const { user, isLoaded } = useUser();
  const [showContent, setShowContent] = useState(false);

  const mockData: DashboardData = {
    totalLinks: 0,
    totalFiles: 0,
    storageUsed: '0 MB',
    activeLinks: 0,
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

  const handleCreateLink = () => {
    console.log('Create link clicked');
  };

  const handleManageFiles = () => {
    console.log('Manage files clicked');
  };

  const handleViewLinks = () => {
    console.log('View links clicked');
  };

  const handleShareLink = () => {
    console.log('Share link clicked');
  };

  const handleLearnMore = () => {
    console.log('Learn more clicked');
  };

  if (!isLoaded || isLoading) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <ContentLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)] flex items-center justify-center'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-[var(--neutral-200)] shadow-sm'
        >
          <div className='w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-red-500'
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
          <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-2'>
            Something went wrong
          </h2>
          <p className='text-[var(--neutral-600)] mb-4'>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-[var(--primary)] text-[var(--quaternary)] rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors'
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <DashboardHeader
                totalLinks={dashboardData.totalLinks}
                totalFiles={dashboardData.totalFiles}
              />

              {hasData ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <AnalyticsCards data={dashboardData} />

                  <QuickActions
                    onCreateLink={handleCreateLink}
                    onManageFiles={handleManageFiles}
                    onViewLinks={handleViewLinks}
                    onShareLink={handleShareLink}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className='grid grid-cols-1 lg:grid-cols-2 gap-6'
                  >
                    <div className='bg-white rounded-2xl border border-[var(--neutral-200)] p-6 shadow-sm'>
                      <h3 className='text-lg font-semibold text-[var(--quaternary)] mb-4'>
                        Recent Upload Links
                      </h3>
                      <div className='text-center py-8'>
                        <p className='text-[var(--neutral-500)]'>
                          Your recent upload links will appear here
                        </p>
                      </div>
                    </div>

                    <div className='bg-white rounded-2xl border border-[var(--neutral-200)] p-6 shadow-sm'>
                      <h3 className='text-lg font-semibold text-[var(--quaternary)] mb-4'>
                        Recent Files
                      </h3>
                      <div className='text-center py-8'>
                        <p className='text-[var(--neutral-500)]'>
                          Recently uploaded files will appear here
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.7 }}
                >
                  <EmptyState
                    type='dashboard'
                    onCreateLink={handleCreateLink}
                    onLearnMore={handleLearnMore}
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
