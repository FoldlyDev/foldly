'use client';

import { motion } from 'framer-motion';
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
  TrendingUp,
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
import type { Link } from '@/lib/database/types';

export function LinkDetailsModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal } = useModalStore();

  const isOpen = currentModal === 'link-details';

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
  const linkUrl = `foldly.com/${link.slug}${link.topic ? `/${link.topic}` : ''}`;

  // Calculate basic metrics from database fields
  const conversionRate =
    link.totalUploads > 0 && link.totalFiles > 0
      ? ((link.totalUploads / link.totalFiles) * 100).toFixed(1)
      : '0.0';

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        <DialogTitle className="sr-only">
          Collection Link Details: {link.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          View analytics and manage your collection link for {link.title}
        </DialogDescription>

        {/* Premium Header with Glass Effect - Standardized Layout */}
        <div className="relative overflow-hidden modal-gradient-slate border-b border-gray-200/50">
          {/* Decorative Background */}
          <div className="modal-decoration-overlay" />
          <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32" />
          
          <div className="relative p-4 sm:p-6 pb-4">
            <div className="text-center mb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 sm:p-4 rounded-2xl modal-icon-blue">
                  <Link2 className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-normal modal-title-gradient-blue mb-2">
                  {link.title}
                </h1>
                <div className="flex justify-center mb-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs ${statusConfig.color}`}>
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} shadow-sm`} />
                    {statusConfig.text}
                  </div>
                </div>
                <div className="flex justify-center">
                  <p className="text-sm sm:text-base text-gray-600 text-center max-w-md">
                    Link analytics and management overview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Analytics Dashboard - Mobile Responsive */}
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] overflow-y-auto pb-20 sm:pb-12">
          {/* URL Section with Copy - Moved from header */}
          <div className="display-card p-3 sm:p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Live URL</p>
                  <code className="text-sm sm:text-base lg:text-lg font-mono font-semibold text-gray-900 break-all">{linkUrl}</code>
                </div>
              </div>
              <CopyButton
                value={`https://${linkUrl}`}
                size='sm'
                showText
                variant='default'
                className='premium-button text-white border-0 px-3 sm:px-4 py-2 flex-shrink-0'
              />
            </div>
          </div>

          {/* Key Metrics Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Files Card */}
            <motion.div 
              className="stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10 self-start">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold stats-number">
                      {link.totalFiles.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Total Files</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 sm:h-2 rounded-full premium-progress" style={{width: '100%'}} />
                </div>
              </div>
            </motion.div>

            {/* Total Uploads Card */}
            <motion.div 
              className="stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-purple-500/10 self-start">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold stats-number">
                      {link.totalUploads.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Upload Sessions</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 sm:h-2 rounded-full premium-progress" style={{width: '85%'}} />
                </div>
              </div>
            </motion.div>

            {/* Storage Used Card */}
            <motion.div 
              className="stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-green-500/10 self-start">
                    <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold stats-number">
                      {formatFileSize(link.totalSize)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Storage Used</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 sm:h-2 rounded-full premium-progress" style={{width: '60%'}} />
                </div>
              </div>
            </motion.div>

            {/* Conversion Rate Card */}
            <motion.div 
              className="stats-card display-card p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-orange-500/10 self-start">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold stats-number">
                      {conversionRate}%
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Conversion Rate</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 sm:h-2 rounded-full premium-progress" style={{width: `${conversionRate}%`}} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Information Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Basic Information Card */}
            <motion.div 
              className="display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-indigo-500/10">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Collection Link Details</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Type</span>
                  <span className="text-sm font-semibold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">
                    {link.linkType === 'base' ? 'Personal Collection Link' : 'Custom Topic Link'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-600">Created</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatDate(link.createdAt)}
                  </span>
                </div>
                
                {link.expiresAt && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Expires</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(link.expiresAt)}
                    </span>
                  </div>
                )}
                
                {link.lastUploadAt && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-600">Last Upload</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(link.lastUploadAt)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Security Settings Card */}
            <motion.div 
              className="display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-500/10">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Security & Access</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Visibility</span>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                    link.isPublic ? 'text-green-700 bg-green-100' : 'text-orange-700 bg-orange-100'
                  }`}>
                    {link.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Email Required</span>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                    link.requireEmail ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'
                  }`}>
                    {link.requireEmail ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Password Protected</span>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                    link.requirePassword ? 'text-green-700 bg-green-100' : 'text-gray-700 bg-gray-100'
                  }`}>
                    {link.requirePassword ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Description Section - Mobile Responsive */}
          {link.description && (
            <motion.div 
              className="display-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-pink-500/10">
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Description</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-gray-50/50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                {link.description}
              </p>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}