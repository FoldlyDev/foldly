'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  FileText,
  Download,
  Share2,
  Trash2,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  ArrowRight,
} from 'lucide-react';
import { ContentLoader } from '@/components/ui';
import type { FileUpload, DashboardOverview } from '@/types';

// Simple file interface for UI display (based on FileUpload schema)
interface UIFileDisplay {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: string; // Formatted size string
  readonly uploadedAt: string;
  readonly linkName: string;
  readonly linkId: string;
  readonly downloadCount: number;
  readonly isPublic: boolean;
  readonly url: string;
  readonly thumbnailUrl?: string;
}

interface FilesContainerProps {
  readonly initialData?: {
    readonly files: UIFileDisplay[];
    readonly overview: {
      readonly totalFiles: number;
      readonly totalSize: number;
      readonly totalSizeFormatted: string;
    };
  };
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function FilesContainer({
  initialData,
  isLoading = false,
  error = null,
}: FilesContainerProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const mockFiles: UIFileDisplay[] = initialData?.files || [
    {
      id: '1',
      name: 'project-proposal.pdf',
      type: 'application/pdf',
      size: '2 MB',
      uploadedAt: '2025-01-20T10:30:00Z',
      linkName: 'Client Onboarding',
      linkId: '2',
      downloadCount: 5,
      isPublic: false,
      url: '/files/project-proposal.pdf',
    },
    {
      id: '2',
      name: 'team-photo.jpg',
      type: 'image/jpeg',
      size: '5 MB',
      uploadedAt: '2025-01-19T15:45:00Z',
      linkName: 'Team Headshots',
      linkId: '3',
      downloadCount: 12,
      isPublic: true,
      url: '/files/team-photo.jpg',
      thumbnailUrl: '/files/thumbs/team-photo.jpg',
    },
    {
      id: '3',
      name: 'design-assets.zip',
      type: 'application/zip',
      size: '15 MB',
      uploadedAt: '2025-01-18T09:15:00Z',
      linkName: 'Project Assets',
      linkId: '4',
      downloadCount: 3,
      isPublic: false,
      url: '/files/design-assets.zip',
    },
  ];

  const stats = {
    totalFiles: mockFiles.length,
    totalSize: '22.5 MB',
    totalDownloads: mockFiles.reduce(
      (sum, file) => sum + file.downloadCount,
      0
    ),
  };

  const hasFiles = mockFiles.length > 0;

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const formatFileSize = (size: string | number) => {
    if (typeof size === 'string') return size;
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('zip') || type.includes('archive')) return '📦';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📁';
  };

  const filteredFiles = mockFiles.filter(
    file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.linkName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLink = () => {
    router.push('/dashboard/links?action=create&type=base');
  };

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
              <FolderOpen className='w-6 h-6 sm:w-8 sm:h-8 text-red-500' />
            </div>
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Files Unavailable
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='w-full sm:w-auto px-6 py-2.5 bg-[var(--primary)] text-[var(--quaternary)] rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base'
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
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='space-y-8'
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
                  <div>
                    <h1 className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                      Files & Downloads
                    </h1>
                    <p className='text-[var(--neutral-600)]'>
                      View and manage all files collected through your links
                    </p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <button
                      onClick={handleCreateLink}
                      className='px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2 font-medium'
                    >
                      <Upload className='w-4 h-4' />
                      Create Link
                    </button>
                  </div>
                </div>
              </motion.div>

              {hasFiles ? (
                <>
                  {/* Stats Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className='analytics-grid'
                  >
                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Total Files</h3>
                        <div className='card-icon bg-blue-50 rounded-lg flex items-center justify-center'>
                          <FileText className='w-6 h-6 text-blue-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {stats.totalFiles}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Files collected
                      </p>
                    </div>

                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Storage Used</h3>
                        <div className='card-icon bg-green-50 rounded-lg flex items-center justify-center'>
                          <FolderOpen className='w-6 h-6 text-green-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {stats.totalSize}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Total storage
                      </p>
                    </div>

                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Downloads</h3>
                        <div className='card-icon bg-purple-50 rounded-lg flex items-center justify-center'>
                          <Download className='w-6 h-6 text-purple-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {stats.totalDownloads}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Total downloads
                      </p>
                    </div>
                  </motion.div>

                  {/* Search and Controls */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className='flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between'
                  >
                    <div className='flex-1 max-w-md'>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--neutral-400)]' />
                        <input
                          type='text'
                          placeholder='Search files...'
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className='w-full pl-10 pr-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
                        />
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <button
                        onClick={() =>
                          setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                        }
                        className='px-3 py-2 border border-[var(--neutral-200)] rounded-lg hover:border-[var(--neutral-300)] transition-colors flex items-center gap-2'
                      >
                        {viewMode === 'grid' ? (
                          <List className='w-4 h-4' />
                        ) : (
                          <Grid className='w-4 h-4' />
                        )}
                        {viewMode === 'grid' ? 'List' : 'Grid'}
                      </button>
                    </div>
                  </motion.div>

                  {/* Files List/Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className={`
                      ${
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                          : 'space-y-4'
                      }
                    `}
                  >
                    {filteredFiles.map((file, index) => (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.5 + index * 0.05,
                          duration: 0.5,
                        }}
                        className={`
                          analytics-card hover:shadow-lg transition-shadow cursor-pointer
                          ${viewMode === 'list' ? 'flex items-center gap-4' : ''}
                        `}
                      >
                        <div
                          className={`
                          ${viewMode === 'grid' ? 'text-center mb-4' : 'flex-shrink-0'}
                        `}
                        >
                          <div className='text-4xl mb-2'>
                            {getFileIcon(file.type)}
                          </div>
                        </div>

                        <div
                          className={`${viewMode === 'list' ? 'flex-1' : ''}`}
                        >
                          <h3
                            className={`
                            font-semibold text-[var(--quaternary)] mb-2 truncate
                            ${viewMode === 'grid' ? 'text-center' : ''}
                          `}
                          >
                            {file.name}
                          </h3>

                          <div
                            className={`
                            text-sm text-[var(--neutral-600)] space-y-1
                            ${viewMode === 'grid' ? 'text-center' : ''}
                          `}
                          >
                            <p>Size: {formatFileSize(file.size)}</p>
                            <p>From: {file.linkName}</p>
                            <p>Uploaded: {formatDate(file.uploadedAt)}</p>
                            <p>Downloads: {file.downloadCount}</p>
                          </div>

                          <div
                            className={`
                            flex gap-2 mt-4
                            ${viewMode === 'grid' ? 'justify-center' : 'justify-start'}
                          `}
                          >
                            <button className='px-3 py-1 bg-[var(--primary)] text-white rounded text-xs hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-1'>
                              <Download className='w-3 h-3' />
                              Download
                            </button>
                            <button className='px-3 py-1 bg-[var(--neutral-100)] text-[var(--neutral-600)] rounded text-xs hover:bg-[var(--neutral-200)] transition-colors flex items-center gap-1'>
                              <Share2 className='w-3 h-3' />
                              Share
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className='text-center py-16'>
                    <div className='w-24 h-24 bg-gradient-to-br from-[var(--primary-subtle)] to-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[var(--neutral-200)] shadow-lg'>
                      <FolderOpen className='w-12 h-12 text-[var(--primary)]' />
                    </div>

                    <h2 className='text-2xl font-bold text-[var(--quaternary)] mb-3'>
                      No Files Yet
                    </h2>

                    <p className='text-[var(--neutral-600)] mb-8 leading-relaxed max-w-md mx-auto'>
                      Files will appear here once people start uploading through
                      your collection links. Create your first link to get
                      started!
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 items-center justify-center'>
                      <button
                        onClick={handleCreateLink}
                        className='px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-2 font-medium shadow-lg'
                      >
                        <Upload className='w-5 h-5' />
                        Create Upload Link
                        <ArrowRight className='w-5 h-5' />
                      </button>

                      <button
                        onClick={() => router.push('/dashboard/links')}
                        className='px-6 py-3 text-[var(--neutral-600)] hover:text-[var(--quaternary)] font-medium transition-colors duration-200'
                      >
                        View All Links
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
