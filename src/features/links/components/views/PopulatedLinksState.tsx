'use client';

import { motion } from 'framer-motion';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { memo, useMemo, useCallback, useState } from 'react';
import { LinkCard } from '../cards/LinkCard';
import { EmptyLinksState } from './EmptyLinksState';
import { LinksOverviewCards } from '../cards/LinksOverviewCards';
import { useModalStore, useUIStore } from '../../store';
import { ActionButton } from '@/components/core/action-button';
import { SecondaryCTAButton } from '@/components/core';
import { SearchInput } from '@/components/core/search-input';
import { ViewToggle } from '@/components/core/view-toggle';
import { SelectionMenu, type MenuAction } from '@/components/core';
import { BulkDeleteConfirmationModal } from '../modals/BulkDeleteConfirmationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/animate-ui/radix/dropdown-menu';
import { Filter } from 'lucide-react';
import type { LinkWithStats } from '@/lib/database/types';

interface PopulatedLinksStateProps {
  links: LinkWithStats[];
}

export const PopulatedLinksState = memo<PopulatedLinksStateProps>(
  function PopulatedLinksState({ links = [] }: PopulatedLinksStateProps) {
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

    // Selection state for checkboxes
    const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(
      new Set()
    );
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

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
    const handleCreateClick = useCallback(() => {
      // Check if user has a base link already
      const hasBaseLink = links.some(link => link.linkType === 'base');

      // If no base link exists, create base link first
      if (!hasBaseLink) {
        // This is just informational UI feedback, not really a notification event
        // We'll keep it simple and just open the modal without a toast
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

    // Handle multiselect checkbox changes
    const handleMultiSelect = useCallback((linkId: string) => {
      setSelectedLinkIds(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(linkId)) {
          newSelected.delete(linkId);
        } else {
          newSelected.add(linkId);
        }
        return newSelected;
      });
    }, []);

    // Handle select all (only non-base links)
    const handleSelectAll = useCallback(() => {
      const selectableLinks = links.filter(link => link.linkType !== 'base');
      setSelectedLinkIds(new Set(selectableLinks.map(link => link.id)));
    }, [links]);

    // Handle clear selection
    const handleClearSelection = useCallback(() => {
      setSelectedLinkIds(new Set());
    }, []);

    // Handle bulk delete - opens confirmation modal
    const handleBulkDelete = useCallback(() => {
      if (selectedLinkIds.size === 0) return;
      setShowBulkDeleteModal(true);
    }, [selectedLinkIds.size]);

    // Handle successful bulk delete
    const handleBulkDeleteSuccess = useCallback(() => {
      setSelectedLinkIds(new Set());
      setShowBulkDeleteModal(false);
    }, []);

    // Get selected links for bulk delete modal
    const selectedLinksForDelete = useMemo(
      () => links.filter(link => selectedLinkIds.has(link.id)),
      [links, selectedLinkIds]
    );

    // Get selectable links count (non-base links)
    const selectableLinksCount = useMemo(
      () => links.filter(link => link.linkType !== 'base').length,
      [links]
    );

    // Check if all selectable links are selected
    const areAllSelected = useMemo(
      () =>
        selectableLinksCount > 0 &&
        selectedLinkIds.size === selectableLinksCount,
      [selectableLinksCount, selectedLinkIds.size]
    );

    // Selection menu actions (following Gmail/Google Photos patterns)
    const selectionMenuActions: MenuAction[] = useMemo(() => {
      const actions: MenuAction[] = [];

      // Only show Select All if not all are selected
      if (!areAllSelected && selectableLinksCount > 1) {
        actions.push({
          key: 'select-all',
          label: 'Select all',
          onClick: handleSelectAll,
          icon: <CheckSquare className='w-3.5 h-3.5' />,
        });
      }

      // Always show clear/deselect when items are selected
      if (selectedLinkIds.size > 0) {
        actions.push({
          key: 'clear',
          label: 'Clear',
          onClick: handleClearSelection,
        });
      }

      // Delete action
      actions.push({
        key: 'delete',
        label: 'Delete',
        onClick: handleBulkDelete,
        variant: 'destructive',
        icon: <Trash2 className='w-3.5 h-3.5' />,
        disabled: selectedLinkIds.size === 0,
      });

      return actions;
    }, [
      areAllSelected,
      selectableLinksCount,
      selectedLinkIds.size,
      handleClearSelection,
      handleSelectAll,
      handleBulkDelete,
    ]);

    // Show no results message if there are no links and there's a search query
    if (links.length === 0 && searchQuery) {
      return (
        <div className='space-y-6'>
          <div className='mt-6'>
            <LinksOverviewCards data={overviewData} />
          </div>

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
            <p>No links found matching "{searchQuery}"</p>
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
        <div className='mt-6'>
          <LinksOverviewCards data={overviewData} />
        </div>

        {/* Header with Search and Filters */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <h2>Your Links ({links.length})</h2>
            {/* Debug: Show selection count */}
            {selectedLinkIds.size > 0 && (
              <span className='px-2 py-1 bg-blue-500 text-white rounded-md text-sm'>
                {selectedLinkIds.size} selected
              </span>
            )}

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

          {/* Action Button */}
          <SecondaryCTAButton onClick={handleCreateClick} icon={Plus}>
            Create Link
          </SecondaryCTAButton>
        </div>

        {/* Search and Filter Controls */}
        <div className='flex flex-col lg:flex-row gap-4 lg:items-center'>
          {/* Search */}
          <div className='flex-1 lg:flex-none lg:w-80'>
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder='Search links...'
              className='w-full'
            />
          </div>

          {/* Desktop: Inline Filters | Mobile: Stacked */}
          <div className='flex flex-col lg:flex-row gap-3 lg:items-center'>
            {/* Filter Buttons Row */}
            <div className='flex gap-2 lg:gap-3'>
              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger className='flex-1 lg:w-36 flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <Filter className='w-4 h-4 text-muted-foreground' />
                    <span>
                      {filterType === 'all'
                        ? 'All Types'
                        : filterType === 'base'
                          ? 'Base'
                          : filterType === 'custom'
                            ? 'Custom'
                            : 'Generated'}
                    </span>
                  </div>
                  <svg
                    className='w-4 h-4 text-muted-foreground'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-full min-w-[150px]'
                >
                  <DropdownMenuItem
                    onClick={() => handleFilterTypeChange('all')}
                    className='cursor-pointer'
                  >
                    All Types
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterTypeChange('base')}
                    className='cursor-pointer'
                  >
                    Base
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterTypeChange('custom')}
                    className='cursor-pointer'
                  >
                    Custom
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterTypeChange('generated')}
                    className='cursor-pointer'
                  >
                    Generated
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger className='flex-1 lg:w-36 flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <Filter className='w-4 h-4 text-muted-foreground' />
                    <span>
                      {filterStatus === 'all'
                        ? 'All Status'
                        : filterStatus === 'active'
                          ? 'Active'
                          : filterStatus === 'paused'
                            ? 'Paused'
                            : 'Expired'}
                    </span>
                  </div>
                  <svg
                    className='w-4 h-4 text-muted-foreground'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align='end'
                  className='w-full min-w-[150px]'
                >
                  <DropdownMenuItem
                    onClick={() => handleFilterStatusChange('all')}
                    className='cursor-pointer'
                  >
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterStatusChange('active')}
                    className='cursor-pointer'
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterStatusChange('paused')}
                    className='cursor-pointer'
                  >
                    Paused
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterStatusChange('expired')}
                    className='cursor-pointer'
                  >
                    Expired
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* View Toggle */}
            <div className='lg:ml-2'>
              <ViewToggle
                value={viewMode}
                onChange={handleViewModeChange}
                className='border-[var(--neutral-200)] w-full lg:w-auto'
              />
            </div>
          </div>
        </div>

        {/* Links Grid/List */}
        <motion.div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
              : 'space-y-3 md:space-y-4'
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {links.map((link, index) => (
            <motion.div
              key={`${link.id}-${viewMode}`}
              initial={
                viewMode === 'grid'
                  ? { opacity: 0, y: 20 }
                  : { opacity: 0, y: -10 }
              }
              animate={
                viewMode === 'grid'
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: 0 }
              }
              transition={
                viewMode === 'grid'
                  ? { duration: 0.3, delay: index * 0.05 }
                  : { duration: 0.25, delay: index * 0.04, ease: 'easeOut' }
              }
            >
              <LinkCard
                link={link}
                viewMode={viewMode}
                onDetails={() => handleDetailsModal(link)}
                onShare={() => handleShareModal(link)}
                onSettings={() => handleSettingsModal(link)}
                onDelete={() => handleDeleteModal(link)}
                isMultiSelected={selectedLinkIds.has(link.id)}
                onMultiSelect={handleMultiSelect}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bulk Delete Confirmation Modal */}
        <BulkDeleteConfirmationModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          selectedLinks={selectedLinksForDelete}
          onSuccess={handleBulkDeleteSuccess}
        />

        {/* Selection Menu - Shows when items are selected */}
        <SelectionMenu
          isVisible={selectedLinkIds.size > 0}
          selectedCount={selectedLinkIds.size}
          actions={selectionMenuActions}
          message={`${selectedLinkIds.size} link${selectedLinkIds.size > 1 ? 's' : ''} selected`}
          position='bottom-center'
        />
      </div>
    );
  }
);
