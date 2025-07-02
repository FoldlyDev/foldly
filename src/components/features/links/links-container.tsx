'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  EmptyLinksState,
  PopulatedLinksState,
  CreateLinkModal,
} from '@/components/features/links';
import { ContentLoader } from '@/components/ui';
import { useLinksState } from './use-links-state';

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
  // Use the custom links state hook
  const {
    links,
    isLoading: storeLoading,
    error: storeError,
    searchQuery,
    filter,
    viewMode,
    isCreateModalOpen,
    filteredLinks,
    hasBaseLink,
    isEmpty,
    linkStats,
    selectedLinkIds,
    // Actions
    fetchLinks,
    publishCreatedLinks,
    setSearchQuery,
    setFilter,
    setViewMode,
    openCreateModal,
    closeCreateModal,
    toggleLinkSelection,
    clearSelection,
    removeLink,
  } = useLinksState();

  // Initialize store data on mount
  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Use prop loading/error state if provided, otherwise use store state
  const isLoading = propLoading || storeLoading;
  const error = propError || storeError;

  // No additional computed values needed - PopulatedLinksView handles everything

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
              <EmptyLinksState onRefreshDashboard={publishCreatedLinks} />
            </motion.div>
          ) : (
            <PopulatedLinksState
              links={links}
              filteredLinks={filteredLinks}
              hasBaseLink={hasBaseLink}
              baseLink={
                hasBaseLink ? links.find(link => !link.topic) : undefined
              }
              topicLinks={links.filter(link => link.topic)}
              linkStats={linkStats}
              searchQuery={searchQuery}
              filter={filter}
              viewMode={viewMode}
              onSearchChange={setSearchQuery}
              onFilterChange={setFilter}
              onViewModeChange={setViewMode}
              onCreateLink={openCreateModal}
              onTemplatesClick={() => console.log('Templates clicked')}
              onLinkClick={linkId => console.log('Link clicked:', linkId)}
              onDeleteLink={linkId => removeLink(linkId as any)}
              isMultiSelectMode={selectedLinkIds.length > 0}
              selectedLinks={selectedLinkIds as unknown as string[]}
              onMultiSelect={linkId => toggleLinkSelection(linkId as any)}
              onMultiSelectModeToggle={clearSelection}
            />
          )}
        </div>

        {/* Create Link Modal */}
        <CreateLinkModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          onSuccess={() => {
            closeCreateModal();
            console.log('Link created successfully!');
          }}
        />
      </div>
    </div>
  );
}
