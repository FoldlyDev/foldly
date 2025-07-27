'use client';

import * as React from 'react';
import { HardDrive } from 'lucide-react';
import { HelpPopover } from '@/components/ui/core/help-popover';
import { AnimatedSelect } from '@/components/ui/core/animated-select';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';
import { FILE_TYPE_OPTIONS, FILE_SIZE_OPTIONS } from '../../../lib/constants';

interface UploadRestrictionsSettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function UploadRestrictionsSettings({ form }: UploadRestrictionsSettingsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const fileTypeOptions = FILE_TYPE_OPTIONS;
  const fileSizeOptions = FILE_SIZE_OPTIONS;

  return (
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
                e.target.value ? parseInt(e.target.value) : 100,
                { shouldDirty: true, shouldValidate: true }
              )
            }
            placeholder='0 = unlimited'
            min='0'
            className='w-full px-3 py-2 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
          />
          {errors.maxFiles && (
            <p className='text-xs text-red-600'>{errors.maxFiles.message}</p>
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
            value={(watchedValues.maxFileSize || 10).toString()}
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
            <p className='text-xs text-red-600'>{errors.maxFileSize.message}</p>
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
  );
}
