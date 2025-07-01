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
import { ContentLoader } from '@/components/ui';
import {
  useDashboardLinks,
  type LinkData,
  type FilterValues,
} from '@/lib/hooks/use-dashboard-links';
// Import dashboard analytics type from centralized types
import type { DashboardOverview } from '@/types';

// Use centralized type instead of inline interface
type LinkStats = Pick<
  DashboardOverview,
  'totalLinks' | 'activeLinks' | 'totalUploads'
> & {
  readonly totalViews: number;
};

interface LinksContainerProps {
  readonly initialData?: {
    readonly linkStats: LinkStats;
    readonly uploadLinks: readonly LinkData[];
  };
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function LinksContainer({
  initialData,
  isLoading = false,
  error = null,
}: LinksContainerProps) {
  // Mock data - replace with real data from your backend
  const linkStats = initialData?.linkStats || {
    totalLinks: 5,
    activeLinks: 4,
    totalUploads: 52,
    totalViews: 169,
  };

  const uploadLinks: LinkData[] = initialData?.uploadLinks
    ? [...initialData.uploadLinks]
    : [
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
            customMessage:
              'Upload your professional headshot for the team page.',
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
          maxFiles: 25,
          maxFileSize: 52428800, // 50MB in bytes
          allowedFileTypes: ['application/pdf', 'image/*'],

          // Organization Settings
          autoCreateFolders: true,

          settings: {
            requireEmail: true,
            allowMultiple: false,
            maxFileSize: '50MB',
            customMessage: 'Upload invoice and financial documents here.',
          },
        },
      ];

  const {
    // State
    searchQuery,
    view,
    filterValues,
    selectedLinks,
    showCreateModal,
    showLinkDetails,
    showShareModal,
    showSettingsModal,
    showTemplates,
    activeLink,
    links: filteredLinks,

    // Actions
    setSearchQuery,
    setView,
    updateFilter,
    handleMultiSelect,
    clearSelection,
    openModal,
    closeModal,
    handleBulkAction,
  } = useDashboardLinks(uploadLinks);

  const handleLinkClick = useCallback(
    (link: LinkData) => {
      openModal('showLinkDetails', link);
    },
    [openModal]
  );

  const handleShareClick = useCallback(
    (link: LinkData) => {
      openModal('showShareModal', link);
    },
    [openModal]
  );

  const handleSettingsClick = useCallback(
    (link: LinkData) => {
      openModal('showSettingsModal', link);
    },
    [openModal]
  );

  const handleBulkActionWrapper = useCallback(
    (action: string) => {
      handleBulkAction(action, selectedLinks);
    },
    [handleBulkAction, selectedLinks]
  );

  // Create filter options for FilterSystem component
  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Links' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'expired', label: 'Expired' },
      ],
    },
  ];

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
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <FileText className='w-6 h-6 sm:w-8 sm:h-8 text-red-500' />
            </div>
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Links Unavailable
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <ActionButton
              onClick={() => window.location.reload()}
              variant='default'
              className='w-full sm:w-auto'
            >
              Retry
            </ActionButton>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='home-container w-full mx-auto'>
        <div className='space-y-8'>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'
          >
            <div>
              <h1 className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                Upload Links
              </h1>
              <p className='text-[var(--neutral-600)]'>
                Create and manage your file collection links
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <ActionButton
                variant='outline'
                onClick={() => openModal('showTemplates')}
                className='flex items-center gap-2'
              >
                <Settings className='w-4 h-4' />
                Templates
              </ActionButton>

              <ActionButton
                variant='default'
                onClick={() => openModal('showCreateModal')}
                className='flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Create Link
              </ActionButton>
            </div>
          </motion.div>

          {/* Overview Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <LinksOverviewCards data={linkStats} />
          </motion.div>

          {uploadLinks.length > 0 ? (
            <>
              {/* Search and Filter Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className='flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between'
              >
                <div className='flex-1 max-w-md'>
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder='Search links...'
                  />
                </div>

                <div className='flex items-center gap-3'>
                  <FilterSystem
                    filters={filters}
                    values={(filterValues || {}) as Record<string, string>}
                    onChange={(key, value) =>
                      updateFilter(key as keyof FilterValues, value)
                    }
                  />

                  <ViewToggle value={view} onChange={setView} />
                </div>
              </motion.div>

              {/* Bulk Actions Bar */}
              <AnimatePresence>
                {selectedLinks.length > 0 && (
                  <BulkActionsBar
                    selectedItems={selectedLinks}
                    onClearSelection={clearSelection}
                    actions={[
                      {
                        key: 'archive',
                        label: 'Archive',
                        icon: Archive,
                        onClick: () => {},
                      },
                      {
                        key: 'duplicate',
                        label: 'Duplicate',
                        icon: Copy,
                        onClick: () => {},
                      },
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: Trash2,
                        onClick: () => {},
                      },
                    ]}
                    itemLabel='link'
                  />
                )}
              </AnimatePresence>

              {/* Links Grid/List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                key={view}
              >
                <motion.div
                  layout
                  className={`
                    grid gap-6 transition-all duration-300 ease-in-out
                    ${
                      view === 'grid'
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1'
                    }
                  `}
                >
                  {filteredLinks.map((link, index) => (
                    <motion.div
                      key={link.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.2,
                        layout: { duration: 0.2, ease: 'easeInOut' },
                      }}
                    >
                      <LinkCard
                        link={link}
                        view={view}
                        index={index}
                        isSelected={selectedLinks.includes(link.id)}
                        onMultiSelect={handleMultiSelect}
                        isMultiSelected={selectedLinks.includes(link.id)}
                        onSelect={() => handleLinkClick(link)}
                        onShare={() => handleShareClick(link)}
                        onSettings={() => handleSettingsClick(link)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <EmptyLinksState
                onCreateLink={() => openModal('showCreateModal')}
                // onLearnMore={() => console.log('Learn more clicked')}
              />
            </motion.div>
          )}
        </div>

        {/* Modals */}
        <CreateLinkModal
          isOpen={showCreateModal}
          onClose={() => closeModal('showCreateModal')}
          onSuccess={() => {
            closeModal('showCreateModal');
            // You can add additional success handling here like showing a toast
            console.log('Link created successfully!');
          }}
        />

        {activeLink && (
          <LinkDetailsModal
            link={activeLink}
            isOpen={showLinkDetails}
            onClose={() => closeModal('showLinkDetails')}
          />
        )}

        {activeLink && (
          <ShareModal
            link={activeLink}
            isOpen={showShareModal}
            onClose={() => closeModal('showShareModal')}
          />
        )}

        {activeLink && (
          <SettingsModal
            link={activeLink}
            isOpen={showSettingsModal}
            onClose={() => closeModal('showSettingsModal')}
          />
        )}

        <TemplatesModal
          isOpen={showTemplates}
          onClose={() => closeModal('showTemplates')}
          onSelectTemplate={template => {
            // Handle template selection - you can customize this logic
            console.log('Selected template:', template);
            // Example: Pre-fill create modal with template data
            openModal('showCreateModal');
          }}
        />
      </div>
    </div>
  );
}
