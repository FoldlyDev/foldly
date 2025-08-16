'use client';

import * as React from 'react';
import { HardDrive, FileType, Check } from 'lucide-react';
import { HelpPopover } from '@/components/ui/core/help-popover';
import { Badge } from '@/components/ui/core/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/marketing/animate-ui/radix/dropdown-menu';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';
import { FILE_TYPE_OPTIONS, FILE_SIZE_OPTIONS } from '../../../lib/constants';

interface UploadRestrictionsSettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function UploadRestrictionsSettings({
  form,
}: UploadRestrictionsSettingsProps) {
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
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <HardDrive className='w-4 h-4' />
        Upload Limits
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        <div className='space-y-3'>
          <label className='form-label'>
            <span>Maximum Files</span>
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
            className='form-input'
          />
          {errors.maxFiles && (
            <p className='text-xs text-red-600'>{errors.maxFiles.message}</p>
          )}
        </div>

        <div className='space-y-3'>
          <label className='form-label'>
            <span>Maximum File Size (MB)</span>
            <HelpPopover
              title='File Size Limit'
              description='Largest individual file size allowed.

• Applies to each file separately
• Common sizes: 50MB (documents), 100MB (images), 500MB+ (videos)'
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger
              className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer'
            >
              <span>{watchedValues.maxFileSize || 10} MB</span>
              <svg
                className='w-4 h-4 text-muted-foreground'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-full min-w-[200px]'>
              {fileSizeOptions.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => {
                    setValue('maxFileSize', parseInt(option.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  className='cursor-pointer'
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {errors.maxFileSize && (
            <p className='text-xs text-red-600'>{errors.maxFileSize.message}</p>
          )}
        </div>

        <div className='space-y-3'>
          <label className='form-label'>
            <span>Allowed File Types</span>
            <HelpPopover
              title='File Type Restrictions'
              description='Control what types of files can be uploaded.

• Select multiple types or leave empty for all
• Common combinations: Images + Documents, Videos only, etc.
• More restrictive = better security'
            />
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger
              className='w-full flex items-center justify-between px-3 py-2 text-sm bg-background border border-border rounded-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer min-h-[40px] h-auto'
            >
              <div className='flex flex-wrap gap-1'>
                {(!watchedValues.allowedFileTypes || watchedValues.allowedFileTypes.length === 0) ? (
                  <span className='text-muted-foreground'>All file types allowed</span>
                ) : watchedValues.allowedFileTypes.length <= 3 ? (
                  watchedValues.allowedFileTypes.map(type => {
                    const option = fileTypeOptions.find(opt => opt.value === type);
                    return (
                      <Badge key={type} variant='secondary' className='text-xs'>
                        {option?.label?.split(' ')[0] || type}
                      </Badge>
                    );
                  })
                ) : (
                  <Badge variant='secondary' className='text-xs'>
                    {watchedValues.allowedFileTypes.length} types selected
                  </Badge>
                )}
              </div>
              <svg
                className='w-4 h-4 text-muted-foreground shrink-0 ml-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-full min-w-[280px] max-h-[300px] overflow-y-auto'>
              {fileTypeOptions.map(option => {
                const isSelected = watchedValues.allowedFileTypes?.includes(option.value) || false;
                
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => {
                      const currentTypes = watchedValues.allowedFileTypes || [];
                      let newTypes: string[];
                      
                      if (isSelected) {
                        // Remove from selection
                        newTypes = currentTypes.filter(type => type !== option.value);
                      } else {
                        // Add to selection
                        newTypes = [...currentTypes, option.value];
                      }
                      
                      setValue('allowedFileTypes', newTypes, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    className='cursor-pointer'
                  >
                    <div className='flex items-center justify-between w-full'>
                      <span className='flex-1'>{option.label}</span>
                      {isSelected && (
                        <Check className='w-4 h-4 text-primary ml-2' />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              
              {watchedValues.allowedFileTypes && watchedValues.allowedFileTypes.length > 0 && (
                <>
                  <div className='h-px bg-border my-1' />
                  <DropdownMenuItem
                    onClick={() => setValue('allowedFileTypes', [], {
                      shouldDirty: true,
                      shouldValidate: true,
                    })}
                    className='cursor-pointer text-center justify-center text-muted-foreground'
                  >
                    Clear all
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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