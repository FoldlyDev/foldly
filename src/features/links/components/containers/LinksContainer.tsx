'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { EmptyLinksState, PopulatedLinksState } from '@/features/links';
import { ContentLoader } from '@/components/ui';
import { LinksModalManager } from '../managers/LinksModalManager';
import type { Link } from '@/lib/supabase/types';

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
  // Local state for links data
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load links function - PURE STATE UPDATE, NO PAGE REFRESH
  const loadLinks = async () => {
    try {
      console.log('🚀 LinksContainer: PURE STATE UPDATE - Fetching links...');
      setIsLoading(true);

      const response = await fetch('/api/links', {
        cache: 'no-cache', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }

      const linksData = await response.json();

      // CRITICAL: Pure state update - this triggers empty → populated transition
      setLinks(linksData);
      setError(null);

      console.log(
        '✅ LinksContainer: STATE UPDATED - Links count:',
        linksData.length,
        '(NO PAGE REFRESH)'
      );
    } catch (err) {
      console.error('❌ LinksContainer: Error loading links:', err);
      setError(err instanceof Error ? err.message : 'Failed to load links');
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh function globally for proper state management
  // Following 2025 React best practices for immediate UI updates after mutations
  useEffect(() => {
    // Store refresh function globally so modals can trigger immediate data refresh
    (window as any).refreshLinksData = loadLinks;

    // Cleanup on unmount
    return () => {
      delete (window as any).refreshLinksData;
    };
  }, [loadLinks]);

  // Fetch links from API on mount
  useEffect(() => {
    loadLinks();
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
                setIsLoading(true);
                loadLinks();
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
                  // NO page reload - just refresh data
                  loadLinks();
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
