'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { HelpPopover } from '@/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { LinkWithStats } from '@/lib/supabase/types';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface ExpirationDateSectionProps {
  link: LinkWithStats;
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function ExpirationDateSection({
  link,
  form,
}: ExpirationDateSectionProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  return (
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
              {link.expiresAt
                ? new Date(link.expiresAt).toLocaleDateString()
                : 'No expiry date set'}
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
            <p className='text-xs text-red-600'>{errors.expiresAt.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
