'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, SlidersHorizontal } from 'lucide-react';
import { LinkCard } from '../cards/link-card';
import { EmptyLinksState } from './empty-links-state';
import { LinksOverviewCards } from '../cards/links-overview-cards';
import {
  LinkDetailsModal,
  ShareModal,
  SettingsModal,
} from '../modals/link-modals';
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
import {
  useLinksStore,
  LINK_FILTER,
  type ViewMode,
  type LinkFilter,
} from '../../store/links-store';
import type { UploadLink, LinkData } from '../../types';
import { adaptUploadLinkForUI } from '../../types';
import { toast } from 'sonner';

interface PopulatedLinksStateProps {
  readonly links: readonly UploadLink[];
  readonly filteredLinks: readonly UploadLink[];
  readonly hasBaseLink: boolean;
  readonly baseLink?: UploadLink | undefined;
  readonly topicLinks: readonly UploadLink[];
  readonly linkStats: {
    readonly total: number;
    readonly active: number;
    readonly expired: number;
    readonly public: number;
    readonly private: number;
    readonly totalUploads: number;
    readonly hasSelection: boolean;
    readonly selectedCount: number;
  };
  readonly searchQuery: string;
  readonly filter: LinkFilter;
  readonly viewMode: ViewMode;
  readonly onSearchChange: (query: string) => void;
  readonly onFilterChange: (filter: LinkFilter) => void;
  readonly onViewModeChange: (mode: ViewMode) => void;
  readonly onCreateLink: () => void;
  readonly onTemplatesClick: () => void;
  readonly onLinkClick: (linkId: string) => void;
  readonly onDeleteLink: (linkId: string) => void;
  readonly isMultiSelectMode: boolean;
  readonly selectedLinks: string[];
  readonly onMultiSelect: (linkId: string) => void;
  readonly onMultiSelectModeToggle: () => void;
}

export function PopulatedLinksState({
  links,
  filteredLinks,
  hasBaseLink,
  baseLink,
  topicLinks,
  linkStats,
  searchQuery,
  filter,
  viewMode,
  onSearchChange,
  onFilterChange,
  onViewModeChange,
  onCreateLink,
  onTemplatesClick,
  onLinkClick,
  onDeleteLink,
  isMultiSelectMode,
  selectedLinks,
  onMultiSelect,
  onMultiSelectModeToggle,
}: PopulatedLinksStateProps) {
  const { deleteLink, isLoading } = useLinksStore();

  // Convert filtered UploadLinks to LinkData for UI
  const adaptedLinks = filteredLinks.map(adaptUploadLinkForUI);

  // ✅ Optimized modal state management (replaces redundant hook)
  const [activeLink, setActiveLink] = useState<LinkData | null>(null);
  const [showLinkDetails, setShowLinkDetails] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ✅ Optimized modal handlers with useCallback
  const openModal = useCallback((modalType: string, link: LinkData) => {
    setActiveLink(link);
    switch (modalType) {
      case 'showLinkDetails':
        setShowLinkDetails(true);
        break;
      case 'showShareModal':
        setShowShareModal(true);
        break;
      case 'showSettingsModal':
        setShowSettingsModal(true);
        break;
    }
  }, []);

  const closeModal = useCallback(
    (modalType: string) => {
      switch (modalType) {
        case 'showLinkDetails':
          setShowLinkDetails(false);
          break;
        case 'showShareModal':
          setShowShareModal(false);
          break;
        case 'showSettingsModal':
          setShowSettingsModal(false);
          break;
      }
      if (!showLinkDetails && !showShareModal && !showSettingsModal) {
        setActiveLink(null);
      }
    },
    [showLinkDetails, showShareModal, showSettingsModal]
  );

  // Create overview data from link stats
  const overviewData = {
    totalLinks: linkStats.total,
    activeLinks: linkStats.active,
    totalUploads: linkStats.totalUploads,
    totalViews: 0, // TODO: Calculate from actual data
  };

  // ✅ Optimized link selection handler
  const handleSelect = useCallback(
    (linkId: string) => {
      const link = adaptedLinks.find(l => l.id === linkId);
      if (link) {
        openModal('showLinkDetails', link);
      }
    },
    [adaptedLinks, openModal]
  );

  // ✅ Optimized view details handler
  const handleViewDetails = useCallback(
    (linkId: string) => {
      const link = adaptedLinks.find(l => l.id === linkId);
      if (link) {
        openModal('showLinkDetails', link);
      }
    },
    [adaptedLinks, openModal]
  );

  // ✅ Optimized multi-select handler
  const handleMultiSelect = useCallback(
    (linkId: string) => {
      onMultiSelect(linkId);
    },
    [onMultiSelect]
  );

  // ✅ Optimized share handler
  const handleShare = useCallback(
    (linkId: string) => {
      const link = adaptedLinks.find(l => l.id === linkId);
      if (link) {
        openModal('showShareModal', link);
      }
    },
    [adaptedLinks, openModal]
  );

  // ✅ Optimized settings handler
  const handleSettings = useCallback(
    (linkId: string) => {
      const link = adaptedLinks.find(l => l.id === linkId);
      if (link) {
        openModal('showSettingsModal', link);
      }
    },
    [adaptedLinks, openModal]
  );

  // ✅ Optimized delete handler
  const handleDelete = useCallback(
    async (linkId: string) => {
      const link = adaptedLinks.find(l => l.id === linkId);
      if (!link) return;

      if (link.linkType === 'base') {
        toast.error('Base links cannot be deleted');
        return;
      }

      try {
        await deleteLink(linkId as any);
        toast.success(`${link.name} deleted successfully`);
        onMultiSelect(linkId);
      } catch (error) {
        toast.error('Failed to delete link');
      }
    },
    [adaptedLinks, deleteLink, onMultiSelect]
  );

  // ✅ Optimized close all modals handler
  const closeAllModals = useCallback(() => {
    closeModal('showLinkDetails');
    closeModal('showShareModal');
    closeModal('showSettingsModal');
  }, [closeModal]);

  return (
    <div className='space-y-6'>
      {/* Overview Cards */}
      <LinksOverviewCards data={overviewData} />

      {/* Header with Search and Filters */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <h2 className='text-xl font-semibold text-[var(--quaternary)]'>
            Your Links ({adaptedLinks.length})
          </h2>

          {/* Filter Badge */}
          {filter !== LINK_FILTER.ALL && (
            <div className='px-2 py-1 bg-[var(--primary-subtle)] text-[var(--tertiary)] rounded-md text-sm font-medium'>
              {filter === LINK_FILTER.ACTIVE && 'Active'}
              {filter === LINK_FILTER.PAUSED && 'Paused'}
              {filter === LINK_FILTER.EXPIRED && 'Expired'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <ActionButton
            variant='outline'
            size='sm'
            onClick={onTemplatesClick}
            className='text-[var(--neutral-600)] border-[var(--neutral-200)]'
          >
            <SlidersHorizontal className='w-4 h-4' />
            Templates
          </ActionButton>

          <ActionButton
            variant='default'
            size='sm'
            onClick={onCreateLink}
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
            onChange={onSearchChange}
            placeholder='Search links...'
            className='w-full'
          />
        </div>

        {/* Filters */}
        <div className='flex items-center gap-3'>
          {/* Status Filter */}
          <div className='min-w-[140px]'>
            <Select value={filter} onValueChange={onFilterChange}>
              <SelectTrigger size='sm' className='border-[var(--neutral-200)]'>
                <Filter className='w-4 h-4 mr-2 text-[var(--neutral-500)]' />
                <SelectValue placeholder='Filter' />
              </SelectTrigger>
              <SelectContent className='bg-white border-[var(--neutral-200)]'>
                <SelectItem value={LINK_FILTER.ALL}>All Links</SelectItem>
                <SelectItem value={LINK_FILTER.ACTIVE}>Active</SelectItem>
                <SelectItem value={LINK_FILTER.PAUSED}>Paused</SelectItem>
                <SelectItem value={LINK_FILTER.EXPIRED}>Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <ViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            className='border-[var(--neutral-200)]'
          />
        </div>
      </div>

      {/* Multi-select Actions */}
      {isMultiSelectMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center justify-between p-4 bg-[var(--primary-subtle)] border border-[var(--primary)] rounded-lg'
        >
          <span className='text-sm font-medium text-[var(--tertiary)]'>
            {selectedLinks.length} link{selectedLinks.length > 1 ? 's' : ''}{' '}
            selected
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
      {adaptedLinks.length === 0 ? (
        <EmptyLinksState />
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
          {adaptedLinks.map((link, index) => (
            <LinkCard
              key={link.id}
              link={link}
              view={viewMode}
              index={index}
              onSelect={handleSelect}
              isSelected={activeLink?.id === link.id}
              onShare={handleShare}
              onViewDetails={handleViewDetails}
              onSettings={handleSettings}
              onDelete={handleDelete}
              {...(isMultiSelectMode && { onMultiSelect: handleMultiSelect })}
              isMultiSelected={selectedLinks?.includes(link.id) || false}
            />
          ))}
        </motion.div>
      )}

      {/* Modals - Using the hook's state management */}
      {activeLink && (
        <>
          <LinkDetailsModal
            isOpen={showLinkDetails}
            onClose={() => closeModal('showLinkDetails')}
            link={activeLink}
          />

          <ShareModal
            isOpen={showShareModal}
            onClose={() => closeModal('showShareModal')}
            link={activeLink}
          />

          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => closeModal('showSettingsModal')}
            link={activeLink}
          />
        </>
      )}
    </div>
  );
}
