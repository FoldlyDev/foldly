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
import { FadeTransitionWrapper } from '@/components/ui/feedback';
import { TertiaryCTAButton } from '@/components/ui/core';

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

  if (componentError && !isComponentLoading) {
    return (
      <div className='dashboard-container min-h-screen flex items-center justify-center !bg-transparent'>
        <div className='error-container'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='analytics-card w-full max-w-md mx-auto text-center !bg-transparent'
          >
            <h2>
              Links Unavailable
            </h2>
            <p>
              {componentError}
            </p>
            <TertiaryCTAButton
              onClick={() => {
                refetchAllLinks();
                refetchFiltered();
              }}
              className='cta'
            >
              Retry
            </TertiaryCTAButton>
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
    <FadeTransitionWrapper
      isLoading={isComponentLoading}
      loadingComponent={<LinksSkeleton />}
      duration={300}
      className='min-h-screen'
    >
      <div className='dashboard-container min-h-screen !bg-transparent'>
        <div className='w-full mx-auto'>
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
    </FadeTransitionWrapper>
  );
}
