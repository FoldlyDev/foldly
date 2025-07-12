'use client';

import { motion } from 'framer-motion';
import { EmptyLinksState, PopulatedLinksState } from '@/features/links';
import { ContentLoader } from '@/components/ui';
import { LinksModalManager } from '../managers/LinksModalManager';
import { useFilteredLinksQuery } from '../../hooks/react-query/use-links-query';
import { useUIStore } from '../../store/ui-store';

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

  // Use React Query for data fetching with client-side filtering
  const {
    data: links,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFilteredLinksQuery({
    searchQuery,
    filterType,
    filterStatus,
    sortBy,
    sortDirection,
  });

  // Use prop loading/error state if provided, otherwise use query state
  const isComponentLoading = propLoading || isLoading;
  const componentError = propError || (isError ? error?.message : null);
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
                refetch();
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
                  console.log(
                    '🔄 LinksContainer: Refreshing data (NO PAGE RELOAD)'
                  );
                  // NO page reload - just refresh data with React Query
                  refetch();
                }}
              />
            </motion.div>
          ) : (
            <PopulatedLinksState links={links} isLoading={isLoading} />
          )}
        </div>

        {/* Centralized Modal Management - All modals managed by store */}
        <LinksModalManager />
      </div>
    </div>
  );
}
