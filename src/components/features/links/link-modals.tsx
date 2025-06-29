'use client';

import { motion } from 'framer-motion';
import {
  Link2,
  Eye,
  FileText,
  Copy,
  Share2,
  Settings,
  Download,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  QrCode,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

// Link Details Modal
interface LinkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: any;
}

export function LinkDetailsModal({
  isOpen,
  onClose,
  link,
}: LinkDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(link.url);
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

  const statusConfig = getStatusConfig(link.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white'>
        <DialogHeader className='border-b border-gray-100 pb-6'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center'>
                <Link2 className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <div className='flex items-center gap-3 mb-2'>
                  <DialogTitle className='text-2xl font-bold text-gray-900'>
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
                <DialogDescription className='text-gray-600 flex items-center gap-2'>
                  <span>{link.url}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopyUrl}
                    className='p-1 rounded-md hover:bg-gray-100 transition-colors'
                  >
                    {copied ? (
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4 text-gray-500' />
                    )}
                  </motion.button>
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6'>
          {/* Left Column - Stats */}
          <div className='lg:col-span-1 space-y-6'>
            <div className='bg-gray-50 rounded-xl p-6'>
              <h3 className='font-bold text-gray-900 mb-4'>Performance</h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Eye className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-600'>Total Views</span>
                  </div>
                  <span className='font-bold text-gray-900'>{link.views}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-600'>Total Uploads</span>
                  </div>
                  <span className='font-bold text-gray-900'>
                    {link.uploads}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-600'>
                      Conversion Rate
                    </span>
                  </div>
                  <span className='font-bold text-green-600'>
                    {((link.uploads / link.views) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Activity */}
          <div className='lg:col-span-2 space-y-6'>
            <div className='bg-white border border-gray-200 rounded-xl p-6'>
              <h3 className='font-bold text-gray-900 mb-4'>Recent Uploads</h3>
              <div className='text-center py-12'>
                <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
                <h4 className='font-medium text-gray-500 mb-2'>
                  No uploads yet
                </h4>
                <p className='text-sm text-gray-400'>
                  Files uploaded to this link will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Share Modal
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: any;
}

export function ShareModal({ isOpen, onClose, link }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl bg-white'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-900'>
            Share Link
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            Share your upload link with clients and collaborators
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 pt-4'>
          {/* Copy Link */}
          <div className='bg-gray-50 rounded-xl p-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>Copy Link</h3>
            <div className='flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg'>
              <span className='flex-1 text-sm text-gray-600 truncate'>
                {link.url}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
          </div>

          {/* QR Code */}
          <div className='bg-gray-50 rounded-xl p-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>QR Code</h3>
            <div className='flex items-center justify-center p-8 bg-white border border-gray-200 rounded-lg'>
              <div className='w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center'>
                <QrCode className='w-16 h-16 text-gray-400' />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='w-full mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Download QR Code
            </motion.button>
          </div>

          {/* Email Invitation */}
          <div className='bg-gray-50 rounded-xl p-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>
              Send Email Invitation
            </h3>
            <div className='space-y-3'>
              <input
                type='email'
                placeholder='client@example.com'
                className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
              <textarea
                rows={3}
                placeholder='Add a personal message...'
                className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Mail className='w-4 h-4' />
                Send Invitation
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: any;
}

export function SettingsModal({ isOpen, onClose, link }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl bg-white'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-gray-900'>
            Link Settings
          </DialogTitle>
          <DialogDescription className='text-gray-600'>
            Configure your upload link settings and restrictions
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 pt-4'>
          {/* Basic Settings */}
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Link Name
              </label>
              <input
                type='text'
                defaultValue={link.name}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Custom Message
              </label>
              <textarea
                rows={3}
                defaultValue={link.settings.customMessage}
                className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              />
            </div>
          </div>

          {/* Upload Restrictions */}
          <div className='bg-gray-50 rounded-xl p-6'>
            <h3 className='font-semibold text-gray-900 mb-4'>
              Upload Restrictions
            </h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <span className='font-medium text-gray-700'>
                    Require Email
                  </span>
                  <p className='text-sm text-gray-500'>
                    Collect uploader email addresses
                  </p>
                </div>
                <input
                  type='checkbox'
                  defaultChecked={link.settings.requireEmail}
                  className='w-5 h-5'
                />
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <span className='font-medium text-gray-700'>
                    Allow Multiple Files
                  </span>
                  <p className='text-sm text-gray-500'>
                    Let users upload multiple files at once
                  </p>
                </div>
                <input
                  type='checkbox'
                  defaultChecked={link.settings.allowMultiple}
                  className='w-5 h-5'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Maximum File Size
                </label>
                <select className='w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                  <option value='10MB'>10 MB</option>
                  <option value='25MB'>25 MB</option>
                  <option value='50MB'>50 MB</option>
                  <option value='100MB'>100 MB</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className='flex items-center gap-3 pt-4'>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              Save Changes
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className='px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
