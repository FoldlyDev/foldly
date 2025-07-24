'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { HelpPopover } from '@/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { LinkWithStats } from '@/lib/supabase/types';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkExpirationSettingsProps {
  link: LinkWithStats;
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkExpirationSettings({
  link,
  form,
}: LinkExpirationSettingsProps) {
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
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Expiry Date
            </label>
            <HelpPopover
              title='Link Expiration'
              description='When this date is reached, the link is marked as "Expired" in your dashboard.

To re-enable an expired link:
• Set a new future date to extend the expiry
• Clear the date completely (leave blank) to remove expiry entirely
• Manually activate the link again in settings if needed

All files remain accessible regardless of expiry status.'
            />
          </div>
          <input
            type='datetime-local'
            value={
              watchedValues.expiresAt
                ? new Date(watchedValues.expiresAt).toISOString().slice(0, 16)
                : ''
            }
            onChange={e =>
              setValue(
                'expiresAt',
                e.target.value ? new Date(e.target.value) : undefined,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              )
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
