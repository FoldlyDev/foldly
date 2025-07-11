'use client';

import { motion } from 'framer-motion';
import { Plus, Filter, SlidersHorizontal } from 'lucide-react';
import { LinkCard } from '../cards/LinkCard';
import { EmptyLinksState } from './EmptyLinksState';
import { LinksOverviewCards } from '../cards/LinksOverviewCards';
import {
  useLinksStore,
  useLinksActions,
  useLinksUIState,
  useLinksSelection,
  useFilteredLinks,
} from '../../store/links-store';
import { useLinksModalsStore } from '../../hooks/use-links-composite';
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
  // Get all state and actions from the correct stores
  const links = useLinksStore(state => state.links);
  const isLoading = useLinksStore(state => state.isLoading);
  const totalCount = useLinksStore(state => state.totalCount);

  // Use filtered links for display
  const filteredLinks = useFilteredLinks();

  // Get UI state
  const { searchQuery, filter, viewMode } = useLinksUIState();
  const { selectedLinkIds, hasSelection, selectionCount } = useLinksSelection();

  // Get actions
  const {
    setSearchQuery,
    setFilter,
    setViewMode,
    deleteLink,
    openCreateModal,
    toggleLinkSelection,
    clearSelection,
  } = useLinksActions();

  const {
    activeModal,
    modalData,
    openLinkDetailsModal,
    openShareLinkModal,
    openLinkSettingsModal,
    closeModal,
  } = useLinksModalsStore();

  // Calculate stats from actual links
  const stats = {
    total: totalCount,
    active: links.filter(link => link.isActive && !link.expiresAt).length,
    totalUploads: links.reduce(
      (sum, link) => sum + (link.totalUploads || 0),
      0
    ),
    totalViews: 0, // This would need to be calculated from database
  };

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
      const result = await deleteLink(linkId);
      if (result.success) {
        toast.success(`${link.title} deleted successfully`);
      } else {
        toast.error(result.error || 'Failed to delete link');
      }
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  // Handle templates click (placeholder for now)
  const handleTemplatesClick = () => {
    toast.info('Templates functionality coming soon');
  };

  console.log(
    '📊 PopulatedLinksState: Rendering with',
    filteredLinks.length,
    'filtered links out of',
    links.length,
    'total links'
  );

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <LinksOverviewCards data={overviewData} />

      {/* Header with Search and Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-semibold text-[var(--quaternary)]'>
            Your Links ({filteredLinks.length})
          </h2>

          {/* Filter Badge */}
          {filter !== 'all' && (
            <div className='px-2 py-1 bg-[var(--primary-subtle)] text-[var(--tertiary)] rounded-md text-sm font-medium'>
              {filter === 'active' && 'Active'}
              {filter === 'paused' && 'Paused'}
              {filter === 'expired' && 'Expired'}
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
              openCreateModal();
              console.log('🔥 POPULATED STATE: openCreateModal() called');
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
            <Select value={filter} onValueChange={setFilter}>
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
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between p-4 bg-[var(--primary-subtle)] border border-[var(--primary)] rounded-lg'
        >
          <span className='text-sm font-medium text-[var(--tertiary)]'>
            {selectionCount} link
            {selectionCount > 1 ? 's' : ''} selected
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
      <div
        className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }`}
      >
        {filteredLinks.map((link, index) => (
          <LinkCard
            key={link.id}
            linkId={link.id}
            view={viewMode}
            index={index}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* Empty state for filtered results */}
      {filteredLinks.length === 0 && links.length > 0 && (
        <div className='text-center py-12'>
          <h3 className='text-lg font-medium text-[var(--neutral-600)] mb-2'>
            No links found
          </h3>
          <p className='text-[var(--neutral-500)] mb-4'>
            Try adjusting your search or filter criteria
          </p>
          <ActionButton
            variant='outline'
            onClick={() => {
              setSearchQuery('');
              setFilter('all');
            }}
          >
            Clear filters
          </ActionButton>
        </div>
      )}
    </div>
  );
}
