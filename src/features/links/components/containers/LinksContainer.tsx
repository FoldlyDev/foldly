'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { EmptyLinksState, PopulatedLinksState } from '@/features/links';
import { LinksSkeleton } from '../skeletons/links-skeleton';
import { LinksModalManager } from '../managers/LinksModalManager';
import { useFilteredLinksQuery } from '../../hooks/react-query/use-links-query';
import { useUIStore } from '../../store/ui-store';
import { useLinksQuery } from '../../hooks/react-query/use-links-query';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { useRealtimeLinkUpdates } from '../../hooks/use-realtime-link-updates';

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
  // Get UI state from store
  const searchQuery = useUIStore(state => state.searchQuery);
  const filterType = useUIStore(state => state.filterType);
  const filterStatus = useUIStore(state => state.filterStatus);
  const sortBy = useUIStore(state => state.sortBy);
  const sortDirection = useUIStore(state => state.sortDirection);
  
  // Initialize real-time link updates (for file changes)
  useRealtimeLinkUpdates();
  
  // Fetch and sync initial unread counts when component mounts
  useEffect(() => {
    // Use the store's refreshUnreadCounts which includes syncing
    useNotificationStore.getState().refreshUnreadCounts();
  }, []);

  // Get all links first (unfiltered) to determine if user has any links
  const {
    data: allLinks,
    isLoading: allLinksLoading,
    isError: allLinksError,
    error: allLinksQueryError,
    refetch: refetchAllLinks,
  } = useLinksQuery();

  // Get filtered links for display
  const {
    data: filteredLinks,
    isLoading: filteredLoading,
    isError: filteredError,
    error: filteredQueryError,
    refetch: refetchFiltered,
    isFetching,
  } = useFilteredLinksQuery({
    searchQuery,
    filterType,
    filterStatus,
    sortBy,
    sortDirection,
  });

  // Use prop loading/error state if provided, otherwise use query state
  // Only show loading if we don't have any data and are actually loading
  const isComponentLoading =
    propLoading ||
    (allLinksLoading && allLinks.length === 0) ||
    (filteredLoading && filteredLinks.length === 0);
  const componentError =
    propError ||
    (allLinksError ? allLinksQueryError?.message : null) ||
    (filteredError ? filteredQueryError?.message : null);

  // Check if user has any links at all (before filtering)
  const hasNoLinksAtAll = allLinks.length === 0;

  if (isComponentLoading) {
    return <LinksSkeleton />;
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
                refetchAllLinks();
                refetchFiltered();
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

  // Remove debug logging in production
  // console.log(
  //   '📊 LinksContainer: Rendering with',
  //   allLinks.length,
  //   'total links,',
  //   filteredLinks.length,
  //   'filtered links'
  // );

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='home-container w-full mx-auto'>
        <div className='space-y-8'>
          {/* Only show empty state if user has no links at all */}
          {hasNoLinksAtAll ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <EmptyLinksState
                onRefreshDashboard={() => {
                  // NO page reload - just refresh data with React Query
                  refetchAllLinks();
                  refetchFiltered();
                }}
              />
            </motion.div>
          ) : (
            <PopulatedLinksState links={filteredLinks} />
          )}
        </div>

        {/* Centralized Modal Management - All modals managed by store */}
        <LinksModalManager />
      </div>
    </div>
  );
}
