'use client';

import { motion } from 'framer-motion';
import { Eye, Crown } from 'lucide-react';
import { Switch } from '@/components/ui/core/shadcn/switch';
import type { LinkWithStats } from '@/lib/database/types';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../lib/validations';

export interface BrandingSettingsSectionProps {
  form: UseFormReturn<GeneralSettingsFormData>;
  link: LinkWithStats;
}

export function BrandingSettingsSection({
  form,
  link,
}: BrandingSettingsSectionProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedValues = watch();

  // Logo functionality removed - not in current database schema

  return (
    <div className='space-y-6'>
      {/* Branding Toggle */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between p-4 bg-card rounded-lg border border-border'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Crown className='w-4 h-4 text-primary' />
            </div>
            <div>
              <h3 className='font-medium text-foreground'>
                Enable Custom Branding
              </h3>
              <p className='text-sm text-muted-foreground'>
                Add your own colors and styling to the collection page
              </p>
            </div>
          </div>
          <Switch
            checked={watchedValues.brandEnabled || false}
            onCheckedChange={checked =>
              setValue('brandEnabled', checked, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            className='data-[state=unchecked]:bg-muted-foreground/20'
          />
        </div>

        {/* Branding Options */}
        {watchedValues.brandEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='space-y-4'
          >
            {/* Brand Color Selection */}
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-foreground'>
                  Brand Color
                </label>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={watchedValues.brandColor || '#6c47ff'}
                    onChange={e =>
                      setValue('brandColor', e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className='w-12 h-10 rounded-lg cursor-pointer border border-border'
                  />
                  <input
                    type='text'
                    value={watchedValues.brandColor || ''}
                    onChange={e =>
                      setValue('brandColor', e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder='#6c47ff'
                    className='flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring'
                  />
                </div>
                {errors.brandColor && (
                  <p className='text-sm text-destructive'>
                    {errors.brandColor.message}
                  </p>
                )}
                <p className='text-xs text-muted-foreground'>
                  Choose your brand color that will be used throughout your
                  upload page
                </p>
              </div>
            </div>

            {/* Brand Preview Section */}
            <div className='space-y-3 pt-2'>
              <div className='flex items-center gap-2'>
                <Eye className='w-4 h-4 text-muted-foreground' />
                <span className='text-sm font-medium text-foreground'>
                  Preview
                </span>
              </div>
              <div
                className='w-full p-6 rounded-xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30'
                style={{
                  background: `linear-gradient(135deg, ${watchedValues.brandColor || '#6c47ff'}03 0%, ${watchedValues.brandColor || '#6c47ff'}08 100%)`,
                  borderColor: `${watchedValues.brandColor || '#6c47ff'}20`,
                }}
              >
                {/* Title with brand color */}
                <div className='flex items-center gap-3 mb-4'>
                  <h3
                    className='text-xl font-semibold leading-tight'
                    style={{ color: watchedValues.brandColor || '#6c47ff' }}
                  >
                    {link.title}
                  </h3>
                </div>

                {/* Description - gray */}
                <p className='text-gray-600 text-sm mb-8 leading-relaxed'>
                  {watchedValues.description ||
                    link.description ||
                    'Your description will appear here to guide uploaders'}
                </p>

                {/* Upload button with brand color */}
                <button
                  className='inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 hover:scale-[1.02] disabled:cursor-not-allowed'
                  style={{
                    backgroundColor: watchedValues.brandColor || '#6c47ff',
                  }}
                  disabled
                >
                  Choose Files
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
