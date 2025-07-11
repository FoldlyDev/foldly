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
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import type { Link } from '@/lib/supabase/types';

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
        className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <DialogHeader>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-center gap-4 flex-1 min-w-0'>
              <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0'>
                <Link2 className='w-6 h-6 text-blue-600' />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3 mb-2'>
                  <DialogTitle className='text-xl font-bold text-[var(--quaternary)] truncate'>
                    {link.title}
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
                <div className='text-[var(--neutral-600)] flex items-center gap-2 min-w-0'>
                  <span className='truncate'>{linkUrl}</span>
                  <AnimatedCopyButton
                    onCopy={async () => {
                      await navigator.clipboard.writeText(`https://${linkUrl}`);
                    }}
                    variant='ghost'
                    size='sm'
                    className='text-gray-500 hover:text-gray-700 flex-shrink-0'
                    iconSize='w-4 h-4'
                  />
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='pt-6 space-y-6'>
          {/* Statistics */}
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-[var(--neutral-50)] rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                <span className='text-2xl font-bold text-[var(--quaternary)]'>
                  {link.totalFiles.toLocaleString()}
                </span>
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>
                Total Files
              </div>
            </div>

            <div className='text-center p-4 bg-[var(--neutral-50)] rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Users className='w-4 h-4 text-[var(--neutral-500)]' />
                <span className='text-2xl font-bold text-[var(--quaternary)]'>
                  {link.totalUploads.toLocaleString()}
                </span>
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>
                Total Uploads
              </div>
            </div>

            <div className='text-center p-4 bg-[var(--neutral-50)] rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <HardDrive className='w-4 h-4 text-[var(--neutral-500)]' />
                <span className='text-2xl font-bold text-[var(--quaternary)]'>
                  {formatFileSize(link.totalSize)}
                </span>
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>
                Total Size
              </div>
            </div>

            <div className='text-center p-4 bg-[var(--neutral-50)] rounded-lg'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <TrendingUp className='w-4 h-4 text-green-600' />
                <span className='text-2xl font-bold text-green-600'>
                  {conversionRate}%
                </span>
              </div>
              <div className='text-xs text-[var(--neutral-500)]'>
                Upload Rate
              </div>
            </div>
          </div>

          {/* Link Information */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Basic Information */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Calendar className='w-5 h-5 text-[var(--neutral-500)]' />
                Basic Information
              </h3>

              <div className='space-y-4'>
                <div>
                  <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                    Type
                  </span>
                  <p className='text-sm text-[var(--neutral-700)] capitalize'>
                    {link.linkType}
                  </p>
                </div>

                {link.description && (
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Description
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {link.description}
                    </p>
                  </div>
                )}

                <div>
                  <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                    Created
                  </span>
                  <p className='text-sm text-[var(--neutral-700)]'>
                    {formatDate(link.createdAt)}
                  </p>
                </div>

                {link.expiresAt && (
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Expires
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {formatDate(link.expiresAt)}
                    </p>
                  </div>
                )}

                {link.lastUploadAt && (
                  <div>
                    <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide block mb-1'>
                      Last Upload
                    </span>
                    <p className='text-sm text-[var(--neutral-700)]'>
                      {formatDate(link.lastUploadAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Security & Settings */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Shield className='w-5 h-5 text-[var(--neutral-500)]' />
                Security & Settings
              </h3>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-[var(--neutral-700)]'>
                    Public Access
                  </span>
                  <div
                    className={`flex items-center gap-1 ${link.isPublic ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {link.isPublic ? (
                      <>
                        <Globe className='w-4 h-4' />
                        <span className='text-sm font-medium'>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className='w-4 h-4' />
                        <span className='text-sm font-medium'>Private</span>
                      </>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm text-[var(--neutral-700)]'>
                    Email Required
                  </span>
                  <div
                    className={`flex items-center gap-1 ${link.requireEmail ? 'text-orange-600' : 'text-gray-600'}`}
                  >
                    <Mail className='w-4 h-4' />
                    <span className='text-sm font-medium'>
                      {link.requireEmail ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm text-[var(--neutral-700)]'>
                    Password Protected
                  </span>
                  <div
                    className={`flex items-center gap-1 ${link.requirePassword ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    <Lock className='w-4 h-4' />
                    <span className='text-sm font-medium'>
                      {link.requirePassword ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className='border-t border-[var(--neutral-100)] pt-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm text-[var(--neutral-700)]'>
                      File Limit
                    </span>
                    <span className='text-sm font-medium text-[var(--quaternary)]'>
                      {link.maxFiles.toLocaleString()}
                    </span>
                  </div>

                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-[var(--neutral-700)]'>
                      Max File Size
                    </span>
                    <span className='text-sm font-medium text-[var(--quaternary)]'>
                      {formatFileSize(link.maxFileSize)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branding (if enabled) */}
          {link.brandEnabled && (
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Hash className='w-5 h-5 text-[var(--neutral-500)]' />
                Branding
              </h3>

              <div className='flex items-center gap-4'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-[var(--neutral-700)]'>
                    Brand Color:
                  </span>
                  <div
                    className='w-6 h-6 rounded border border-[var(--neutral-200)]'
                    style={{ backgroundColor: link.brandColor || '#6c47ff' }}
                  />
                  <span className='text-sm font-mono text-[var(--neutral-600)]'>
                    {link.brandColor || '#6c47ff'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
