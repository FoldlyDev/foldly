'use client';

import { motion } from 'framer-motion';
import {
  Link2,
  Eye,
  FileText,
  Clock,
  Copy,
  Share2,
  Settings,
  Calendar,
  TrendingUp,
  Download,
  Users,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

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
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(link.url || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Mock recent uploads data
  const recentUploads = [
    {
      id: '1',
      fileName: 'brand-guidelines.pdf',
      size: '2.4 MB',
      uploadedAt: '2 hours ago',
      uploaderEmail: 'client@example.com',
    },
    {
      id: '2',
      fileName: 'logo-variations.zip',
      size: '8.7 MB',
      uploadedAt: '1 day ago',
      uploaderEmail: 'design@client.com',
    },
    {
      id: '3',
      fileName: 'project-brief.docx',
      size: '1.2 MB',
      uploadedAt: '2 days ago',
      uploaderEmail: 'manager@client.com',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white'>
        <DialogHeader className='border-b border-[var(--neutral-100)] pb-6'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-[var(--primary-subtle)] rounded-xl flex items-center justify-center'>
                <Link2 className='w-6 h-6 text-[var(--primary)]' />
              </div>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <DialogTitle className='text-2xl font-bold text-[var(--quaternary)]'>
                    {link.name}
                  </DialogTitle>
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}
                    />
                    {statusConfig.text}
                  </div>
                </div>
                <DialogDescription className='text-[var(--neutral-600)] flex items-center gap-2'>
                  <span>{link.url}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopyUrl}
                    className='p-1 rounded-md hover:bg-[var(--neutral-100)] transition-colors'
                  >
                    {copied ? (
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4 text-[var(--neutral-500)]' />
                    )}
                  </motion.button>
                </DialogDescription>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors'
              >
                <Share2 className='w-4 h-4' />
                Share
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='flex items-center gap-2 px-4 py-2 border border-[var(--neutral-200)] text-[var(--neutral-600)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors'
              >
                <Settings className='w-4 h-4' />
                Settings
              </motion.button>
            </div>
          </div>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6'>
          {/* Left Column - Stats and Info */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Key Stats */}
            <div className='bg-[var(--neutral-50)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4'>
                Performance
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Eye className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Total Views
                    </span>
                  </div>
                  <span className='font-bold text-[var(--quaternary)]'>
                    {link.views || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Total Uploads
                    </span>
                  </div>
                  <span className='font-bold text-[var(--quaternary)]'>
                    {link.uploads || 0}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Conversion Rate
                    </span>
                  </div>
                  <span className='font-bold text-green-600'>
                    {((link.uploads || 0 / link.views || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Users className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Unique Visitors
                    </span>
                  </div>
                  <span className='font-bold text-[var(--quaternary)]'>
                    {Math.floor((link.views || 0) * 0.7)}
                  </span>
                </div>
              </div>
            </div>

            {/* Link Details */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4'>
                Link Details
              </h3>
              <div className='space-y-3'>
                <div>
                  <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide'>
                    Created
                  </span>
                  <p className='text-sm text-[var(--neutral-700)]'>
                    {link.createdAt}
                  </p>
                </div>
                <div>
                  <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide'>
                    Expires
                  </span>
                  <p className='text-sm text-[var(--neutral-700)]'>
                    {link.expiresAt}
                  </p>
                </div>
                <div>
                  <span className='text-xs font-medium text-[var(--neutral-500)] uppercase tracking-wide'>
                    Last Activity
                  </span>
                  <p className='text-sm text-[var(--neutral-700)]'>
                    {link.lastActivity}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Summary */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4'>
                Current Settings
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-[var(--neutral-600)]'>
                    Require Email
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${link.requireEmail ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {link.requireEmail ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Multiple Files
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${link.settings?.allowMultiple ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                  >
                    {link.settings?.allowMultiple ? 'Allowed' : 'Single Only'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Max File Size
                    </span>
                  </div>
                  <span className='text-xs px-2 py-1 rounded-full bg-[var(--neutral-100)] text-[var(--neutral-700)]'>
                    {link.settings?.maxFileSize || '50MB'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Recent Uploads */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='font-bold text-[var(--quaternary)]'>
                  Recent Uploads
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='flex items-center gap-2 px-3 py-2 text-sm border border-[var(--neutral-200)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors'
                >
                  <Download className='w-4 h-4' />
                  Download All
                </motion.button>
              </div>

              <div className='space-y-4'>
                {recentUploads.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className='flex items-center justify-between p-4 bg-[var(--neutral-50)] rounded-lg hover:bg-[var(--neutral-100)] transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-[var(--primary-subtle)] rounded-lg flex items-center justify-center'>
                        <FileText className='w-5 h-5 text-[var(--primary)]' />
                      </div>
                      <div>
                        <h4 className='font-medium text-[var(--quaternary)]'>
                          {upload.fileName}
                        </h4>
                        <div className='flex items-center gap-2 text-xs text-[var(--neutral-500)]'>
                          <span>{upload.size}</span>
                          <span>•</span>
                          <span>{upload.uploadedAt}</span>
                          {upload.uploaderEmail && (
                            <>
                              <span>•</span>
                              <span>{upload.uploaderEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className='p-2 rounded-lg hover:bg-white transition-colors'
                    >
                      <Download className='w-4 h-4 text-[var(--neutral-500)]' />
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {recentUploads.length === 0 && (
                <div className='text-center py-12'>
                  <FileText className='w-12 h-12 text-[var(--neutral-300)] mx-auto mb-4' />
                  <h4 className='font-medium text-[var(--neutral-500)] mb-2'>
                    No uploads yet
                  </h4>
                  <p className='text-sm text-[var(--neutral-400)]'>
                    Files uploaded to this link will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Custom Message Preview */}
            {link.settings?.customMessage && (
              <div className='bg-[var(--primary-subtle)] border border-[var(--primary)] rounded-xl p-6'>
                <h3 className='font-bold text-[var(--primary)] mb-3'>
                  Upload Page Message
                </h3>
                <p className='text-[var(--primary)]/80 italic'>
                  "{link.settings.customMessage}"
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='flex items-center justify-center gap-2 p-4 border border-[var(--neutral-200)] rounded-xl hover:bg-[var(--neutral-50)] transition-colors'
              >
                <Copy className='w-5 h-5 text-[var(--neutral-500)]' />
                <span className='font-medium text-[var(--neutral-700)]'>
                  Copy Link
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='flex items-center justify-center gap-2 p-4 border border-[var(--neutral-200)] rounded-xl hover:bg-[var(--neutral-50)] transition-colors'
              >
                <Calendar className='w-5 h-5 text-[var(--neutral-500)]' />
                <span className='font-medium text-[var(--neutral-700)]'>
                  Extend Expiry
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='flex items-center justify-center gap-2 p-4 border border-[var(--neutral-200)] rounded-xl hover:bg-[var(--neutral-50)] transition-colors'
              >
                <TrendingUp className='w-5 h-5 text-[var(--neutral-500)]' />
                <span className='font-medium text-[var(--neutral-700)]'>
                  View Analytics
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
