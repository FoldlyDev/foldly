'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { HelpPopover } from '@/components/ui/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { LinkWithStats } from '@/lib/database/types';
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
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <Clock className='w-4 h-4' />
        Expiration Date
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <label className='form-label'>
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
            className='form-input'
          />
          {errors.expiresAt && (
            <p className='text-xs text-red-600'>{errors.expiresAt.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}