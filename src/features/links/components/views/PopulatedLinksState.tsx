'use client';

import { motion } from 'framer-motion';
import { Plus, Filter, SlidersHorizontal } from 'lucide-react';
import { memo, useMemo, useCallback } from 'react';
import { LinkCard } from '../cards/LinkCard';
import { EmptyLinksState } from './EmptyLinksState';
import { LinksOverviewCards } from '../cards/LinksOverviewCards';
import { useModalStore, useUIStore } from '../../store';
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
import type { LinkWithStats } from '@/lib/supabase/types';

interface PopulatedLinksStateProps {
  links: LinkWithStats[];
  isLoading?: boolean;
}

export const PopulatedLinksState = memo<PopulatedLinksStateProps>(
  function PopulatedLinksState({
    links = [],
    isLoading = false,
  }: PopulatedLinksStateProps) {
    // Single store subscription instead of multiple selectors to prevent cascading re-renders
    const {
      openCreateModal,
      openDetailsModal,
      openShareModal,
      openSettingsModal,
      openDeleteModal,
    } = useModalStore();

    // Get all UI state in one subscription
    const {
      viewMode,
      searchQuery,
      filterType,
      filterStatus,
      setSearchQuery,
      setFilterType,
      setFilterStatus,
      setViewMode,
    } = useUIStore();

    // Memoize stats calculation using the passed-in links (already filtered)
    const overviewData = useMemo(() => {
      const stats = {
        total: links.length,
        active: links.filter(
          link =>
            link.isActive &&
            (!link.expiresAt || new Date(link.expiresAt) >= new Date())
        ).length,
        totalUploads: links.reduce((sum, link) => sum + link.totalUploads, 0),
        totalFiles: links.reduce((sum, link) => sum + link.totalFiles, 0),
      };

      return {
        totalLinks: stats.total,
        activeLinks: stats.active,
        totalUploads: stats.totalUploads,
        totalViews: stats.totalFiles, // Using files as views proxy
      };
    }, [links]);

    // Stabilize callbacks to prevent unnecessary re-renders
    const handleTemplatesClick = useCallback(() => {
      toast.info('Templates functionality coming soon');
    }, []);

    const handleCreateClick = useCallback(() => {
      // Check if user has a base link already
      const hasBaseLink = links.some(link => link.linkType === 'base');

      // If no base link exists, create base link first
      if (!hasBaseLink) {
        toast.info('Setting up your base link first...');
        openCreateModal('base');
      } else {
        // User has base link, create topic link
        openCreateModal('custom');
      }
    }, [openCreateModal, links]);

    const handleSearchChange = useCallback(
      (query: string) => {
        setSearchQuery(query);
      },
      [setSearchQuery]
    );

    const handleClearSearch = useCallback(() => {
      setSearchQuery('');
    }, [setSearchQuery]);

    const handleFilterTypeChange = useCallback(
      (type: string) => {
        setFilterType(type as any);
      },
      [setFilterType]
    );

    const handleFilterStatusChange = useCallback(
      (status: string) => {
        setFilterStatus(status as any);
      },
      [setFilterStatus]
    );

    const handleViewModeChange = useCallback(
      (mode: 'grid' | 'list') => {
        setViewMode(mode);
      },
      [setViewMode]
    );

    // Memoize modal handlers to prevent unnecessary re-renders
    const handleDetailsModal = useCallback(
      (link: LinkWithStats) => {
        openDetailsModal(link);
      },
      [openDetailsModal]
    );

    const handleShareModal = useCallback(
      (link: LinkWithStats) => {
        openShareModal(link);
      },
      [openShareModal]
    );

    const handleSettingsModal = useCallback(
      (link: LinkWithStats) => {
        openSettingsModal(link);
      },
      [openSettingsModal]
    );

    const handleDeleteModal = useCallback(
      (link: LinkWithStats) => {
        openDeleteModal(link);
      },
      [openDeleteModal]
    );

    // Show no results message if there are no links and there's a search query
    if (links.length === 0 && searchQuery) {
      return (
        <div className='space-y-6'>
          <LinksOverviewCards data={overviewData} />

          {/* Search Header */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder='Search links...'
                className='w-full'
              />
            </div>
          </div>

          {/* No Results Message */}
          <div className='text-center py-12'>
            <p className='text-[var(--neutral-600)]'>
              No links found matching "{searchQuery}"
            </p>
            <button
              onClick={handleClearSearch}
              className='mt-2 text-[var(--primary)] hover:underline'
            >
              Clear search
            </button>
          </div>
        </div>
      );
    }

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

            {/* Filter Badges */}
            {(filterType !== 'all' || filterStatus !== 'all') && (
              <div className='flex gap-2'>
                {filterType !== 'all' && (
                  <div className='px-2 py-1 bg-[var(--primary-subtle)] text-[var(--tertiary)] rounded-md text-sm font-medium'>
                    {filterType}
                  </div>
                )}
                {filterStatus !== 'all' && (
                  <div className='px-2 py-1 bg-[var(--primary-subtle)] text-[var(--tertiary)] rounded-md text-sm font-medium'>
                    {filterStatus === 'active' && 'Active'}
                    {filterStatus === 'paused' && 'Paused'}
                    {filterStatus === 'expired' && 'Expired'}
                  </div>
                )}
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
              onClick={handleCreateClick}
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
              onChange={handleSearchChange}
              placeholder='Search links...'
              className='w-full'
            />
          </div>

          {/* Filters */}
          <div className='flex items-center gap-3'>
            {/* Type Filter */}
            <div className='min-w-[120px]'>
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger
                  size='sm'
                  className='border-[var(--neutral-200)]'
                >
                  <Filter className='w-4 h-4 mr-2 text-[var(--neutral-500)]' />
                  <SelectValue placeholder='Type' />
                </SelectTrigger>
                <SelectContent className='bg-white border-[var(--neutral-200)]'>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='base'>Base</SelectItem>
                  <SelectItem value='custom'>Custom</SelectItem>
                  <SelectItem value='generated'>Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='min-w-[120px]'>
              <Select
                value={filterStatus}
                onValueChange={handleFilterStatusChange}
              >
                <SelectTrigger
                  size='sm'
                  className='border-[var(--neutral-200)]'
                >
                  <Filter className='w-4 h-4 mr-2 text-[var(--neutral-500)]' />
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent className='bg-white border-[var(--neutral-200)]'>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='paused'>Paused</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <ViewToggle
              value={viewMode}
              onChange={handleViewModeChange}
              className='border-[var(--neutral-200)]'
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className='flex items-center justify-center py-12'>
            <div className='w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin' />
          </div>
        )}

        {/* Links Grid/List */}
        {!isLoading && (
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
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <LinkCard
                  link={link}
                  viewMode={viewMode}
                  onDetails={() => handleDetailsModal(link)}
                  onShare={() => handleShareModal(link)}
                  onSettings={() => handleSettingsModal(link)}
                  onDelete={() => handleDeleteModal(link)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }
);
