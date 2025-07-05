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
} from '@/components/animate-ui/radix/dialog';
import { AnimatedCopyButton } from '@/components/ui';

// Use centralized types instead of inline interface
import type { LinkData } from '../../types';

interface LinkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData;
}

export function LinkDetailsModal({
  isOpen,
  onClose,
  link,
}: LinkDetailsModalProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          dotColor: 'bg-green-500',
          text: 'Active',
        };
      case 'paused':
        return {
          color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          dotColor: 'bg-yellow-500',
          text: 'Paused',
        };
      case 'expired':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          dotColor: 'bg-red-500',
          text: 'Expired',
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          dotColor: 'bg-gray-500',
          text: 'Unknown',
        };
    }
  };

  const statusConfig = getStatusConfig(link.status || 'active');
  const linkUrl = `https://${link.url}`;
  const conversionRate =
    link.views > 0 ? ((link.uploads / link.views) * 100).toFixed(1) : '0.0';
  const uniqueVisitors = Math.floor(link.views * 0.7); // Estimate based on typical web analytics

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-5xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <DialogHeader>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
            <div className='flex items-center gap-4 flex-1 min-w-0'>
              <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0'>
                <Link2 className='w-6 h-6 text-blue-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2'>
                  <DialogTitle className='text-xl font-bold text-[var(--quaternary)] truncate'>
                    {link.name}
                  </DialogTitle>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border flex-shrink-0 ${statusConfig.color}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                    />
                    {statusConfig.text}
                  </div>
                </div>
                <DialogDescription className='text-[var(--neutral-600)] flex items-center gap-2 min-w-0'>
                  <span className='truncate'>{linkUrl}</span>
                  <AnimatedCopyButton
                    onCopy={async () => {
                      await navigator.clipboard.writeText(linkUrl);
                    }}
                    variant='ghost'
                    size='sm'
                    className='text-gray-500 hover:text-gray-700 flex-shrink-0'
                    iconSize='w-4 h-4'
                  />
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='pt-6 space-y-6'>
          {/* Link Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Basic Information with Metrics */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-6 flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-[var(--neutral-500)]' />
                Basic Information
              </h3>

              <div className='space-y-6'>
                {/* Metrics Grid */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
                    <div className='flex items-center justify-center gap-1 mb-1'>
                      <Eye className='w-4 h-4 text-[var(--neutral-500)]' />
                      <span className='text-2xl font-bold text-[var(--quaternary)]'>
                        {link.views.toLocaleString()}
                      </span>
                    </div>
                    <div className='text-xs text-[var(--neutral-500)]'>
                      Total Views
                    </div>
                  </div>

                  <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
                    <div className='flex items-center justify-center gap-1 mb-1'>
                      <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                      <span className='text-2xl font-bold text-[var(--quaternary)]'>
                        {link.uploads.toLocaleString()}
                      </span>
                    </div>
                    <div className='text-xs text-[var(--neutral-500)]'>
                      Total Uploads
                    </div>
                  </div>

                  <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
                    <div className='flex items-center justify-center gap-1 mb-1'>
                      <Users className='w-4 h-4 text-[var(--neutral-500)]' />
                      <span className='text-2xl font-bold text-[var(--quaternary)]'>
                        {uniqueVisitors.toLocaleString()}
                      </span>
                    </div>
                    <div className='text-xs text-[var(--neutral-500)]'>
                      Unique Visitors
                    </div>
                  </div>

                  <div className='text-center p-3 bg-[var(--neutral-50)] rounded-lg'>
                    <div className='flex items-center justify-center gap-1 mb-1'>
                      <TrendingUp className='w-4 h-4 text-green-600' />
                      <span className='text-2xl font-bold text-green-600'>
                        {conversionRate}%
                      </span>
                    </div>
                    <div className='text-xs text-[var(--neutral-500)]'>
                      Conversion Rate
                    </div>
                  </div>
                </div>

                {/* Basic Details */}
                <div className='space-y-4 pt-2 border-t border-[var(--neutral-100)]'>
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Created
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {link.createdAt}
                    </p>
                  </div>
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Expires
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {link.expiresAt || 'No expiry date'}
                    </p>
                  </div>
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Last Activity
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {link.lastActivity}
                    </p>
                  </div>
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Link Type
                    </span>
                    <p className='text-sm text-[var(--neutral-700)] capitalize'>
                      {link.linkType === 'base'
                        ? 'Personal Collection'
                        : 'Topic Collection'}
                    </p>
                  </div>
                  {link.topic && (
                    <div>
                      <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                        Topic
                      </span>
                      <p className='text-sm text-[var(--neutral-700)]'>
                        {link.topic}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security & Access */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-6 flex items-center gap-2'>
                <Shield className='w-5 h-5 text-[var(--neutral-500)]' />
                Security & Access
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {link.isPublic ? (
                      <Globe className='w-4 h-4 text-green-600' />
                    ) : (
                      <Lock className='w-4 h-4 text-[var(--neutral-600)]' />
                    )}
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Visibility
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      link.isPublic
                        ? 'bg-green-50 text-green-700'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    }`}
                  >
                    {link.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Require Email
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      link.requireEmail
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    }`}
                  >
                    {link.requireEmail ? 'Required' : 'Optional'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Lock className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Password Protected
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      link.requirePassword
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    }`}
                  >
                    {link.requirePassword ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Folder className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Auto-organize Files
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      link.autoCreateFolders
                        ? 'bg-green-50 text-green-700'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    }`}
                  >
                    {link.autoCreateFolders ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Settings */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-6 flex items-center gap-2'>
                <HardDrive className='w-5 h-5 text-[var(--neutral-500)]' />
                Upload Settings
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Hash className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Max Files
                    </span>
                  </div>
                  <span className='text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-700)] font-medium'>
                    {link.maxFiles || 'Unlimited'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <HardDrive className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Max File Size
                    </span>
                  </div>
                  <span className='text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-700)] font-medium'>
                    {Math.round(link.maxFileSize / (1024 * 1024))}MB
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Multiple Files
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      link.settings?.allowMultiple
                        ? 'bg-green-50 text-green-700'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-700)]'
                    }`}
                  >
                    {link.settings?.allowMultiple ? 'Allowed' : 'Single Only'}
                  </span>
                </div>
                {link.allowedFileTypes && link.allowedFileTypes.length > 0 && (
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-2'>
                      Allowed File Types
                    </span>
                    <div className='flex flex-wrap gap-1'>
                      {link.allowedFileTypes.map(type => (
                        <span
                          key={type}
                          className='text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium'
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Message */}
            {link.settings?.customMessage && (
              <div className='bg-blue-50 border border-blue-200 rounded-xl p-6'>
                <h3 className='font-bold text-blue-900 mb-4 flex items-center gap-2'>
                  <FileText className='w-5 h-5 text-blue-600' />
                  Upload Page Message
                </h3>
                <p className='text-blue-800 text-sm italic leading-relaxed'>
                  "{link.settings.customMessage}"
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
