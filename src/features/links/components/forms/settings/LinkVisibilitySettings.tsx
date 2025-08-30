'use client';

import * as React from 'react';
import {
  Globe,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Switch } from '@/components/ui/shadcn/switch';
import { HelpPopover } from '@/components/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkVisibilitySettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkVisibilitySettings({ form }: LinkVisibilitySettingsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <Globe className='w-4 h-4' />
        Visibility
      </h3>

      <div className='rounded-lg border border-border bg-card p-4'>
        {/* Active Status Toggle */}
        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='form-label'>Link Status</span>
                <HelpPopover
                  title='Active vs Inactive Links'
                  description="Active: Link is live and accepts uploads.

Inactive: Link is disabled - users see a 'Link unavailable' message."
                />
              </div>
              <p className='form-helper'>
                {watchedValues.isActive
                  ? 'Link is active and accepting uploads'
                  : 'Link is disabled - no uploads allowed'}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <span
                className={`text-xs font-medium transition-colors ${
                  watchedValues.isActive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {watchedValues.isActive ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={watchedValues.isActive ?? true}
                onCheckedChange={(checked: boolean) =>
                  setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
              />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}