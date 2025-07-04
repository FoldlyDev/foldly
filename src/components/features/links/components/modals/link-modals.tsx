'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Link2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Globe,
  Shield,
  Settings,
  FolderPlus,
  HardDrive,
  Users,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  HelpCircle,
  QrCode,
  FileText,
  TrendingUp,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  Upload,
  Calendar,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/radix/dialog';
import { ActionButton } from '@/components/ui/action-button';
import { CopyButton, InlineCopy } from '@/components/ui/copy-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';

// Import centralized types instead of defining our own
import type { LinkData } from '../../types';
import {
  useLinksListStore,
  useLinksModalsStore,
} from '../../hooks/use-links-composite';

// Helper Components
interface HelpPopoverProps {
  title: string;
  description: string;
  className?: string;
}

function HelpPopover({ title, description, className = '' }: HelpPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex items-center justify-center text-[var(--neutral-400)] hover:text-[var(--neutral-600)] transition-colors ${className}`}
          type='button'
        >
          <HelpCircle className='w-4 h-4' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-80 bg-white border border-[var(--neutral-200)] shadow-lg'
        side='top'
      >
        <div className='space-y-2'>
          <h4 className='font-semibold text-sm text-[var(--quaternary)]'>
            {title}
          </h4>
          <div className='text-sm text-[var(--neutral-600)] leading-relaxed whitespace-pre-line'>
            {description}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Animated Select Component
interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface AnimatedSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

function AnimatedSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
}: AnimatedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-white text-left cursor-pointer flex items-center justify-between'
        whileTap={{ scale: 0.98 }}
        whileHover={{ borderColor: 'var(--primary)' }}
      >
        <span
          className={
            selectedOption
              ? 'text-[var(--quaternary)]'
              : 'text-[var(--neutral-500)]'
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.svg
          className='w-4 h-4 text-[var(--neutral-400)]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className='absolute z-50 w-full mt-1 bg-white border border-[var(--neutral-200)] rounded-md shadow-lg max-h-60 overflow-y-auto'
          >
            {options.map(option => (
              <motion.button
                key={option.value}
                type='button'
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className='w-full px-3 py-2 text-left text-sm hover:bg-[var(--neutral-50)] focus:bg-[var(--neutral-50)] focus:outline-none border-none bg-transparent cursor-pointer'
                whileHover={{ backgroundColor: 'var(--neutral-50)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex flex-col'>
                  <span className='font-medium text-[var(--quaternary)]'>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className='text-xs text-[var(--neutral-500)]'>
                      {option.description}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

// Link Details Modal
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
  // Get real-time data from store
  const { links } = useLinksListStore();
  const currentLink = links.find(l => l.id === link.id) || link; // Fallback to prop if not found

  const linkUrl = `https://${currentLink.url}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='top'
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      >
        <DialogHeader className='border-b border-[var(--neutral-100)] pb-6'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 bg-[var(--primary-subtle)] rounded-xl flex items-center justify-center'>
                <Link2 className='w-6 h-6 text-[var(--primary)]' />
              </div>
              <div>
                <div className='flex items-center gap-3 mb-2 flex-wrap'>
                  <DialogTitle className='text-2xl font-bold text-[var(--quaternary)]'>
                    {currentLink.name}
                  </DialogTitle>
                  <StatusBadge status={currentLink.status} size='md' />
                </div>
                <DialogDescription className='text-[var(--neutral-600)] flex items-center gap-2 flex-wrap'>
                  <span className='break-all'>{currentLink.url}</span>
                  <InlineCopy value={linkUrl} />
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6'>
          {/* Left Column - Configuration & Security */}
          <div className='space-y-6'>
            {/* Link Type & Visibility */}
            <div className='bg-[var(--neutral-50)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Settings className='w-5 h-5' />
                Link Configuration
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Link2 className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Link Type
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {currentLink.linkType === 'base' ? (
                      <div className='flex items-center gap-1 px-2 py-1 bg-[var(--primary-subtle)] rounded-full text-xs font-medium'>
                        <Link2 className='w-3 h-3 text-[var(--primary)]' />
                        <span className='text-[var(--primary-dark)] font-semibold'>
                          Base Collection
                        </span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-1 px-2 py-1 bg-[var(--secondary-subtle)] rounded-full text-xs font-medium'>
                        <Link2 className='w-3 h-3 text-[var(--secondary)]' />
                        <span className='text-[var(--secondary-dark)] font-semibold capitalize'>
                          {currentLink.topic?.replace('-', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {currentLink.isPublic ? (
                      <Globe className='w-4 h-4 text-emerald-600' />
                    ) : (
                      <EyeOff className='w-4 h-4 text-orange-600' />
                    )}
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Visibility
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      currentLink.isPublic
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {currentLink.isPublic ? 'Public' : 'Private'}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className='bg-[var(--neutral-50)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Security & Access
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Mail className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Email Required
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      currentLink.requireEmail
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {currentLink.requireEmail ? 'Required' : 'No'}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Lock className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Password Protection
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      link.requirePassword
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {link.requirePassword ? 'Protected' : 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* File & Upload Limits */}
            <div className='bg-[var(--neutral-50)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <HardDrive className='w-5 h-5' />
                Upload Limits
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Max Files
                    </span>
                  </div>
                  <span className='font-bold text-[var(--quaternary)]'>
                    {link.maxFiles}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <HardDrive className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Max File Size
                    </span>
                  </div>
                  <span className='font-bold text-[var(--quaternary)]'>
                    {(link.maxFileSize / (1024 * 1024)).toFixed(0)}MB
                  </span>
                </div>

                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Allowed Types
                    </span>
                  </div>
                  <div className='text-right'>
                    {link.allowedFileTypes.includes('*') ? (
                      <span className='text-sm font-medium text-[var(--success-green)]'>
                        All file types
                      </span>
                    ) : (
                      <div className='flex flex-wrap gap-1 justify-end max-w-32'>
                        {link.allowedFileTypes
                          .slice(0, 3)
                          .map((type, index) => (
                            <span
                              key={index}
                              className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded'
                            >
                              {type.replace('*', '').replace('/', '')}
                            </span>
                          ))}
                        {link.allowedFileTypes.length > 3 && (
                          <span className='text-xs text-[var(--neutral-500)]'>
                            +{link.allowedFileTypes.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <FolderPlus className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Auto-create Folders
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      link.autoCreateFolders
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {link.autoCreateFolders ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Performance & Activity */}
          <div className='space-y-6'>
            {/* Performance Stats */}
            <div className='bg-[var(--neutral-50)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
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
                    {link.views}
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
                    {link.uploads}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4 text-[var(--neutral-500)]' />
                    <span className='text-sm text-[var(--neutral-600)]'>
                      Conversion Rate
                    </span>
                  </div>
                  <span className='font-bold text-[var(--success-green)]'>
                    {link.views > 0
                      ? ((link.uploads / link.views) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className='bg-white border border-[var(--neutral-200)] rounded-xl p-6'>
              <h3 className='font-bold text-[var(--quaternary)] mb-4 flex items-center gap-2'>
                <Users className='w-5 h-5' />
                Recent Uploads
              </h3>
              <div className='text-center py-12'>
                <FileText className='w-12 h-12 text-[var(--neutral-300)] mx-auto mb-4' />
                <h4 className='font-medium text-[var(--neutral-500)] mb-2'>
                  No uploads yet
                </h4>
                <p className='text-sm text-[var(--neutral-400)]'>
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
  link: LinkData;
}

export function ShareModal({ isOpen, onClose, link }: ShareModalProps) {
  const linkUrl = `https://${link.url}`;
  const shareText = `Check out this file collection link: ${link.name}`;

  const socialShareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(linkUrl)}`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkUrl)}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkUrl)}`,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${linkUrl}`)}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-2xl bg-white border border-[var(--neutral-200)]'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        <DialogHeader className='text-center'>
          <DialogTitle className='text-xl font-bold text-[var(--quaternary)]'>
            Share &quot;{link.name}&quot;
          </DialogTitle>
          <DialogDescription className='text-[var(--neutral-600)]'>
            Share this link with others to let them upload files
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 pt-4'>
          {/* URL Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Link URL
            </label>
            <div className='flex items-center gap-2 p-3 bg-[var(--neutral-50)] border border-[var(--neutral-200)] rounded-lg'>
              <span className='flex-1 text-sm text-[var(--neutral-700)] break-all'>
                {linkUrl}
              </span>
              <CopyButton
                value={linkUrl}
                size='sm'
                showText
                variant='outline'
                className='flex-shrink-0'
              />
            </div>
          </div>

          {/* QR Code Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              QR Code
            </label>
            <div className='flex items-center justify-center p-6 bg-[var(--neutral-50)] border border-[var(--neutral-200)] rounded-lg'>
              <div className='text-center'>
                <QrCode className='w-16 h-16 text-[var(--neutral-400)] mx-auto mb-2' />
                <p className='text-sm text-[var(--neutral-500)]'>
                  QR code will be generated here
                </p>
              </div>
            </div>
          </div>

          {/* Social Share Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Share on Social Media
            </label>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              {socialShareLinks.map(social => {
                const IconComponent = social.icon;
                return (
                  <ActionButton
                    key={social.name}
                    variant='outline'
                    size='default'
                    motionType='subtle'
                    onClick={() => handleSocialShare(social.url)}
                    className={`flex flex-col items-center gap-2 p-4 h-auto ${social.bgColor}`}
                  >
                    <IconComponent className={`w-5 h-5 ${social.color}`} />
                    <span className='text-xs font-medium'>{social.name}</span>
                  </ActionButton>
                );
              })}
            </div>
          </div>

          {/* Email Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Share via Email
            </label>
            <ActionButton
              variant='outline'
              size='default'
              motionType='subtle'
              onClick={() => {
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(`File Collection: ${link.name}`)}&body=${encodeURIComponent(`${shareText}\n\n${linkUrl}`)}`;
                window.location.href = mailtoUrl;
              }}
              className='w-full flex items-center justify-center gap-2'
            >
              <Mail className='w-4 h-4' />
              Open Email Client
            </ActionButton>
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
  link: LinkData;
}

export function SettingsModal({ isOpen, onClose, link }: SettingsModalProps) {
  // Connect to Zustand stores for real data operations
  const { updateLink } = useLinksListStore();
  const { setModalLoading, setModalError } = useLinksModalsStore();

  const [settings, setSettings] = useState({
    // Visibility and Security
    isPublic: link.isPublic,
    requireEmail: link.requireEmail ?? false,
    requirePassword: link.requirePassword ?? false,
    password: '',
    expiresAt: link.expiresAt,

    // File and Upload Limits
    maxFiles: link.maxFiles,
    maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
    allowedFileTypes: link.allowedFileTypes.join(', '),

    // Organization Settings
    autoCreateFolders: link.autoCreateFolders,

    // Legacy settings
    allowMultiple: link.settings?.allowMultiple ?? false,
    customMessage: link.settings?.customMessage || '',
  });

  // File type options for dropdown
  const fileTypeOptions = [
    {
      value: '*',
      label: 'All File Types',
      description: 'Accept any file type',
    },
    {
      value: 'image/*',
      label: 'Images Only',
      description: 'JPG, PNG, GIF, WebP, etc.',
    },
    {
      value: '.pdf,.doc,.docx,.txt,.rtf',
      label: 'Documents',
      description: 'PDF, Word, Text files',
    },
    {
      value: '.xlsx,.xls,.csv',
      label: 'Spreadsheets',
      description: 'Excel, CSV files',
    },
    {
      value: '.pptx,.ppt',
      label: 'Presentations',
      description: 'PowerPoint files',
    },
    {
      value: '.zip,.rar,.7z,.tar.gz',
      label: 'Archives',
      description: 'Compressed files',
    },
    {
      value: '.mp3,.wav,.aac,.flac,.m4a',
      label: 'Audio Files',
      description: 'Music and audio',
    },
    {
      value: '.mp4,.avi,.mov,.wmv,.mkv',
      label: 'Video Files',
      description: 'Video content',
    },
    {
      value: '.js,.ts,.html,.css,.py,.java,.cpp',
      label: 'Code Files',
      description: 'Programming files',
    },
  ];

  // File size options for dropdown
  const fileSizeOptions: SelectOption[] = [
    { value: '1', label: '1 MB', description: 'Small files only' },
    { value: '5', label: '5 MB', description: 'Standard documents' },
    { value: '10', label: '10 MB', description: 'Images and docs' },
    { value: '25', label: '25 MB', description: 'High-res images' },
    { value: '50', label: '50 MB', description: 'Large presentations' },
    { value: '100', label: '100 MB', description: 'Video clips' },
    { value: '250', label: '250 MB', description: 'Large video files' },
    { value: '500', label: '500 MB', description: 'Very large files' },
    { value: '1000', label: '1 GB', description: 'Maximum size' },
  ];

  const handleSaveSettings = async () => {
    try {
      setModalLoading(true);
      setModalError(null);

      // Convert UI settings back to LinkData format
      const updatedSettings = {
        isPublic: settings.isPublic,
        requireEmail: settings.requireEmail,
        requirePassword: settings.requirePassword,
        maxFiles: settings.maxFiles,
        maxFileSize: settings.maxFileSize * 1024 * 1024, // Convert MB back to bytes
        allowedFileTypes: settings.allowedFileTypes
          .split(',')
          .map(type => type.trim())
          .filter(Boolean),
        autoCreateFolders: settings.autoCreateFolders,
        settings: {
          ...link.settings,
          allowMultiple: settings.allowMultiple,
          customMessage: settings.customMessage || undefined,
        },
      };

      // Update link in store
      updateLink(link.id, updatedSettings);

      console.log('✅ Settings saved successfully:', updatedSettings);
      onClose();
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      setModalError('Failed to save settings. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const isBaseLink = link.linkType === 'base';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className='max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-[var(--quaternary)] flex items-center gap-2'>
            <Settings className='w-5 h-5' />
            Link Settings
          </DialogTitle>
          <DialogDescription className='text-[var(--neutral-600)]'>
            Configure how &quot;{link.name}&quot; works for uploaders
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6'>
          {/* Left Column - Visibility & Security */}
          <div className='space-y-6'>
            {/* Visibility Settings */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
                <Globe className='w-4 h-4' />
                Visibility & Access
              </h3>

              <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg transition-all duration-300 ease-in-out'>
                <div className='space-y-3'>
                  <label className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-[var(--quaternary)]'>
                          Public Access
                        </span>
                        <HelpPopover
                          title='Public vs Private Access'
                          description="Public: Users can see all uploaded files from everyone.

Private: Users only see their own uploads - others' files stay hidden."
                        />
                      </div>
                      <p className='text-xs text-[var(--neutral-500)]'>
                        When private, uploaders cannot see each other's files
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.isPublic}
                      onCheckedChange={(checked: boolean) =>
                        setSettings(prev => ({
                          ...prev,
                          isPublic: checked,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className='space-y-3'>
                  <label className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-[var(--quaternary)]'>
                          Require Email Address
                        </span>
                        <HelpPopover
                          title='Email Collection'
                          description='Collects uploader email addresses before upload.

• Track who uploaded what
• Send notifications  
• Export for follow-up'
                        />
                      </div>
                      <p className='text-xs text-[var(--neutral-500)]'>
                        Collect uploader contact info for tracking and follow-up
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.requireEmail}
                      onCheckedChange={(checked: boolean) =>
                        setSettings(prev => ({
                          ...prev,
                          requireEmail: checked,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className='space-y-3'>
                  <label className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-[var(--quaternary)]'>
                          Password Protection
                        </span>
                        <HelpPopover
                          title='Password Protection'
                          description='Requires password before accessing upload page.

Share both:
• The link URL
• The password'
                        />
                      </div>
                      <p className='text-xs text-[var(--neutral-500)]'>
                        Extra security layer - users need both link and password
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.requirePassword}
                      onCheckedChange={(checked: boolean) =>
                        setSettings(prev => ({
                          ...prev,
                          requirePassword: checked,
                        }))
                      }
                    />
                  </label>

                  <AnimatePresence>
                    {settings.requirePassword && (
                      <motion.div
                        initial={{
                          height: 0,
                          opacity: 0,
                          marginTop: 0,
                        }}
                        animate={{
                          height: 'auto',
                          opacity: 1,
                          marginTop: 12,
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          marginTop: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.4, 0.0, 0.2, 1],
                        }}
                        className='ml-4 space-y-2 overflow-hidden'
                      >
                        <label className='block text-xs font-medium text-[var(--quaternary)]'>
                          Set Password
                        </label>
                        <input
                          type='password'
                          value={settings.password}
                          onChange={e =>
                            setSettings(prev => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder='Enter new password'
                          className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Expiration Date Settings - Only for topic links that haven't expired */}
            {!isBaseLink && link.status !== 'expired' && (
              <div className='space-y-4'>
                <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
                  <Clock className='w-4 h-4' />
                  Expiration Date
                </h3>

                <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-[var(--quaternary)]'>
                        Current Expiry
                      </span>
                      <HelpPopover
                        title='Link Expiration'
                        description='When this date is reached:

• Link becomes inactive
• New uploads are prevented
• Existing files remain accessible

Set a new date to extend the link.'
                      />
                    </div>
                    <div className='p-3 bg-white border border-[var(--neutral-200)] rounded-md'>
                      <p className='text-sm text-[var(--quaternary)]'>
                        {link.expiresAt ? (
                          <>
                            Expires on{' '}
                            <span className='font-medium'>
                              {link.expiresAt}
                            </span>
                          </>
                        ) : (
                          <span className='text-[var(--neutral-500)]'>
                            No expiration date set
                          </span>
                        )}
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-[var(--quaternary)]'>
                        Update Expiry Date
                      </label>
                      <input
                        type='date'
                        value={settings.expiresAt || ''}
                        onChange={e => {
                          setSettings(prev => ({
                            ...prev,
                            expiresAt: e.target.value,
                          }));
                        }}
                        min={new Date().toISOString().split('T')[0]} // Prevent past dates
                        className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                      />
                      <p className='text-xs text-[var(--neutral-500)]'>
                        Choose a new expiration date or leave empty to remove
                        expiry
                      </p>

                      {settings.expiresAt && (
                        <button
                          type='button'
                          onClick={() =>
                            setSettings(prev => ({ ...prev, expiresAt: '' }))
                          }
                          className='text-xs text-red-600 hover:text-red-700 font-medium'
                        >
                          Remove expiration date
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization Settings */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
                <FolderPlus className='w-4 h-4' />
                Organization
              </h3>

              <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
                <div className='space-y-3'>
                  <label className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-[var(--quaternary)]'>
                          Auto-create Folders
                        </span>
                        <HelpPopover
                          title='Automatic Folder Organization'
                          description='Organizes uploads into date folders:

Enabled: Files go into 2024-01-15, 2024-01-16, etc.
Disabled: All files in main folder.'
                        />
                      </div>
                      <p className='text-xs text-[var(--neutral-500)]'>
                        Organize uploads by date (2024-01-15, 2024-01-16, etc.)
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.autoCreateFolders}
                      onCheckedChange={(checked: boolean) =>
                        setSettings(prev => ({
                          ...prev,
                          autoCreateFolders: checked,
                        }))
                      }
                    />
                  </label>
                </div>

                <div className='space-y-3'>
                  <label className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-[var(--quaternary)]'>
                          Allow Multiple Uploads
                        </span>
                        <HelpPopover
                          title='Batch Upload Control'
                          description='Controls how many files at once:

Enabled: Multiple files via drag & drop
Disabled: One file at a time only'
                        />
                      </div>
                      <p className='text-xs text-[var(--neutral-500)]'>
                        Enable batch file uploads vs single file only
                      </p>
                    </div>
                    <Checkbox
                      checked={settings.allowMultiple}
                      onCheckedChange={(checked: boolean) =>
                        setSettings(prev => ({
                          ...prev,
                          allowMultiple: checked,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - File & Upload Limits */}
          <div className='space-y-6'>
            {/* File Limits */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
                <HardDrive className='w-4 h-4' />
                Upload Limits
              </h3>

              <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <label className='block text-sm font-medium text-[var(--quaternary)]'>
                      Maximum Files
                    </label>
                    <HelpPopover
                      title='File Count Limits'
                      description='Total files allowed across all users.

Link becomes inactive when limit reached.'
                    />
                  </div>
                  <input
                    type='number'
                    value={settings.maxFiles}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        maxFiles: parseInt(e.target.value) || 1,
                      }))
                    }
                    min='1'
                    max='1000'
                    className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                  />
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Total file limit across all users (link deactivates when
                    reached)
                  </p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <label className='block text-sm font-medium text-[var(--quaternary)]'>
                      Maximum File Size (MB)
                    </label>
                    <HelpPopover
                      title='Individual File Size Limits'
                      description='Maximum size per file.

Files larger than this are rejected with error message.'
                    />
                  </div>
                  <AnimatedSelect
                    value={settings.maxFileSize.toString()}
                    onChange={value =>
                      setSettings(prev => ({
                        ...prev,
                        maxFileSize: parseInt(value),
                      }))
                    }
                    options={fileSizeOptions}
                    placeholder='Select file size limit'
                  />
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Per-file size limit (files larger than this are rejected)
                  </p>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <label className='block text-sm font-medium text-[var(--quaternary)]'>
                      Allowed File Types
                    </label>
                    <HelpPopover
                      title='File Type Restrictions'
                      description='Choose from preset categories:

• All File Types - no restrictions
• Images Only - photos and graphics
• Documents - PDFs, Word, text files'
                    />
                  </div>
                  <AnimatedSelect
                    value={settings.allowedFileTypes}
                    onChange={selectedValue => {
                      setSettings(prev => ({
                        ...prev,
                        allowedFileTypes: selectedValue,
                      }));
                    }}
                    options={fileTypeOptions}
                    placeholder='Select file types'
                  />

                  <p className='text-xs text-[var(--neutral-500)]'>
                    Choose from common file type categories
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
                <Mail className='w-4 h-4' />
                Custom Message
              </h3>

              <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
                <div className='space-y-3'>
                  <div className='flex items-center gap-2'>
                    <label className='block text-sm font-medium text-[var(--quaternary)]'>
                      Welcome Message
                    </label>
                    <HelpPopover
                      title='Custom Upload Page Message'
                      description='Message shown on upload page.

Use for:
• Instructions & guidelines
• File naming requirements  
• Deadlines & special notes'
                    />
                  </div>
                  <textarea
                    value={settings.customMessage}
                    onChange={e =>
                      setSettings(prev => ({
                        ...prev,
                        customMessage: e.target.value,
                      }))
                    }
                    placeholder='Add a custom message for users who visit your upload page...'
                    rows={4}
                    className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                  />
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Provide instructions, context, or guidelines for uploaders
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-3 pt-6 border-t border-[var(--neutral-200)]'>
          <ActionButton variant='outline' onClick={onClose} className='flex-1'>
            Cancel
          </ActionButton>
          <ActionButton onClick={handleSaveSettings} className='flex-1'>
            Save Settings
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
