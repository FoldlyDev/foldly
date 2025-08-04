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
  Crown,
  AlertTriangle,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/marketing/animate-ui/radix/dialog';
import { CopyButton } from '@/components/ui/core/copy-button';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import type { Link, LinkWithStats } from '@/lib/database/types';
import { useLinkUrl } from '../../hooks/use-link-url';
import { useStorageTracking } from '@/features/workspace/hooks/use-storage-tracking';
import { useUserPlan } from '@/features/workspace/hooks/use-user-plan';
import { fetchLinkDetailsWithStatsAction } from '../../lib/actions';

export function LinkDetailsModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal } = useModalStore();
  
  // Get real-time storage and plan data
  const { storageInfo, refetchStorage, formatSize } = useStorageTracking();
  const { planKey } = useUserPlan();

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
  
  // Use the enhanced stats if available, otherwise fall back to the original link data
  const displayLink = linkWithStats || link;
  
  // Refetch storage data when modal opens to ensure we have the latest info
  useEffect(() => {
    if (isOpen) {
      refetchStorage();
    }
  }, [isOpen, refetchStorage]);

  if (!isOpen || !link) return null;

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
  const uploadSessions = (linkWithStats as LinkWithStats)?.stats?.batchCount || 0;
  const totalItems = ((linkWithStats as LinkWithStats)?.stats?.fileCount || 0) + 
                     ((linkWithStats as LinkWithStats)?.stats?.folderCount || 0);
  
  // Calculate storage usage percentage for this link
  const linkStoragePercentage = storageInfo.storageLimitBytes > 0
    ? Math.min((link.totalSize / storageInfo.storageLimitBytes) * 100, 100)
    : 0;
  
  // Calculate overall storage usage percentage
  const overallStoragePercentage = storageInfo.usagePercentage || 0;
  
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
        className='w-[calc(100vw-1rem)] max-w-sm sm:max-w-2xl lg:max-w-5xl h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] p-0 overflow-hidden'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Collection Link Details: {link.title}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          View analytics and manage your collection link for {link.title}
        </DialogDescription>

        {/* Premium Header with Glass Effect - Standardized Layout */}
        <div className='relative overflow-hidden modal-gradient-slate border-b border-gray-200/50'>
          {/* Decorative Background */}
          <div className='modal-decoration-overlay' />
          <div className='absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32' />

          <div className='relative p-4 sm:p-6 pb-4'>
            <div className='text-center mb-4'>
              <div className='flex justify-center mb-4'>
                <div className='p-3 sm:p-4 rounded-2xl modal-icon-blue'>
                  <Link2 className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
              </div>
              <div className='text-center'>
                <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold leading-normal modal-title-gradient-blue mb-2'>
                  {link.title}
                </h1>
                <div className='flex justify-center mb-2'>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs ${statusConfig.color}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${statusConfig.dotColor} shadow-sm`}
                    />
                    {statusConfig.text}
                  </div>
                </div>
                <div className='flex justify-center'>
                  <p className='text-sm sm:text-base text-gray-600 text-center max-w-md'>
                    Link analytics and management overview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Analytics Dashboard - Mobile Responsive */}
        <div className='p-4 sm:p-6 space-y-6 sm:space-y-8 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] overflow-y-auto pb-20 sm:pb-12'>
          {/* URL Section with Copy - Moved from header */}
          <div className='display-card p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
                <Globe className='w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0' />
                <div className='min-w-0 flex-1'>
                  <p className='text-xs sm:text-sm text-gray-600 mb-1'>
                    Live URL
                  </p>
                  <code className='text-sm sm:text-base lg:text-lg font-mono font-semibold text-gray-900 break-all'>
                    {displayUrl}
                  </code>
                </div>
              </div>
              <CopyButton
                value={fullUrl}
                size='sm'
                showText
                variant='default'
                className='premium-button text-white border-0 px-3 sm:px-4 py-2 flex-shrink-0'
              />
            </div>
          </div>

          {/* Key Metrics Grid - Mobile Responsive */}
          <div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
            {/* Total Items Card - Now shows files + folders */}
            <motion.div
              className='stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden'
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
                    <div className='text-xs sm:text-sm text-gray-600'>
                      Total Items
                    </div>
                  </div>
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  {((linkWithStats as LinkWithStats)?.stats?.fileCount || 0).toLocaleString()} files, {((linkWithStats as LinkWithStats)?.stats?.folderCount || 0).toLocaleString()} folders
                </div>
              </div>
            </motion.div>

            {/* Upload Sessions Card - Now shows actual batch count */}
            <motion.div
              className='stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden'
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
                    <div className='text-xs sm:text-sm text-gray-600'>
                      Upload Sessions
                    </div>
                  </div>
                </div>
                <div className='text-xs text-gray-500 mt-2'>
                  Times people uploaded to this link
                </div>
              </div>
            </motion.div>

            {/* Storage Used Card - Now with real data */}
            <motion.div
              className='stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className='relative z-10'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3'>
                  <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${
                    isStorageExceeded ? 'bg-red-500/10' :
                    isStorageCritical ? 'bg-orange-500/10' :
                    isStorageWarning ? 'bg-yellow-500/10' :
                    'bg-green-500/10'
                  } self-start`}>
                    <HardDrive className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      isStorageExceeded ? 'text-red-600' :
                      isStorageCritical ? 'text-orange-600' :
                      isStorageWarning ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                  </div>
                  <div className='text-left sm:text-right'>
                    <div className='text-xl sm:text-2xl lg:text-3xl font-bold stats-number'>
                      {formatSize(link.totalSize)}
                    </div>
                    <div className='text-xs sm:text-sm text-gray-600'>
                      Link Storage
                    </div>
                  </div>
                </div>
                <div className='text-xs text-gray-500 mb-2'>
                  {linkStoragePercentage.toFixed(1)}% of {formatSize(storageInfo.storageLimitBytes)} limit
                </div>
                <div className='w-full bg-gray-200 rounded-full h-1.5 sm:h-2'>
                  <div
                    className={`h-1.5 sm:h-2 rounded-full premium-progress bg-gradient-to-r ${
                      isStorageExceeded ? 'from-red-500 to-red-600' :
                      isStorageCritical ? 'from-orange-500 to-orange-600' :
                      isStorageWarning ? 'from-yellow-500 to-yellow-600' :
                      'from-green-500 to-green-600'
                    }`}
                    style={{ width: `${linkStoragePercentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Account Storage Overview - New Section */}
          <motion.div
            className='display-card bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10'>
                  <Crown className='w-4 h-4 sm:w-5 sm:h-5 text-blue-600' />
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                  Account Storage
                </h3>
              </div>
              <span className='text-xs sm:text-sm font-semibold text-blue-700 px-2 sm:px-3 py-1 bg-blue-100 rounded-full'>
                {planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan
              </span>
            </div>
            
            <div className='space-y-3'>
              {/* Overall Storage Usage */}
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm font-medium text-gray-700'>Total Usage</span>
                  <span className='text-sm font-bold text-gray-900'>
                    {formatSize(storageInfo.storageUsedBytes)} / {formatSize(storageInfo.storageLimitBytes)}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${
                      isStorageExceeded ? 'from-red-500 to-red-600' :
                      isStorageCritical ? 'from-orange-500 to-orange-600' :
                      isStorageWarning ? 'from-yellow-500 to-yellow-600' :
                      'from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${Math.min(overallStoragePercentage, 100)}%` }}
                  />
                </div>
                <div className='flex justify-between items-center mt-1'>
                  <span className='text-xs text-gray-500'>
                    {storageInfo.filesCount} total files
                  </span>
                  <span className={`text-xs font-medium ${
                    isStorageExceeded ? 'text-red-600' :
                    isStorageCritical ? 'text-orange-600' :
                    isStorageWarning ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {formatSize(storageInfo.remainingBytes)} available
                  </span>
                </div>
              </div>
              
              {/* Storage Warning Message */}
              {isStorageWarning && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  isStorageExceeded ? 'bg-red-50 border border-red-200' :
                  isStorageCritical ? 'bg-orange-50 border border-orange-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    isStorageExceeded ? 'text-red-600' :
                    isStorageCritical ? 'text-orange-600' :
                    'text-yellow-600'
                  }`} />
                  <div className='flex-1'>
                    <p className={`text-sm font-medium ${
                      isStorageExceeded ? 'text-red-800' :
                      isStorageCritical ? 'text-orange-800' :
                      'text-yellow-800'
                    }`}>
                      {isStorageExceeded ? 'Storage limit exceeded!' :
                       isStorageCritical ? 'Storage almost full!' :
                       'Storage usage high'}
                    </p>
                    <p className='text-xs text-gray-600 mt-1'>
                      {isStorageExceeded ? 
                        'Delete some files or upgrade your plan to continue uploading.' :
                        `Only ${formatSize(storageInfo.remainingBytes)} remaining on your ${planKey} plan.`
                      }
                    </p>
                  </div>
                </div>
              )}
              
              {/* Link Contribution */}
              <div className='pt-3 border-t border-gray-200'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>This link uses</span>
                  <span className='text-sm font-semibold text-gray-900'>
                    {formatSize(link.totalSize)} ({linkStoragePercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Information Grid - Mobile Responsive */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
            {/* Basic Information Card */}
            <motion.div
              className='display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/10'>
                  <Calendar className='w-4 h-4 sm:w-5 sm:h-5 text-indigo-600' />
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                  Collection Link Details
                </h3>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                  <span className='text-sm font-medium text-gray-600'>
                    Type
                  </span>
                  <span className='text-sm font-semibold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg'>
                    {link.linkType === 'base'
                      ? 'Personal Collection Link'
                      : 'Custom Topic Link'}
                  </span>
                </div>

                <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                  <span className='text-sm font-medium text-gray-600'>
                    Created
                  </span>
                  <span className='text-sm font-semibold text-gray-900'>
                    {formatDate(link.createdAt)}
                  </span>
                </div>

                {link.expiresAt && (
                  <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                    <span className='text-sm font-medium text-gray-600'>
                      Expires
                    </span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {formatDate(link.expiresAt)}
                    </span>
                  </div>
                )}

                {link.lastUploadAt && (
                  <div className='flex items-center justify-between py-3'>
                    <span className='text-sm font-medium text-gray-600'>
                      Last Upload
                    </span>
                    <span className='text-sm font-semibold text-gray-900'>
                      {formatDate(link.lastUploadAt)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Security Settings Card */}
            <motion.div
              className='display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
                <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10'>
                  <Shield className='w-4 h-4 sm:w-5 sm:h-5 text-emerald-600' />
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                  Security & Access
                </h3>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                  <div className='flex items-center gap-2'>
                    <Eye className='w-4 h-4 text-gray-500' />
                    <span className='text-sm font-medium text-gray-600'>
                      Visibility
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      link.isPublic
                        ? 'text-green-700 bg-green-100'
                        : 'text-orange-700 bg-orange-100'
                    }`}
                  >
                    {link.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                <div className='flex items-center justify-between py-3 border-b border-gray-100'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-gray-500' />
                    <span className='text-sm font-medium text-gray-600'>
                      Email Required
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      link.requireEmail
                        ? 'text-green-700 bg-green-100'
                        : 'text-gray-700 bg-gray-100'
                    }`}
                  >
                    {link.requireEmail ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className='flex items-center justify-between py-3'>
                  <div className='flex items-center gap-2'>
                    <Lock className='w-4 h-4 text-gray-500' />
                    <span className='text-sm font-medium text-gray-600'>
                      Password Protected
                    </span>
                  </div>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                      link.requirePassword
                        ? 'text-green-700 bg-green-100'
                        : 'text-gray-700 bg-gray-100'
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
              className='display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className='flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4'>
                <div className='p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-pink-500/10'>
                  <Hash className='w-4 h-4 sm:w-5 sm:h-5 text-pink-600' />
                </div>
                <h3 className='text-lg sm:text-xl font-bold text-gray-900'>
                  Description
                </h3>
              </div>
              <p className='text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50/50 p-3 sm:p-4 rounded-lg sm:rounded-xl'>
                {link.description}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
