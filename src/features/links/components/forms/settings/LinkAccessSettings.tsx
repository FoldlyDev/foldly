'use client';

import * as React from 'react';
import { Globe, Mail, Lock, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { HelpPopover } from '@/components/ui';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkAccessSettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkAccessSettings({
  form,
}: LinkAccessSettingsProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className='space-y-4'>
      <h3 className='font-semibold text-[var(--quaternary)] flex items-center gap-2'>
        <Globe className='w-4 h-4' />
        Visibility & Access
      </h3>

      <div className='space-y-4 bg-[var(--neutral-50)] p-4 rounded-lg transition-all duration-300 ease-in-out'>
        {/* Active Status Toggle */}
        <div className='space-y-3 pb-3 border-b border-[var(--neutral-200)]'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-[var(--quaternary)]'>
                  Link Status
                </span>
                <HelpPopover
                  title='Active vs Inactive Links'
                  description="Active: Link is live and accepts uploads.

Inactive: Link is disabled - users see a 'Link unavailable' message."
                />
              </div>
              <p className='text-xs text-[var(--neutral-500)]'>
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
              <Checkbox
                checked={watchedValues.isActive ?? true}
                onCheckedChange={(checked: boolean) =>
                  setValue('isActive', checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
          </label>
        </div>

        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-[var(--quaternary)]'>
                  Public Access
                </span>
                <HelpPopover
                  title='Public vs Private Access'
                  description="Public: Users can see all uploaded files from everyone.

Private: Users only see their own uploads - others' files stay hidden."
                />
              </div>
              <p className='text-xs text-[var(--neutral-500)]'>
                When private, uploaders cannot see each other's files
              </p>
            </div>
            <Checkbox
              checked={watchedValues.isPublic ?? true}
              onCheckedChange={(checked: boolean) =>
                setValue('isPublic', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </label>
        </div>

        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-[var(--quaternary)]'>
                  Require Email Address
                </span>
                <HelpPopover
                  title='Email Collection'
                  description='Collects uploader email addresses before upload.

• Track who uploaded what
• Send notifications  
• Export for follow-up'
                />
              </div>
              <p className='text-xs text-[var(--neutral-500)]'>
                Collect uploader contact info for tracking and follow-up
              </p>
            </div>
            <Checkbox
              checked={watchedValues.requireEmail ?? false}
              onCheckedChange={(checked: boolean) =>
                setValue('requireEmail', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </label>
        </div>

        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-[var(--quaternary)]'>
                  Password Protection
                </span>
                <HelpPopover
                  title='Password Protection'
                  description='Requires password before accessing upload page.

Share both:
• The link URL
• The password'
                />
              </div>
              <p className='text-xs text-[var(--neutral-500)]'>
                Extra security layer - users need both link and password
              </p>
            </div>
            <Checkbox
              checked={watchedValues.requirePassword ?? false}
              onCheckedChange={(checked: boolean) =>
                setValue('requirePassword', checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
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
                <label className='block text-xs font-medium text-[var(--quaternary)]'>
                  Set Password
                </label>
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
                    placeholder='Enter password (minimum 8 characters)'
                    className='w-full px-3 py-2 pr-10 text-sm border border-[var(--neutral-300)] rounded-md focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-500)] hover:text-[var(--neutral-700)] transition-colors'
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
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
