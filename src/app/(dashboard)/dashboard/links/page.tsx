'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, FileText } from 'lucide-react';
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

export default function LinksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modal states
  const [showLinkDetails, setShowLinkDetails] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeLink, setActiveLink] = useState<any>(null);

  // Mock data - replace with real data from your backend
  const linkStats = {
    totalLinks: 5,
    activeLinks: 3,
    totalUploads: 28,
    totalViews: 142,
  };

  const uploadLinks = [
    {
      id: '1',
      name: 'Client Onboarding',
      slug: 'client-onboarding',
      url: 'foldly.com/yourname/client-onboarding',
      status: 'active' as const,
      uploads: 12,
      views: 45,
      lastActivity: '2 hours ago',
      expiresAt: '2025-02-15',
      createdAt: '2025-01-10',
      settings: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '50MB',
        customMessage:
          'Please upload your logo, brand guidelines, and initial project files.',
      },
    },
    {
      id: '2',
      name: 'Team Headshots',
      slug: 'team-headshots',
      url: 'foldly.com/yourname/team-headshots',
      status: 'active' as const,
      uploads: 8,
      views: 23,
      lastActivity: '1 day ago',
      expiresAt: '2025-01-30',
      createdAt: '2025-01-08',
      settings: {
        requireEmail: false,
        allowMultiple: true,
        maxFileSize: '25MB',
        customMessage: 'Upload your professional headshot for the team page.',
      },
    },
    {
      id: '3',
      name: 'Project Assets',
      slug: 'project-assets',
      url: 'foldly.com/yourname/project-assets',
      status: 'paused' as const,
      uploads: 5,
      views: 18,
      lastActivity: '3 days ago',
      expiresAt: '2025-03-01',
      createdAt: '2025-01-05',
      settings: {
        requireEmail: true,
        allowMultiple: true,
        maxFileSize: '100MB',
        customMessage:
          'Share your design files, assets, and reference materials.',
      },
    },
    {
      id: '4',
      name: 'Invoice Documents',
      slug: 'invoice-docs',
      url: 'foldly.com/yourname/invoice-docs',
      status: 'expired' as const,
      uploads: 3,
      views: 12,
      lastActivity: '1 week ago',
      expiresAt: '2025-01-15',
      createdAt: '2025-01-01',
      settings: {
        requireEmail: true,
        allowMultiple: false,
        maxFileSize: '10MB',
        customMessage:
          'Please upload your receipts and invoices for reimbursement.',
      },
    },
  ];

  // Modal handlers
  const handleLinkSelect = (linkId: string) => {
    const link = uploadLinks.find(l => l.id === linkId);
    if (link) {
      setActiveLink(link);
      setShowLinkDetails(true);
    }
  };

  const handleShareLink = (linkId: string) => {
    const link = uploadLinks.find(l => l.id === linkId);
    if (link) {
      setActiveLink(link);
      setShowShareModal(true);
    }
  };

  const handleSettingsLink = (linkId: string) => {
    const link = uploadLinks.find(l => l.id === linkId);
    if (link) {
      setActiveLink(link);
      setShowSettingsModal(true);
    }
  };

  const handleMultiSelect = (linkId: string) => {
    setSelectedLinks(prev =>
      prev.includes(linkId)
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    );
  };

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
              <div className='relative flex-1 lg:w-80'>
                <input
                  type='text'
                  placeholder='Search links...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='w-full px-4 py-2 pl-10 border border-[var(--neutral-200)] rounded-lg 
                           focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                />
                <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                  <svg
                    className='w-4 h-4 text-[var(--neutral-400)]'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`
                  px-4 py-2 border rounded-lg transition-colors font-medium flex items-center gap-2
                  ${
                    showAdvancedFilters
                      ? 'border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]'
                      : 'border-[var(--neutral-200)] text-[var(--neutral-600)] hover:bg-[var(--neutral-50)]'
                  }
                `}
              >
                <Settings className='w-4 h-4' />
                Filters
              </motion.button>
            </div>

            <div className='flex items-center gap-3'>
              {/* Enhanced Bulk Actions Bar */}
              {selectedLinks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className='flex items-center gap-3 px-4 py-3 bg-[var(--primary-subtle)] 
                             text-[var(--primary)] rounded-xl border border-[var(--primary)] shadow-lg'
                >
                  <div className='flex items-center gap-2'>
                    <div className='w-5 h-5 bg-[var(--primary)] rounded text-white flex items-center justify-center text-xs font-bold'>
                      {selectedLinks.length}
                    </div>
                    <span className='text-sm font-medium'>
                      {selectedLinks.length === 1
                        ? 'link selected'
                        : 'links selected'}
                    </span>
                  </div>

                  <div className='w-px h-5 bg-[var(--primary)]/30' />

                  <div className='flex items-center gap-2'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white/50 hover:bg-white/80 rounded-lg text-xs font-medium transition-colors'
                    >
                      <Settings className='w-3 h-3' />
                      Bulk Edit
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white/50 hover:bg-white/80 rounded-lg text-xs font-medium transition-colors'
                    >
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h8a2 2 0 002-2V8m-9 4h4'
                        />
                      </svg>
                      Archive
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center gap-1 px-3 py-1.5 bg-white/50 hover:bg-white/80 rounded-lg text-xs font-medium transition-colors'
                    >
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                        />
                      </svg>
                      Duplicate
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className='flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors'
                    >
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        />
                      </svg>
                      Delete
                    </motion.button>
                  </div>

                  <div className='w-px h-5 bg-[var(--primary)]/30' />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedLinks([])}
                    className='p-1.5 hover:bg-white/50 rounded-lg transition-colors'
                    title='Clear selection'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </motion.button>
                </motion.div>
              )}

              {/* Templates */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTemplates(true)}
                className='flex items-center gap-2 px-4 py-2 border border-[var(--neutral-200)] 
                         text-[var(--neutral-600)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors'
              >
                <FileText className='w-4 h-4' />
                Templates
              </motion.button>

              {/* View Toggle */}
              <div className='flex items-center bg-[var(--neutral-100)] rounded-lg p-1'>
                <button
                  onClick={() => setView('grid')}
                  className={`
                    p-2 rounded-md transition-all duration-200 text-sm font-medium
                    ${
                      view === 'grid'
                        ? 'bg-white shadow-sm text-[var(--primary)]'
                        : 'text-[var(--neutral-500)] hover:text-[var(--quaternary)]'
                    }
                  `}
                >
                  Grid
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`
                    p-2 rounded-md transition-all duration-200 text-sm font-medium
                    ${
                      view === 'list'
                        ? 'bg-white shadow-sm text-[var(--primary)]'
                        : 'text-[var(--neutral-500)] hover:text-[var(--quaternary)]'
                    }
                  `}
                >
                  List
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className='flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white 
                         rounded-xl hover:bg-[var(--primary)]/90 transition-colors font-medium'
              >
                <Plus className='w-5 h-5' />
                Create Link
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='mb-6 bg-white rounded-xl border border-[var(--neutral-200)] p-6'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active</option>
                <option value='paused'>Paused</option>
                <option value='expired'>Expired</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
              >
                <option value='recent'>Recent Activity</option>
                <option value='created'>Date Created</option>
                <option value='uploads'>Most Uploads</option>
                <option value='views'>Most Views</option>
                <option value='name'>Alphabetical</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                Date Range
              </label>
              <input
                type='date'
                className='w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-[var(--quaternary)] mb-2'>
                File Types
              </label>
              <select className='w-full px-3 py-2 border border-[var(--neutral-200)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'>
                <option value='all'>All Types</option>
                <option value='images'>Images Only</option>
                <option value='documents'>Documents Only</option>
                <option value='videos'>Videos Only</option>
              </select>
            </div>
          </div>

          <div className='mt-4 flex items-center justify-between'>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSortBy('recent');
              }}
              className='text-sm text-[var(--neutral-500)] hover:text-[var(--quaternary)] transition-colors'
            >
              Clear Filters
            </button>
            <div className='flex items-center gap-2'>
              <button className='px-4 py-2 text-sm border border-[var(--neutral-200)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors'>
                Export Results
              </button>
              <button className='px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors'>
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Link Templates Modal */}
      {showTemplates && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={() => setShowTemplates(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className='bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-2xl font-bold text-[var(--quaternary)]'>
                Link Templates
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className='p-2 hover:bg-[var(--neutral-50)] rounded-lg transition-colors'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {[
                {
                  name: 'Client Onboarding',
                  description:
                    'Perfect for collecting initial project files from new clients',
                  features: [
                    'Email required',
                    'Multiple files',
                    '50MB limit',
                    'Custom branding',
                  ],
                },
                {
                  name: 'Team Photos',
                  description:
                    'Collect professional headshots from team members',
                  features: [
                    'No email required',
                    'Image files only',
                    '25MB limit',
                    'Auto-resize',
                  ],
                },
                {
                  name: 'Invoice Collection',
                  description:
                    'Secure collection of receipts and financial documents',
                  features: [
                    'Email required',
                    'PDF/images only',
                    '10MB limit',
                    'Auto-organize',
                  ],
                },
                {
                  name: 'Design Assets',
                  description:
                    'Collect design files, mockups, and creative assets',
                  features: [
                    'Multiple files',
                    'Large file support',
                    '100MB limit',
                    'Version control',
                  ],
                },
                {
                  name: 'Portfolio Submissions',
                  description:
                    'Collect portfolio pieces from applicants or freelancers',
                  features: [
                    'Email required',
                    'Multiple formats',
                    '50MB limit',
                    'Deadline setting',
                  ],
                },
                {
                  name: 'Event Photos',
                  description:
                    'Collect photos from events, conferences, or gatherings',
                  features: [
                    'No email required',
                    'Images/videos only',
                    '25MB limit',
                    'Batch upload',
                  ],
                },
              ].map((template, index) => (
                <div
                  key={index}
                  className='border border-[var(--neutral-200)] rounded-xl p-4 hover:border-[var(--primary)] hover:shadow-lg transition-all cursor-pointer group'
                  onClick={() => {
                    setShowTemplates(false);
                    setShowCreateModal(true);
                  }}
                >
                  <h3 className='font-semibold text-[var(--quaternary)] mb-2 group-hover:text-[var(--primary)]'>
                    {template.name}
                  </h3>
                  <p className='text-[var(--neutral-600)] text-sm mb-3'>
                    {template.description}
                  </p>
                  <div className='flex flex-wrap gap-1'>
                    {template.features.map((feature, i) => (
                      <span
                        key={i}
                        className='px-2 py-1 bg-[var(--neutral-100)] text-[var(--neutral-600)] text-xs rounded-full'
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Overview Cards */}
      <motion.div variants={sectionVariants}>
        <LinksOverviewCards data={linkStats} />
      </motion.div>

      {/* Links Section */}
      <motion.div variants={sectionVariants} className='mb-8'>
        {uploadLinks.length === 0 ? (
          <EmptyLinksState onCreateLink={() => setShowCreateModal(true)} />
        ) : (
          <>
            {/* Section Header */}
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-xl font-bold text-[var(--quaternary)]'>
                Your Links ({uploadLinks.length})
              </h2>

              <div className='flex items-center gap-2'>
                <select className='px-3 py-2 bg-white border border-[var(--neutral-200)] rounded-lg text-sm'>
                  <option>All Links</option>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Expired</option>
                </select>
                <select className='px-3 py-2 bg-white border border-[var(--neutral-200)] rounded-lg text-sm'>
                  <option>Recent Activity</option>
                  <option>Most Uploads</option>
                  <option>Most Views</option>
                  <option>Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Links Grid/List */}
            <div
              className={`
              ${
                view === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            `}
            >
              {uploadLinks.map((link, index) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  view={view}
                  index={index}
                  onSelect={handleLinkSelect}
                  isSelected={selectedLink === link.id}
                  onMultiSelect={handleMultiSelect}
                  isMultiSelected={selectedLinks.includes(link.id)}
                  onShare={handleShareLink}
                  onSettings={handleSettingsLink}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Create Link Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateLinkModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false);
              // Refresh links data
            }}
          />
        )}
      </AnimatePresence>

      {/* Link Details Modal */}
      {activeLink && (
        <LinkDetailsModal
          isOpen={showLinkDetails}
          onClose={() => setShowLinkDetails(false)}
          link={activeLink}
        />
      )}

      {/* Share Modal */}
      {activeLink && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          link={activeLink}
        />
      )}

      {/* Settings Modal */}
      {activeLink && (
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          link={activeLink}
        />
      )}
    </motion.div>
  );
}
