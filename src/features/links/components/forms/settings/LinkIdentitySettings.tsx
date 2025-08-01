'use client';

import * as React from 'react';
import { Info, Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/core/shadcn/textarea';
import { Input } from '@/components/ui/core/shadcn/input';
import { HelpPopover } from '@/components/ui/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';
import type { LinkWithStats } from '@/lib/database/types';
import { useSlugValidation } from '../../../hooks/use-slug-validation';
import { useTopicValidation } from '../../../hooks/use-topic-validation';
import { useSlugNormalization } from '../../../lib/utils/slug-normalization';
import { getDisplayDomain } from '@/lib/config/url-config';

interface LinkIdentitySettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
  link: LinkWithStats;
}

export function LinkIdentitySettings({
  form,
  link,
}: LinkIdentitySettingsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const isBaseLink = link.linkType === 'base';
  const isTopicLink = link.linkType === 'custom';
  const displayDomain = getDisplayDomain();

  // Slug normalization utilities
  const { normalizeSlug } = useSlugNormalization();

  // Real-time slug validation for base links (exclude current link ID when editing)
  const slugValidation = useSlugValidation(watchedValues.slug || '', {
    enabled: isBaseLink,
    excludeId: link.id,
    debounceMs: 500,
  });

  // Real-time topic validation for topic/custom links
  const topicValidation = useTopicValidation(watchedValues.topic || '', {
    enabled: isTopicLink,
    excludeId: link.id,
    userId: link.userId,
    slug: link.slug,
    debounceMs: 500,
  });

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
        <Info className='w-4 h-4' />
        Basic Information
      </h3>

      <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg'>
        {/* URL Path - Editable for base links only */}
        {isBaseLink && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium text-[var(--neutral-700)]'>
                Your Link URL
              </label>
              <HelpPopover
                title='Custom URL'
                description='Customize your personal collection URL. Leave empty to use your username.'
              />
            </div>
            <div className='relative'>
              <div className='flex items-center'>
                <span className='px-3 py-2 bg-gray-100 border border-r-0 border-[var(--neutral-200)] rounded-l-md text-sm text-gray-600'>
                  {displayDomain}/
                </span>
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
                  placeholder='your-name'
                  className={`rounded-l-none pr-10 bg-white text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)] ${
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
            </div>
            {/* Error feedback for unavailable URLs */}
            {watchedValues.slug && slugValidation.isUnavailable && (
              <div className='flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                <AlertCircle className='w-3 h-3 text-red-500 flex-shrink-0' />
                <p className='text-red-700'>{slugValidation.message}</p>
              </div>
            )}

            {/* Success feedback for available URLs */}
            {watchedValues.slug && slugValidation.isAvailable && (
              <div className='flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
                <CheckCircle className='w-3 h-3 text-green-600 flex-shrink-0' />
                <p className='text-green-700'>This URL is available!</p>
              </div>
            )}

            {errors.slug && (
              <p className='text-xs text-red-600'>{errors.slug.message}</p>
            )}
            <p className='text-xs text-[var(--neutral-500)]'>
              Use letters, numbers, hyphens, and underscores only
            </p>
          </div>
        )}

        {/* Collection Path - Editable for topic/custom links only */}
        {isTopicLink && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium text-[var(--neutral-700)]'>
                Collection URL
              </label>
              <HelpPopover
                title='Collection URL'
                description='The URL path for this specific collection. Must be unique within your links.'
              />
            </div>
            <div className='relative'>
              <div className='flex items-center'>
                <span className='px-3 py-2 bg-gray-100 border border-r-0 border-[var(--neutral-200)] rounded-l-md text-sm text-gray-600'>
                  {displayDomain}/{link.slug}/
                </span>
                <Input
                  value={watchedValues.topic || ''}
                  onChange={e => {
                    setValue('topic', e.target.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  placeholder='collection-name'
                  className={`rounded-l-none pr-10 bg-white text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)] ${
                    watchedValues.topic
                      ? topicValidation.isAvailable
                        ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                        : topicValidation.isUnavailable
                          ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                          : 'border-[var(--neutral-200)]'
                      : 'border-[var(--neutral-200)]'
                  }`}
                />
                {/* Validation icon */}
                {watchedValues.topic && (
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    {topicValidation.isChecking ? (
                      <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                    ) : topicValidation.isAvailable ? (
                      <CheckCircle className='w-4 h-4 text-green-500' />
                    ) : topicValidation.isUnavailable ? (
                      <AlertCircle className='w-4 h-4 text-red-500' />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
            {/* Error feedback for unavailable collection names */}
            {watchedValues.topic && topicValidation.isUnavailable && (
              <div className='flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
                <AlertCircle className='w-3 h-3 text-red-500 flex-shrink-0' />
                <p className='text-red-700'>{topicValidation.message}</p>
              </div>
            )}

            {/* Success feedback for available collection names */}
            {watchedValues.topic && topicValidation.isAvailable && (
              <div className='flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
                <CheckCircle className='w-3 h-3 text-green-600 flex-shrink-0' />
                <p className='text-green-700'>
                  This collection name is available!
                </p>
              </div>
            )}

            {errors.topic && (
              <p className='text-xs text-red-600'>{errors.topic.message}</p>
            )}
            <p className='text-xs text-[var(--neutral-500)]'>
              Use letters, numbers, spaces, hyphens, and underscores
            </p>
          </div>
        )}

        {/* Title - Editable for all links */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium text-[var(--neutral-700)]'>
              Display Name
            </label>
            <HelpPopover
              title='Display Name'
              description='The name that appears on your collection page and in the browser tab.'
            />
          </div>
          <Input
            value={watchedValues.title || ''}
            onChange={e =>
              setValue('title', e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            placeholder='My Collection'
            className='bg-white border-[var(--neutral-200)] text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)]'
          />
          {errors.title && (
            <p className='text-xs text-red-600'>{errors.title.message}</p>
          )}
          <p className='text-xs text-[var(--neutral-500)]'>
            This is what visitors see as your collection name
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
