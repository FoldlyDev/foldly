'use client';

import * as React from 'react';
import {
  Globe,
  Mail,
  Lock,
  Clock,
  FolderPlus,
  HardDrive,
  Crown,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { Switch } from '@/components/ui/shadcn/switch';
import { HelpPopover, AnimatedSelect } from '@/components/ui';
import type { LinkData } from '../../types';
import { FILE_TYPE_OPTIONS, FILE_SIZE_OPTIONS } from '../../lib/constants';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../schemas';
import type { HexColor } from '@/types';

// Use centralized types from the types folder
import type { GeneralSettingsData } from '../../types';

interface GeneralSettingsModalSectionProps {
  link: LinkData;
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function GeneralSettingsModalSection({
  link,
  form,
}: GeneralSettingsModalSectionProps) {
  const fileTypeOptions = FILE_TYPE_OPTIONS;
  const fileSizeOptions = FILE_SIZE_OPTIONS;
  const isBaseLink = link.linkType === 'base';

  // Use React Hook Form for state management
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

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
                  checked={watchedValues.isPublic}
                  onCheckedChange={(checked: boolean) =>
                    setValue('isPublic', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
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
                  checked={watchedValues.requireEmail}
                  onCheckedChange={(checked: boolean) =>
                    setValue('requireEmail', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
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
                  checked={watchedValues.requirePassword}
                  onCheckedChange={(checked: boolean) =>
                    setValue('requirePassword', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </label>

              <AnimatePresence>
                {watchedValues.requirePassword && (
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
                      value={watchedValues.password}
                      onChange={e =>
                        setValue('password', e.target.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder='Enter new password'
                      className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                    />
                    {errors.password && (
                      <p className='text-xs text-red-600'>
                        {errors.password.message}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Welcome Message Section */}
        <div className='space-y-4'>
          <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
            <MessageSquare className='w-4 h-4' />
            Welcome Message
          </h3>

          <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
            <div className='space-y-3'>
              <label className='block text-sm font-medium text-[var(--quaternary)]'>
                Description & Welcome Message
                <HelpPopover
                  title='Welcome Message for Uploaders'
                  description='A friendly message shown to uploaders when they visit your link.

Use this to:
• Welcome uploaders
• Explain what files you need
• Provide upload instructions
• Set expectations
• Thank contributors'
                />
              </label>
              <textarea
                value={watchedValues.customMessage}
                onChange={e =>
                  setValue('customMessage', e.target.value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder='Write a friendly welcome message for your uploaders... 

Example: "Hi! Thanks for contributing to our project. Please upload your photos from the event here. We appreciate your help!"'
                rows={4}
                className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] resize-none'
              />
              {errors.customMessage && (
                <p className='text-xs text-red-600'>
                  {errors.customMessage.message}
                </p>
              )}
              <p className='text-xs text-[var(--neutral-500)]'>
                This message will be displayed prominently on your upload page
                to greet visitors
              </p>
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
                  <p className='text-sm text-[var(--neutral-700)]'>
                    {link.expiresAt || 'No expiry date set'}
                  </p>
                </div>
              </div>

              <div className='space-y-3'>
                <label className='block text-sm font-medium text-[var(--quaternary)]'>
                  Set New Expiry Date
                </label>
                <input
                  type='datetime-local'
                  value={watchedValues.expiresAt || ''}
                  onChange={e =>
                    setValue('expiresAt', e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                />
                {errors.expiresAt && (
                  <p className='text-xs text-red-600'>
                    {errors.expiresAt.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Upload Limits & File Management */}
      <div className='space-y-6'>
        {/* File Upload Limits */}
        <div className='space-y-4'>
          <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
            <HardDrive className='w-4 h-4' />
            Upload Limits
          </h3>

          <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
            <div className='space-y-3'>
              <label className='block text-sm font-medium text-[var(--quaternary)]'>
                Maximum Files
                <HelpPopover
                  title='File Count Limit'
                  description='Total number of files that can be uploaded to this link.

• Set 0 for unlimited
• Counts all files from all uploaders'
                />
              </label>
              <input
                type='number'
                value={watchedValues.maxFiles || ''}
                onChange={e =>
                  setValue(
                    'maxFiles',
                    e.target.value ? parseInt(e.target.value) : undefined,
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
                placeholder='0 = unlimited'
                min='0'
                className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
              />
              {errors.maxFiles && (
                <p className='text-xs text-red-600'>
                  {errors.maxFiles.message}
                </p>
              )}
            </div>

            <div className='space-y-3'>
              <label className='block text-sm font-medium text-[var(--quaternary)]'>
                Maximum File Size (MB)
                <HelpPopover
                  title='File Size Limit'
                  description='Largest individual file size allowed.

• Applies to each file separately
• Common sizes: 50MB (documents), 100MB (images), 500MB+ (videos)'
                />
              </label>
              <AnimatedSelect
                options={fileSizeOptions}
                value={watchedValues.maxFileSize.toString()}
                onChange={value => {
                  // Ensure we're working with a string for single-select file size
                  const fileSize = Array.isArray(value) ? value[0] : value;
                  if (fileSize) {
                    setValue('maxFileSize', parseInt(fileSize), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
                placeholder='Select file size limit'
              />
              {errors.maxFileSize && (
                <p className='text-xs text-red-600'>
                  {errors.maxFileSize.message}
                </p>
              )}
            </div>

            <div className='space-y-3'>
              <label className='block text-sm font-medium text-[var(--quaternary)]'>
                Allowed File Types
                <HelpPopover
                  title='File Type Restrictions'
                  description='Control what types of files can be uploaded.

• Select multiple types or leave empty for all
• Common combinations: Images + Documents, Videos only, etc.
• More restrictive = better security'
                />
              </label>
              <AnimatedSelect
                options={fileTypeOptions}
                value={watchedValues.allowedFileTypes || []}
                onChange={values => {
                  // Ensure we're working with an array for multi-select
                  const fileTypes = Array.isArray(values) ? values : [];
                  setValue('allowedFileTypes', fileTypes, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                placeholder='All file types allowed'
                multiple
              />
              {errors.allowedFileTypes && (
                <p className='text-xs text-red-600'>
                  {errors.allowedFileTypes.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* File Organization */}
        <div className='space-y-4'>
          <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
            <FolderPlus className='w-4 h-4' />
            File Organization
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
                      description='Automatically organize uploads into folders by date.

• Creates YYYY-MM-DD folders
• Keeps uploads organized
• Easier to find files later'
                    />
                  </div>
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Organize uploads by date automatically
                  </p>
                </div>
                <Checkbox
                  checked={watchedValues.autoCreateFolders}
                  onCheckedChange={(checked: boolean) =>
                    setValue('autoCreateFolders', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </label>
            </div>

            <div className='space-y-3'>
              <label className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-[var(--quaternary)]'>
                      Allow Multiple Files
                    </span>
                    <HelpPopover
                      title='Multiple File Upload'
                      description='Let users upload multiple files at once.

• Enabled: Bulk upload support
• Disabled: One file at a time
• Most users prefer bulk upload'
                    />
                  </div>
                  <p className='text-xs text-[var(--neutral-500)]'>
                    Users can upload multiple files in one session
                  </p>
                </div>
                <Checkbox
                  checked={watchedValues.allowMultiple}
                  onCheckedChange={(checked: boolean) =>
                    setValue('allowMultiple', checked, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
