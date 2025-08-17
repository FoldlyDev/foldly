'use client';

import * as React from 'react';
import {
  Globe,
  Mail,
  Lock,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Switch } from '@/components/ui/shadcn/switch';
import { HelpPopover } from '@/components/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkAccessSettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkAccessSettings({ form }: LinkAccessSettingsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <Globe className='w-4 h-4' />
        Visibility & Access
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        {/* Active Status Toggle */}
        <div className='space-y-3 pb-3 border-b border-border'>
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

        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='form-label'>Require Email Address</span>
                <HelpPopover
                  title='Email Collection'
                  description='Collects uploader email addresses before upload.

• Track who uploaded what
• Send notifications  
• Export for follow-up'
                />
              </div>
              <p className='form-helper'>
                Collect uploader contact info for tracking and follow-up
              </p>
            </div>
            <Switch
              checked={watchedValues.requireEmail ?? false}
              onCheckedChange={(checked: boolean) =>
                setValue('requireEmail', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
            />
          </label>
        </div>

        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='form-label'>Password Protection</span>
                <HelpPopover
                  title='Password Protection'
                  description='Requires password before accessing upload page.

Share both:
• The link URL
• The password'
                />
              </div>
              <p className='form-helper'>
                Extra security layer - users need both link and password
              </p>
            </div>
            <Switch
              checked={watchedValues.requirePassword ?? false}
              onCheckedChange={(checked: boolean) =>
                setValue('requirePassword', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              className='data-[state=unchecked]:bg-muted-foreground/20 cursor-pointer'
            />
          </label>

          <AnimatePresence>
            {watchedValues.requirePassword && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                  marginTop: 0,
                }}
                animate={{
                  height: 'auto',
                  opacity: 1,
                  marginTop: 12,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  marginTop: 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
                className='ml-4 space-y-2 overflow-hidden'
              >
                <label className='form-label'>Set Password</label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={watchedValues.password || ''}
                    onChange={e =>
                      setValue('password', e.target.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder='Enter password (8+ characters)'
                    className={`form-input pr-10 ${
                      watchedValues.password &&
                      watchedValues.password.length < 8
                        ? 'form-input-error'
                        : ''
                    }`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
                {watchedValues.password &&
                  watchedValues.password.length < 8 && (
                    <p className='text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1'>
                      <span>⚠️</span>
                      Password must be at least 8 characters long
                    </p>
                  )}
                {errors.password && (
                  <p className='text-xs text-red-600'>
                    {errors.password.message}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
