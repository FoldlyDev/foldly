'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Link2,
  Eye,
  FileText,
  Clock,
  Users,
  CheckCircle,
  Calendar,
  Globe,
  Lock,
  Mail,
  Shield,
  Hash,
  HardDrive,
  Folder,
  FolderOpen,
  Crown,
  AlertTriangle,
  Package,
  Pencil,
  Upload,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/animate-ui/radix/dialog';
import { CopyButton } from '@/components/core/copy-button';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import type { Link, LinkWithStats } from '@/lib/database/types';
import { useLinkUrl } from '../../hooks/use-link-url';
import { useStorageTracking } from '@/lib/hooks/use-storage-tracking';
import { fetchLinkDetailsWithStatsAction } from '../../lib/actions';
import { formatBytes } from '@/lib/services/storage/utils';

export function LinkDetailsModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal, openSettingsModal } = useModalStore();

  // Get real-time storage and plan data using proper hook interface
  const storageQuery = useStorageTracking();
  const storageInfo = storageQuery.data;
  const refetchStorage = storageQuery.refetch;
  const isStorageLoading = storageQuery.isLoading;
  const planKey = storageInfo?.plan || 'free';

  const isOpen = currentModal === 'link-details';

  // Fetch detailed link stats when modal opens
  const { data: linkWithStats, isLoading } = useQuery({
    queryKey: ['link-details', link?.id],
    queryFn: async () => {
      if (!link?.id) return null;
      const result = await fetchLinkDetailsWithStatsAction(link.id);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || 'Failed to fetch link details');
    },
    enabled: isOpen && !!link?.id,
  });

  // Fetch source folder details for generated links
  const { data: sourceFolder } = useQuery({
    queryKey: ['folder-details', link?.sourceFolderId],
    queryFn: async () => {
      if (!link?.sourceFolderId) return null;
      // For now, we'll just return the folder ID - you can enhance this later
      // to fetch full folder details including name and path
      return { id: link.sourceFolderId, name: 'Source Folder' };
    },
    enabled: isOpen && link?.linkType === 'generated' && !!link?.sourceFolderId,
  });

  // Use the enhanced stats if available, otherwise fall back to the original link data
  const displayLink = linkWithStats || link;

  // Refetch storage data when modal opens to ensure we have the latest info
  useEffect(() => {
    if (isOpen) {
      refetchStorage();
    }
  }, [isOpen, refetchStorage]);

  if (!isOpen || !link) return null;

  // Handle switching from details to settings modal
  const handleEditClick = () => {
    closeModal(); // Close the current modal
    // Small delay to ensure smooth transition
    setTimeout(() => {
      openSettingsModal(link);
    }, 150);
  };

  const getStatusConfig = () => {
    if (!link.isActive) {
      return {
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        dotColor: 'bg-yellow-500',
        text: 'Paused',
      };
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return {
        color: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-500',
        text: 'Expired',
      };
    }

    return {
      color: 'bg-green-50 text-green-700 border-green-200',
      dotColor: 'bg-green-500',
      text: 'Active',
    };
  };

  const statusConfig = getStatusConfig();
  const { displayUrl, fullUrl } = useLinkUrl(link.slug, link.topic);

  // Get accurate statistics from the enhanced data
  const uploadSessions =
    (linkWithStats as LinkWithStats)?.stats?.batchCount || 0;
  const totalItems =
    ((linkWithStats as LinkWithStats)?.stats?.fileCount || 0) +
    ((linkWithStats as LinkWithStats)?.stats?.folderCount || 0);

  // Calculate overall storage usage percentage
  const overallStoragePercentage = storageInfo?.usagePercentage || 0;

  // Determine if user is approaching storage limits
  const isStorageWarning = overallStoragePercentage >= 75;
  const isStorageCritical = overallStoragePercentage >= 90;
  const isStorageExceeded = overallStoragePercentage >= 100;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Collection Link Details: {link.title}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          View analytics and manage your collection link for {link.title}
        </DialogDescription>

        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                <Link2 className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-3'>
                  <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                    {link.title}
                  </h1>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs ${statusConfig.color}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${statusConfig.dotColor} shadow-sm`}
                    />
                    {statusConfig.text}
                  </div>
                </div>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                  Link analytics and management overview
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
          {/* URL Section with Copy - Moved from header */}
          <div className='overview-card'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                <Globe className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs sm:text-sm text-muted-foreground mb-1'>
                    Live URL
                  </p>
                  <code className='text-sm sm:text-base lg:text-lg font-mono font-semibold text-foreground break-all'>
                    {displayUrl}
                  </code>
                </div>
              </div>
              <CopyButton
                value={fullUrl}
                size='sm'
                showText
                variant='default'
                className='premium-button border-0 px-3 sm:px-4 py-2 flex-shrink-0'
              />
            </div>
          </div>

          {/* Key Metrics Grid - Mobile Responsive */}
          <div className='grid grid-cols-2 gap-3 sm:gap-4'>
            {/* Total Items Card - Now shows files + folders */}
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className='relative z-10'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10 self-start'>
                    <Package className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
                  </div>
                  <div className='text-left sm:text-right'>
                    <div className='text-xl sm:text-2xl lg:text-3xl font-bold stats-number'>
                      {totalItems.toLocaleString()}
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>
                      Total Items
                    </div>
                  </div>
                </div>
                <div className='text-xs text-muted-foreground mt-2'>
                  {(
                    (linkWithStats as LinkWithStats)?.stats?.fileCount || 0
                  ).toLocaleString()}{' '}
                  files,{' '}
                  {(
                    (linkWithStats as LinkWithStats)?.stats?.folderCount || 0
                  ).toLocaleString()}{' '}
                  folders
                </div>
              </div>
            </motion.div>

            {/* Upload Sessions Card - Now shows actual batch count */}
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className='relative z-10'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/10 self-start'>
                    <Users className='w-4 h-4 sm:w-5 sm:h-5 text-purple-600' />
                  </div>
                  <div className='text-left sm:text-right'>
                    <div className='text-xl sm:text-2xl lg:text-3xl font-bold stats-number'>
                      {uploadSessions.toLocaleString()}
                    </div>
                    <div className='text-xs sm:text-sm text-muted-foreground'>
                      Upload Sessions
                    </div>
                  </div>
                </div>
                <div className='text-xs text-muted-foreground mt-2'>
                  Times people uploaded to this link
                </div>
              </div>
            </motion.div>
          </div>

          {/* Account Storage Overview - Only show for non-generated links */}
          {storageInfo && link.linkType !== 'generated' && (
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10'>
                    <Crown className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
                  </div>
                  <h3 className='text-lg sm:text-xl font-bold text-foreground'>
                    Account Storage
                  </h3>
                </div>
                <span className='text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-500/10 rounded-full'>
                  {planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan
                </span>
              </div>

            <div className='space-y-3'>
              {/* Overall Storage Usage */}
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Total Usage
                  </span>
                  <span className='text-sm font-bold text-foreground'>
                    {storageInfo ? formatBytes(storageInfo.storageUsed) : '0 B'} /{' '}
                    {storageInfo ? formatBytes(storageInfo.storageLimit) : 'loading...'}
                  </span>
                </div>
                <div className='w-full bg-muted rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${
                      isStorageExceeded
                        ? 'from-red-500 to-red-600'
                        : isStorageCritical
                          ? 'from-orange-500 to-orange-600'
                          : isStorageWarning
                            ? 'from-yellow-500 to-yellow-600'
                            : 'from-blue-500 to-indigo-600'
                    }`}
                    style={{
                      width: `${Math.min(overallStoragePercentage, 100)}%`,
                    }}
                  />
                </div>
                <div className='flex justify-between items-center mt-1'>
                  <span className='text-xs text-muted-foreground'>
                    {/* Files count not available in current storage info */}
                    Files stored
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      isStorageExceeded
                        ? 'text-red-600'
                        : isStorageCritical
                          ? 'text-orange-600'
                          : isStorageWarning
                            ? 'text-yellow-600'
                            : 'text-green-600'
                    }`}
                  >
                    {storageInfo ? formatBytes(storageInfo.availableSpace) : '0 B'} available
                  </span>
                </div>
              </div>

              {/* Storage Warning Message */}
              {isStorageWarning && (
                <div
                  className={`flex items-start gap-2 p-3 rounded-lg ${
                    isStorageExceeded
                      ? 'bg-red-50 border border-red-200'
                      : isStorageCritical
                        ? 'bg-orange-50 border border-orange-200'
                        : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      isStorageExceeded
                        ? 'text-red-600'
                        : isStorageCritical
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                    }`}
                  />
                  <div className='flex-1'>
                    <p
                      className={`text-sm font-medium ${
                        isStorageExceeded
                          ? 'text-red-800'
                          : isStorageCritical
                            ? 'text-orange-800'
                            : 'text-yellow-800'
                      }`}
                    >
                      {isStorageExceeded
                        ? 'Storage limit exceeded!'
                        : isStorageCritical
                          ? 'Storage almost full!'
                          : 'Storage usage high'}
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {isStorageExceeded
                        ? 'Delete some files or upgrade your plan to continue uploading.'
                        : `Only ${storageInfo ? formatBytes(storageInfo.availableSpace) : '0 B'} remaining on your ${planKey} plan.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Link Contribution - For base/custom links */}
              <div className='pt-3 border-t border-gray-200 dark:border-gray-700'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    This link uses
                  </span>
                  <span className='text-sm font-semibold text-foreground'>
                    {formatBytes(link.totalSize)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          )}

          {/* Source Folder Section - Only for Generated Links */}
          {link.linkType === 'generated' && link.sourceFolderId && (
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/10'>
                    <FolderOpen className='w-4 h-4 sm:w-5 sm:h-5 text-indigo-600' />
                  </div>
                  <h3 className='text-lg sm:text-xl font-bold text-foreground'>
                    Source Folder
                  </h3>
                </div>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
                  <ArrowRight className='w-4 h-4 text-muted-foreground flex-shrink-0' />
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-foreground'>
                      Files uploaded via this link go directly to your workspace folder
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      This is a generated link that routes uploads to a specific folder in your workspace.
                    </p>
                  </div>
                </div>

                {/* Upload Statistics for Generated Links */}
                <div className='pt-3 border-t border-gray-200 dark:border-gray-700'>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Files uploaded via this link
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {((linkWithStats as LinkWithStats)?.stats?.fileCount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <span className='text-sm text-muted-foreground'>
                        Upload sessions
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {uploadSessions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Information Grid - Mobile Responsive */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            {/* Basic Information Card */}
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className='flex items-center justify-between mb-4 sm:mb-6'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/10'>
                    <Calendar className='w-4 h-4 sm:w-5 sm:h-5 text-indigo-600' />
                  </div>
                  <h3 className='text-lg sm:text-xl font-bold text-foreground'>
                    Collection Link Details
                  </h3>
                </div>
                <button
                  onClick={handleEditClick}
                  className='modal-icon-btn p-1 sm:p-2 rounded-md sm:rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group cursor-pointer flex items-center justify-center !min-h-[24px] !min-w-[24px] !h-auto !w-auto'
                  title='Edit link settings'
                >
                  <Pencil className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b border-border/50'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Type
                  </span>
                  <span className='text-sm font-semibold text-foreground px-3 py-1 bg-muted/50 rounded-lg flex items-center gap-2'>
                    {link.linkType === 'base' ? (
                      <>Personal Collection Link</>
                    ) : link.linkType === 'generated' ? (
                      <><FolderOpen className='w-3.5 h-3.5' /> Generated Link</>
                    ) : (
                      <>Custom Topic Link</>
                    )}
                  </span>
                </div>

                <div className='flex items-center justify-between py-3 border-b border-border/50'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Created
                  </span>
                  <span className='text-sm font-semibold text-foreground'>
                    {formatDate(link.createdAt)}
                  </span>
                </div>

                {link.expiresAt && (
                  <div className='flex items-center justify-between py-3 border-b border-border/50'>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Expires
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {formatDate(link.expiresAt)}
                    </span>
                  </div>
                )}

                {link.lastUploadAt && (
                  <div className='flex items-center justify-between py-3'>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Last Upload
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {formatDate(link.lastUploadAt)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Security Settings Card */}
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className='flex items-center justify-between mb-4 sm:mb-6'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10'>
                    <Shield className='w-4 h-4 sm:w-5 sm:h-5 text-emerald-600' />
                  </div>
                  <h3 className='text-lg sm:text-xl font-bold text-foreground'>
                    Security & Access
                  </h3>
                </div>
                <button
                  onClick={handleEditClick}
                  className='modal-icon-btn p-1 sm:p-2 rounded-md sm:rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group cursor-pointer flex items-center justify-center !min-h-[24px] !min-w-[24px] !h-auto !w-auto'
                  title='Edit security settings'
                >
                  <Pencil className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
                </button>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b border-border/50'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-muted-foreground' />
                    <span className='text-sm font-medium text-muted-foreground'>
                      Email Required
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      link.requireEmail
                        ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/10'
                        : 'text-muted-foreground bg-muted/50'
                    }`}
                  >
                    {link.requireEmail ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className='flex items-center justify-between py-3'>
                  <div className='flex items-center gap-2'>
                    <Lock className='w-4 h-4 text-muted-foreground' />
                    <span className='text-sm font-medium text-muted-foreground'>
                      Password Protected
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      link.requirePassword
                        ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/10'
                        : 'text-muted-foreground bg-muted/50'
                    }`}
                  >
                    {link.requirePassword ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Description Section - Mobile Responsive */}
          {link.description && (
            <motion.div
              className='overview-card'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className='flex items-center justify-between mb-3 sm:mb-4'>
                <div className='flex items-center gap-2 sm:gap-3'>
                  <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-pink-500/10'>
                    <Hash className='w-4 h-4 sm:w-5 sm:h-5 text-pink-600' />
                  </div>
                  <h3 className='text-lg sm:text-xl font-bold text-foreground'>
                    Description
                  </h3>
                </div>
                <button
                  onClick={handleEditClick}
                  className='modal-icon-btn p-1 sm:p-2 rounded-md sm:rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 group cursor-pointer flex items-center justify-center !min-h-[24px] !min-w-[24px] !h-auto !w-auto'
                  title='Edit description'
                >
                  <Pencil className='w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground group-hover:text-foreground transition-colors' />
                </button>
              </div>
              <p className='text-sm sm:text-base text-muted-foreground leading-relaxed bg-muted/30 p-3 sm:p-4 rounded-lg sm:rounded-xl'>
                {link.description}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
