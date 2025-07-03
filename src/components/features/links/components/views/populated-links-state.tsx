'use client';

import { motion } from 'framer-motion';
import { Plus, Filter, SlidersHorizontal } from 'lucide-react';
import { LinkCard } from '../cards/link-card';
import { EmptyLinksState } from './empty-links-state';
import { LinksOverviewCards } from '../cards/links-overview-cards';
import {
  useLinksListStore,
  useLinksModalsStore,
} from '../../hooks/use-links-composite';
import { ActionButton } from '@/components/ui/action-button';
import { SearchInput } from '@/components/ui/search-input';
import { ViewToggle } from '@/components/ui/view-toggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { toast } from 'sonner';

// No props needed - all state comes from stores!
export function PopulatedLinksState() {
  // Get all state and actions from stores
  const {
    links,
    isLoading,
    stats,
    viewMode,
    searchQuery,
    filters,
    selection,
    // Actions
    setViewMode,
    setSearchQuery,
    setStatusFilter,
    toggleMultiSelectMode,
    openCreateLinkModal,
    removeLink,
  } = useLinksListStore();

  const {
    activeModal,
    modalData,
    openLinkDetailsModal,
    openShareLinkModal,
    openLinkSettingsModal,
    closeModal,
  } = useLinksModalsStore();

  // Map stats to match LinksOverviewCards expected format
  const overviewData = {
    totalLinks: stats.total,
    activeLinks: stats.active,
    totalUploads: stats.totalUploads,
    totalViews: stats.totalViews,
  };

  // Handle link deletion with proper feedback
  const handleDelete = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (!link) return;

    if (link.linkType === 'base') {
      toast.error('Base links cannot be deleted');
      return;
    }

    try {
      removeLink(linkId);
      toast.success(`${link.name} deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  // Handle templates click (placeholder for now)
  const handleTemplatesClick = () => {
    toast.info('Templates functionality coming soon');
  };

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <LinksOverviewCards data={overviewData} />

      {/* Header with Search and Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-semibold text-[var(--quaternary)]'>
            Your Links ({links.length})
          </h2>

          {/* Filter Badge */}
          {filters.status !== 'all' && (
            <div className='px-2 py-1 bg-[var(--primary-subtle)] text-[var(--tertiary)] rounded-md text-sm font-medium'>
              {filters.status === 'active' && 'Active'}
              {filters.status === 'paused' && 'Paused'}
              {filters.status === 'expired' && 'Expired'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <ActionButton
            variant='outline'
            size='sm'
            onClick={handleTemplatesClick}
            className='text-[var(--neutral-600)] border-[var(--neutral-200)]'
          >
            <SlidersHorizontal className='w-4 h-4' />
            Templates
          </ActionButton>

          <ActionButton
            variant='default'
            size='sm'
            onClick={() => {
              console.log('🔥 POPULATED STATE: Create Link button clicked');
              openCreateLinkModal('topic');
              console.log(
                '🔥 POPULATED STATE: openCreateLinkModal("topic") called'
              );
            }}
            className='bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--quaternary)]'
          >
            <Plus className='w-4 h-4' />
            Create Link
          </ActionButton>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className='flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1'>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder='Search links...'
            className='w-full'
          />
        </div>

        {/* Filters */}
        <div className='flex items-center gap-3'>
          {/* Status Filter */}
          <div className='min-w-[140px]'>
            <Select value={filters.status} onValueChange={setStatusFilter}>
              <SelectTrigger size='sm' className='border-[var(--neutral-200)]'>
                <Filter className='w-4 h-4 mr-2 text-[var(--neutral-500)]' />
                <SelectValue placeholder='Filter' />
              </SelectTrigger>
              <SelectContent className='bg-white border-[var(--neutral-200)]'>
                <SelectItem value='all'>All Links</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='paused'>Paused</SelectItem>
                <SelectItem value='expired'>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            className='border-[var(--neutral-200)]'
          />
        </div>
      </div>

      {/* Multi-select Actions */}
      {selection.isMultiSelectMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between p-4 bg-[var(--primary-subtle)] border border-[var(--primary)] rounded-lg'
        >
          <span className='text-sm font-medium text-[var(--tertiary)]'>
            {selection.selectedCount} link
            {selection.selectedCount > 1 ? 's' : ''} selected
          </span>
          <div className='flex items-center gap-2'>
            <ActionButton
              variant='outline'
              size='sm'
              onClick={() => {
                // Handle bulk delete
                toast.info('Bulk delete functionality coming soon');
              }}
              className='text-[var(--neutral-600)] border-[var(--neutral-200)]'
            >
              Delete Selected
            </ActionButton>
          </div>
        </motion.div>
      )}

      {/* Links Grid/List */}
      {isLoading ? (
        <div className='flex justify-center items-center h-32'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        </div>
      ) : links.length === 0 ? (
        // Show "No results" message instead of EmptyLinksState when search/filter is active
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
            <Filter className='w-8 h-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            No links found
          </h3>
          <p className='text-gray-500 mb-4 max-w-sm'>
            {searchQuery.trim()
              ? `No links match "${searchQuery}". Try adjusting your search.`
              : filters.status !== 'all'
                ? `No ${filters.status} links found. Try changing your filters.`
                : 'No links match your current filters.'}
          </p>
          <ActionButton
            variant='outline'
            size='sm'
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className='text-gray-600 border-gray-200'
          >
            Clear filters
          </ActionButton>
        </div>
      ) : (
        <motion.div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {links.map((link, index) => (
            <LinkCard
              key={link.id}
              linkId={link.id as any}
              view={viewMode}
              index={index}
              searchQuery={searchQuery}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
