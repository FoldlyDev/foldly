'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EmptyLinksState, PopulatedLinksState } from '@/features/links';
import { ContentLoader } from '@/components/ui';
import { useLinksStore, useLinksActions } from '../../store/links-store';
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
  // Get state and actions from the correct store
  const links = useLinksStore(state => state.links);
  const isLoading = useLinksStore(state => state.isLoading);
  const error = useLinksStore(state => state.error);
  const { fetchLinks } = useLinksActions();

  // Fetch links from database on mount
  useEffect(() => {
    const loadLinks = async () => {
      console.log('🚀 LinksContainer: Fetching links from database...');
      await fetchLinks();
    };

    // Only fetch if we don't have links loaded and aren't already loading
    if (links.length === 0 && !isLoading) {
      loadLinks();
    }
  }, []); // Empty dependency array to run only on mount

  // Use prop loading/error state if provided, otherwise use store state
  const isComponentLoading = propLoading || isLoading;
  const componentError = propError || error;
  const isEmpty = links.length === 0;

  if (isComponentLoading) {
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

  if (componentError) {
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
              {componentError}
            </p>
            <button
              onClick={() => {
                console.log('🔄 LinksContainer: Retrying fetch...');
                fetchLinks();
              }}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  console.log('📊 LinksContainer: Rendering with', links.length, 'links');

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
                onRefreshDashboard={() => {
                  console.log('🔄 LinksContainer: Refreshing dashboard...');
                  fetchLinks();
                }}
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
