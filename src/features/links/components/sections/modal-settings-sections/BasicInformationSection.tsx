'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { HelpPopover } from '@/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface BasicInformationSectionProps {
  form: UseFormReturn<GeneralSettingsFormData>;
  linkTitle: string; // Display-only, not editable in settings
}

export function BasicInformationSection({
  form,
  linkTitle,
}: BasicInformationSectionProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
        <Info className='w-4 h-4' />
        Basic Information
      </h3>

      <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
        {/* Title - Display Only */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-[var(--neutral-700)]'>
            Title
          </label>
          <div className='px-3 py-2 bg-[var(--neutral-100)] rounded-md text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)]'>
            {linkTitle}
          </div>
          <p className='text-xs text-[var(--neutral-500)]'>
            Link title cannot be changed after creation
          </p>
        </div>

        {/* Description - Editable */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium text-[var(--neutral-700)]'>
              Description
            </label>
            <HelpPopover
              title='Description'
              description="This description will be shown to users when they visit your upload page. Use it to explain what files you're looking for or provide instructions."
            />
          </div>
          <Textarea
            value={watchedValues.description || ''}
            onChange={e =>
              setValue('description', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder='No description provided'
            className='min-h-[80px] resize-none bg-white border-[var(--neutral-200)] text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)]'
          />
          {errors.description && (
            <p className='text-xs text-red-600'>{errors.description.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
