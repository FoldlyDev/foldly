'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, FileText, Archive, Copy, Trash2 } from 'lucide-react';
import {
  LinksOverviewCards,
  CreateLinkModal,
  LinkCard,
  EmptyLinksState,
} from '@/components/features/links';
import {
  LinkDetailsModal,
  ShareModal,
  SettingsModal,
} from '@/components/features/links/link-modals';
import { SearchInput } from '@/components/ui/search-input';
import { ActionButton } from '@/components/ui/action-button';
import { FilterSystem } from '@/components/ui/filter-system';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { ViewToggle } from '@/components/ui/view-toggle';
import { TemplatesModal } from '@/components/ui/templates-modal';
import {
  useDashboardLinks,
  type LinkData,
} from '@/lib/hooks/use-dashboard-links';

export default function LinksPage() {
  // Mock data - replace with real data from your backend
  const linkStats = {
    totalLinks: 5,
    activeLinks: 4,
    totalUploads: 52,
    totalViews: 169,
  };

  const uploadLinks: LinkData[] = [
    {
      id: '1',
      name: 'My Base Collection',
      slug: '',
      url: 'foldly.com/yourname',
      status: 'active' as const,
      uploads: 24,
      views: 78,
      lastActivity: '30 minutes ago',
      expiresAt: 'Never',
      createdAt: '2025-01-01',
      linkType: 'base' as const,

      // Visibility and Security Controls
      isPublic: true,
      requireEmail: false,
      requirePassword: false,

      // File and Upload Limits
      maxFiles: 100,
      maxFileSize: 104857600, // 100MB in bytes
      allowedFileTypes: ['*'], // All file types

      // Organization Settings
      autoCreateFolders: true,

      settings: {
        requireEmail: false,
        allowMultiple: true,
        maxFileSize: '100MB',
        customMessage: 'Welcome! Drop your files here for quick sharing.',
      },
    },
    {
      id: '2',
      name: 'Client Onboarding',
      slug: 'client-onboarding',
      url: 'foldly.com/yourname/client-onboarding',
      status: 'active' as const,
      uploads: 12,
      views: 45,
      lastActivity: '2 hours ago',
      expiresAt: '2025-02-15',
      createdAt: '2025-01-10',
      linkType: 'custom' as const,
      topic: 'client-onboarding',

      // Visibility and Security Controls
      isPublic: false, // Private for client work
      requireEmail: true,
      requirePassword: true,
      passwordHash: 'hashed_password_here',

      // File and Upload Limits
      maxFiles: 50,
      maxFileSize: 52428800, // 50MB in bytes
      allowedFileTypes: ['image/*', 'application/pdf', 'application/zip'],

      // Organization Settings
      autoCreateFolders: true,

      settings: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '50MB',
        customMessage:
          'Please upload your logo, brand guidelines, and initial project files.',
      },
    },
    {
      id: '3',
      name: 'Team Headshots',
      slug: 'team-headshots',
      url: 'foldly.com/yourname/team-headshots',
      status: 'active' as const,
      uploads: 8,
      views: 23,
      lastActivity: '1 day ago',
      expiresAt: '2025-01-30',
      createdAt: '2025-01-08',
      linkType: 'custom' as const,
      topic: 'team-headshots',

      // Visibility and Security Controls
      isPublic: true, // Public for team members
      requireEmail: false,
      requirePassword: false,

      // File and Upload Limits
      maxFiles: 20,
      maxFileSize: 26214400, // 25MB in bytes
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],

      // Organization Settings
      autoCreateFolders: false,

      settings: {
        requireEmail: false,
        allowMultiple: true,
        maxFileSize: '25MB',
        customMessage: 'Upload your professional headshot for the team page.',
      },
    },
    {
      id: '4',
      name: 'Project Assets',
      slug: 'project-assets',
      url: 'foldly.com/yourname/project-assets',
      status: 'paused' as const,
      uploads: 5,
      views: 18,
      lastActivity: '3 days ago',
      expiresAt: '2025-03-01',
      createdAt: '2025-01-05',
      linkType: 'custom' as const,
      topic: 'project-assets',

      // Visibility and Security Controls
      isPublic: false, // Private for project work
      requireEmail: true,
      requirePassword: false,

      // File and Upload Limits
      maxFiles: 75,
      maxFileSize: 104857600, // 100MB in bytes
      allowedFileTypes: [
        'image/*',
        'video/*',
        'application/zip',
        'application/pdf',
      ],

      // Organization Settings
      autoCreateFolders: true,

      settings: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '100MB',
        customMessage:
          'Share your design files, assets, and reference materials.',
      },
    },
    {
      id: '5',
      name: 'Invoice Documents',
      slug: 'invoice-docs',
      url: 'foldly.com/yourname/invoice-docs',
      status: 'expired' as const,
      uploads: 3,
      views: 12,
      lastActivity: '1 week ago',
      expiresAt: '2025-01-15',
      createdAt: '2025-01-01',
      linkType: 'custom' as const,
      topic: 'invoice-docs',

      // Visibility and Security Controls
      isPublic: false, // Private for financial documents
      requireEmail: true,
      requirePassword: true,
      passwordHash: 'secure_hash_here',

      // File and Upload Limits
      maxFiles: 10,
      maxFileSize: 10485760, // 10MB in bytes
      allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],

      // Organization Settings
      autoCreateFolders: false,

      settings: {
        requireEmail: true,
        allowMultiple: false,
        maxFileSize: '10MB',
        customMessage:
          'Please upload your receipts and invoices for reimbursement.',
      },
    },
  ];

  // Initialize dashboard state management
  const dashboardState = useDashboardLinks(uploadLinks);

  // Handle link deletion (prevent base link deletion)
  const handleDeleteLink = useCallback(
    (linkId: string) => {
      const link = uploadLinks.find(l => l.id === linkId);
      if (!link) return;

      if (link.linkType === 'base') {
        // Prevent base link deletion
        alert(
          'Base collection links cannot be deleted. This is your main collection area.'
        );
        return;
      }

      // For custom topic links, show confirmation dialog
      const confirmDelete = window.confirm(
        `Are you sure you want to delete "${link.name}"?\n\nThis will permanently remove:\n• The upload link\n• All uploaded files\n• All upload history\n\nThis action cannot be undone.`
      );

      if (confirmDelete) {
        // TODO: Implement actual deletion logic with API call
        console.log('Deleting link:', linkId);
        // For now, just show success message
        alert(`"${link.name}" has been deleted successfully.`);
        // In real implementation, refresh the links list after deletion
      }
    },
    [uploadLinks]
  );

  // Bulk actions configuration
  const bulkActions = [
    {
      key: 'edit',
      label: 'Bulk Edit',
      icon: Settings,
      variant: 'outline' as const,
      onClick: () => console.log('Bulk edit clicked'),
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: Archive,
      variant: 'outline' as const,
      onClick: () => console.log('Archive clicked'),
    },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: Copy,
      variant: 'outline' as const,
      onClick: () => console.log('Duplicate clicked'),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: () => console.log('Delete clicked'),
    },
  ];

  // Filter configuration
  const filterConfigs = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'expired', label: 'Expired' },
      ],
    },
    {
      key: 'sortBy',
      label: 'Sort By',
      options: [
        { value: 'recent', label: 'Recent Activity' },
        { value: 'created', label: 'Date Created' },
        { value: 'uploads', label: 'Most Uploads' },
        { value: 'views', label: 'Most Views' },
        { value: 'name', label: 'Alphabetical' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      options: [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
      ],
    },
    {
      key: 'fileTypes',
      label: 'File Types',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'images', label: 'Images Only' },
        { value: 'documents', label: 'Documents Only' },
        { value: 'videos', label: 'Videos Only' },
      ],
    },
  ];

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial='hidden'
      animate='visible'
      className='min-h-screen p-6 bg-gradient-to-br from-[var(--neutral-50)] to-white'
    >
      {/* Header Section */}
      <motion.div variants={sectionVariants} className='mb-8'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
              Upload Links
            </h1>
            <p className='text-[var(--neutral-600)] text-lg'>
              Create and manage your custom file collection links
            </p>
          </div>

          <div className='flex flex-col lg:flex-row items-start lg:items-center gap-4'>
            {/* Search and Filters */}
            <div className='flex-1 flex items-center gap-3 w-full lg:w-auto'>
              <SearchInput
                value={dashboardState.searchQuery}
                onChange={dashboardState.setSearchQuery}
                placeholder='Search links...'
                className='lg:w-80'
              />

              <ActionButton
                variant={
                  dashboardState.showAdvancedFilters ? 'secondary' : 'outline'
                }
                size='default'
                onClick={() =>
                  dashboardState.setShowAdvancedFilters(
                    !dashboardState.showAdvancedFilters
                  )
                }
              >
                <Settings className='w-4 h-4' />
                Filters
              </ActionButton>
            </div>

            <div className='flex items-center gap-3'>
              {/* Bulk Actions Bar */}
              <BulkActionsBar
                selectedItems={dashboardState.selectedLinks}
                onClearSelection={dashboardState.clearSelection}
                actions={bulkActions}
                itemLabel='link'
              />

              {/* Templates Button */}
              <ActionButton
                variant='outline'
                size='default'
                onClick={() => dashboardState.openModal('showTemplates')}
              >
                <FileText className='w-4 h-4' />
                Templates
              </ActionButton>

              {/* View Toggle */}
              <ViewToggle
                value={dashboardState.view}
                onChange={dashboardState.setView}
              />

              {/* Create Link Button */}
              <ActionButton
                variant='default'
                size='lg'
                onClick={() => dashboardState.openModal('showCreateModal')}
                className='px-6 py-3'
              >
                <Plus className='w-5 h-5' />
                Create Link
              </ActionButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {dashboardState.showAdvancedFilters && (
          <FilterSystem
            filters={filterConfigs}
            values={
              dashboardState.filterValues as unknown as Record<string, string>
            }
            onChange={(key: string, value: string) =>
              dashboardState.updateFilter(
                key as keyof typeof dashboardState.filterValues,
                value
              )
            }
            onClear={dashboardState.clearFilters}
            onApply={() => dashboardState.setShowAdvancedFilters(false)}
            isExpanded={dashboardState.showAdvancedFilters}
            onToggle={dashboardState.setShowAdvancedFilters}
            showToggle={false}
            className='mb-6'
          />
        )}
      </AnimatePresence>

      {/* Overview Cards */}
      <motion.div variants={sectionVariants}>
        <LinksOverviewCards data={linkStats} />
      </motion.div>

      {/* Links Section */}
      <motion.div variants={sectionVariants} className='mb-8'>
        {dashboardState.links.length === 0 && uploadLinks.length === 0 ? (
          <EmptyLinksState
            onCreateLink={() => dashboardState.openModal('showCreateModal')}
          />
        ) : (
          <>
            {/* Section Header */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-[var(--quaternary)]'>
                Your Links ({dashboardState.links.length})
              </h2>

              <div className='flex items-center gap-2'>
                <select
                  value={dashboardState.filterValues.status}
                  onChange={e =>
                    dashboardState.updateFilter('status', e.target.value)
                  }
                  className='px-3 py-2 bg-white border border-[var(--neutral-200)] rounded-lg text-sm cursor-pointer'
                >
                  <option value='all'>All Links</option>
                  <option value='active'>Active</option>
                  <option value='paused'>Paused</option>
                  <option value='expired'>Expired</option>
                </select>
                <select
                  value={dashboardState.filterValues.sortBy}
                  onChange={e =>
                    dashboardState.updateFilter('sortBy', e.target.value)
                  }
                  className='px-3 py-2 bg-white border border-[var(--neutral-200)] rounded-lg text-sm cursor-pointer'
                >
                  <option value='recent'>Recent Activity</option>
                  <option value='uploads'>Most Uploads</option>
                  <option value='views'>Most Views</option>
                  <option value='name'>Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Links Grid/List */}
            <div
              className={`
              ${
                dashboardState.view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            `}
            >
              {dashboardState.links.map((link: LinkData, index: number) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  view={dashboardState.view}
                  index={index}
                  onSelect={dashboardState.handleLinkSelect}
                  isSelected={dashboardState.selectedLink === link.id}
                  onMultiSelect={dashboardState.handleMultiSelect}
                  isMultiSelected={dashboardState.selectedLinks.includes(
                    link.id
                  )}
                  onShare={linkId => {
                    const link = uploadLinks.find(l => l.id === linkId);
                    if (link) dashboardState.openModal('showShareModal', link);
                  }}
                  onSettings={linkId => {
                    const link = uploadLinks.find(l => l.id === linkId);
                    if (link)
                      dashboardState.openModal('showSettingsModal', link);
                  }}
                  onDelete={handleDeleteLink}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {/* Create Link Modal */}
        {dashboardState.showCreateModal && (
          <CreateLinkModal
            isOpen={dashboardState.showCreateModal}
            onClose={() => dashboardState.closeModal('showCreateModal')}
            onSuccess={() => {
              dashboardState.closeModal('showCreateModal');
              // Refresh links data
            }}
          />
        )}

        {/* Templates Modal */}
        {dashboardState.showTemplates && (
          <TemplatesModal
            isOpen={dashboardState.showTemplates}
            onClose={() => dashboardState.closeModal('showTemplates')}
            onSelectTemplate={template => {
              dashboardState.closeModal('showTemplates');
              dashboardState.openModal('showCreateModal');
            }}
          />
        )}
      </AnimatePresence>

      {/* Link Details Modal */}
      {dashboardState.activeLink && (
        <LinkDetailsModal
          isOpen={dashboardState.showLinkDetails}
          onClose={() => dashboardState.closeModal('showLinkDetails')}
          link={dashboardState.activeLink}
        />
      )}

      {/* Share Modal */}
      {dashboardState.activeLink && (
        <ShareModal
          isOpen={dashboardState.showShareModal}
          onClose={() => dashboardState.closeModal('showShareModal')}
          link={dashboardState.activeLink}
        />
      )}

      {/* Settings Modal */}
      {dashboardState.activeLink && (
        <SettingsModal
          isOpen={dashboardState.showSettingsModal}
          onClose={() => dashboardState.closeModal('showSettingsModal')}
          link={dashboardState.activeLink}
        />
      )}
    </motion.div>
  );
}
