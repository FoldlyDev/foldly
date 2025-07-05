'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EmptyLinksState, PopulatedLinksState } from '@/features/links';
import { ContentLoader } from '@/components/ui';
import { useLinksListStore } from '../../hooks/use-links-composite';
import { LinksModalManager } from '../managers/LinksModalManager';

interface LinksContainerProps {
  readonly initialData?: {
    readonly linkStats: {
      readonly totalLinks: number;
      readonly activeLinks: number;
      readonly totalUploads: number;
      readonly totalViews: number;
    };
  };
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function LinksContainer({
  initialData,
  isLoading: propLoading = false,
  error: propError = null,
}: LinksContainerProps) {
  // Get state from stores
  const {
    links,
    originalLinks,
    isLoading: storeLoading,
    error: storeError,
    setLinks,
  } = useLinksListStore();

  // Initialize store data on mount if we have initial data
  useEffect(() => {
    if (initialData?.linkStats && originalLinks.length === 0) {
      // If we have initial data but no links in store, we could initialize here
      // For now, we'll let the components handle their own data fetching
    }
  }, [initialData, originalLinks.length, setLinks]);

  // Use prop loading/error state if provided, otherwise use store state
  const isLoading = propLoading || storeLoading;
  const error = propError || storeError;
  const isEmpty = originalLinks.length === 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <div className='home-container w-full mx-auto'>
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
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Links Unavailable
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='home-container w-full mx-auto'>
        <div className='space-y-8'>
          {/* Conditional rendering: Empty vs Populated state */}
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <EmptyLinksState
                onRefreshDashboard={() => window.location.reload()}
              />
            </motion.div>
          ) : (
            <PopulatedLinksState />
          )}
        </div>

        {/* Centralized Modal Management - All modals managed by store */}
        <LinksModalManager />
      </div>
    </div>
  );
}
