'use client';

import * as React from 'react';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Switch } from '@/components/ui/shadcn/switch';
import { HelpPopover } from '@/components/core/help-popover';
import type { UseFormReturn } from 'react-hook-form';
import type { GeneralSettingsFormData } from '../../../lib/validations';

interface LinkSecuritySettingsProps {
  form: UseFormReturn<GeneralSettingsFormData>;
}

export function LinkSecuritySettings({ form }: LinkSecuritySettingsProps) {
  const {
    watch,
    setValue,
    register,
    formState: { errors },
  } = form;
  const watchedValues = watch();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className='space-y-4'>
      <h3 className='text-sm font-medium text-foreground flex items-center gap-2'>
        <Shield className='w-4 h-4' />
        Security & Access
      </h3>

      <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
        {/* Email Requirement */}
        <div className='space-y-3 pb-3 border-b border-border'>
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
              className='cursor-pointer'
            />
          </label>
        </div>

        {/* Password Protection */}
        <div className='space-y-3'>
          <label className='flex items-center justify-between'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='form-label'>Password Protection</span>
                <HelpPopover
                  title='Password Protection'
                  description='Require a password to access this upload link.

• Only people with the password can upload
• Great for private sharing
• Password is encrypted and secure'
                />
              </div>
              <p className='form-helper'>
                Restrict access with a password
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
              className='cursor-pointer'
            />
          </label>

          {/* Animated Password Input Field */}
          <AnimatePresence mode='wait'>
            {watchedValues.requirePassword && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className='overflow-hidden'
              >
                <div className='relative mt-3 pl-6'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter password'
                    className='input-field w-full pr-10'
                    {...register('password')}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className='form-error mt-1 pl-6'>{errors.password.message}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}