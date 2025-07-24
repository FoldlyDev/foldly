'use client';

import * as React from 'react';
import { Info, Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Input } from '@/components/ui/shadcn/input';
import { HelpPopover } from '@/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';
import type { LinkWithStats } from '@/lib/supabase/types';
import { useSlugValidation } from '../../../hooks/use-slug-validation';
import { useSlugNormalization } from '../../../lib/utils/slug-normalization';

interface BasicInformationSectionProps {
  form: UseFormReturn<GeneralSettingsFormData>;
  link: LinkWithStats;
}

export function BasicInformationSection({
  form,
  link,
}: BasicInformationSectionProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const isBaseLink = link.linkType === 'base';

  // Slug normalization utilities
  const { normalizeSlug } = useSlugNormalization();

  // Real-time slug validation for base links (exclude current link ID when editing)
  const slugValidation = useSlugValidation(
    watchedValues.slug || '', 
    { 
      enabled: isBaseLink,
      excludeId: link.id,
      debounceMs: 500 
    }
  );

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
        <Info className='w-4 h-4' />
        Basic Information
      </h3>

      <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
        {/* Slug - Editable for base links only */}
        {isBaseLink && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium text-[var(--neutral-700)]'>
                Custom Slug
              </label>
              <HelpPopover
                title='Custom Slug'
                description="Customize your base link URL. Leave empty to use your username. Only letters, numbers, hyphens, and underscores are allowed."
              />
            </div>
            <div className='relative'>
              <Input
                value={watchedValues.slug || ''}
                onChange={e => {
                  // Normalize slug input for consistent case handling
                  const normalizedSlug = normalizeSlug(e.target.value);
                  setValue('slug', normalizedSlug, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
                placeholder={`Leave empty to use your username`}
                className={`pr-10 bg-white text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)] ${
                  watchedValues.slug
                    ? slugValidation.isAvailable
                      ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                      : slugValidation.isUnavailable
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-[var(--neutral-200)]'
                    : 'border-[var(--neutral-200)]'
                }`}
              />
              {/* Validation icon */}
              {watchedValues.slug && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  {slugValidation.isChecking ? (
                    <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                  ) : slugValidation.isAvailable ? (
                    <CheckCircle className='w-4 h-4 text-green-500' />
                  ) : slugValidation.isUnavailable ? (
                    <AlertCircle className='w-4 h-4 text-red-500' />
                  ) : null}
                </div>
              )}
            </div>
            {/* Error feedback for unavailable slugs */}
            {watchedValues.slug && slugValidation.isUnavailable && (
              <div className='flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                <AlertCircle className='w-3 h-3 text-red-500 flex-shrink-0' />
                <p className='text-red-700'>{slugValidation.message}</p>
              </div>
            )}
            
            {/* Success feedback for available slugs */}
            {watchedValues.slug && slugValidation.isAvailable && (
              <div className='flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
                <CheckCircle className='w-3 h-3 text-green-600 flex-shrink-0' />
                <p className='text-green-700'>{slugValidation.message}</p>
              </div>
            )}

            {errors.slug && (
              <p className='text-xs text-red-600'>{errors.slug.message}</p>
            )}
            <div className='text-xs text-[var(--neutral-500)] space-y-1'>
              <p>
                <strong>Current URL:</strong> foldly.io/{watchedValues.slug || '[username]'}
              </p>
              <p>
                <strong>Allowed:</strong> Letters, numbers, hyphens, underscores
              </p>
            </div>
          </div>
        )}

        {/* Title - Display Only */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-[var(--neutral-700)]'>
            Title
          </label>
          <div className='px-3 py-2 bg-[var(--neutral-100)] rounded-md text-sm text-[var(--neutral-600)] border border-[var(--neutral-200)]'>
            {link.title}
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
