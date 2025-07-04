'use client';

import * as React from 'react';
import { Globe, Mail, Lock, Clock, FolderPlus, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { HelpPopover, AnimatedSelect } from '@/components/ui';
import type { LinkData } from '../../types';
import { FILE_TYPE_OPTIONS, FILE_SIZE_OPTIONS } from '../../constants';

export interface GeneralSettingsData {
  isPublic: boolean;
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  expiresAt: string | undefined;
  maxFiles: number | undefined;
  maxFileSize: number;
  allowedFileTypes: readonly string[];
  autoCreateFolders: boolean;
  allowMultiple: boolean;
  customMessage: string;
}

interface GeneralSettingsModalSectionProps {
  link: LinkData;
  settings: GeneralSettingsData;
  onSettingsChange: (settings: Partial<GeneralSettingsData>) => void;
}

export function GeneralSettingsModalSection({
  link,
  settings,
  onSettingsChange,
}: GeneralSettingsModalSectionProps) {
  const fileTypeOptions = FILE_TYPE_OPTIONS;
  const fileSizeOptions = FILE_SIZE_OPTIONS;
  const isBaseLink = link.linkType === 'base';

  const setSettings = (updates: Partial<GeneralSettingsData>) => {
    onSettingsChange(updates);
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
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
                    setSettings({ isPublic: checked })
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
                    setSettings({ requireEmail: checked })
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
                    setSettings({ requirePassword: checked })
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
                      onChange={e => setSettings({ password: e.target.value })}
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
                        <span className='font-medium'>{link.expiresAt}</span>
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
                      setSettings({ expiresAt: e.target.value });
                    }}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                    className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                  />
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Choose a new expiration date or leave empty to remove expiry
                  </p>

                  {settings.expiresAt && (
                    <button
                      type='button'
                      onClick={() => setSettings({ expiresAt: '' })}
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
                    setSettings({ autoCreateFolders: checked })
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
                    setSettings({ allowMultiple: checked })
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
                value={settings.maxFiles || 1}
                onChange={e =>
                  setSettings({ maxFiles: parseInt(e.target.value) || 1 })
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
                  setSettings({ maxFileSize: parseInt(value) })
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
                value={
                  Array.isArray(settings.allowedFileTypes)
                    ? settings.allowedFileTypes[0] || '*'
                    : settings.allowedFileTypes
                }
                onChange={selectedValue => {
                  setSettings({
                    allowedFileTypes: [selectedValue] as readonly string[],
                  });
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
                onChange={e => setSettings({ customMessage: e.target.value })}
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
  );
}
