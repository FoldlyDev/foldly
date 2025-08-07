'use client';

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/core/shadcn/input';
import { Label } from '@/components/ui/core/shadcn/label';
import { cn } from '@/lib/utils';

interface UsernameFieldProps {
  value: string;
  onChange: (value: string) => void;
  validation: {
    isAvailable: boolean;
    isUnavailable: boolean;
    isChecking: boolean;
    message: string | null;
  };
  error?: string;
  isLoading?: boolean;
}

export const UsernameField = memo(function UsernameField({
  value,
  onChange,
  validation,
  error,
  isLoading = false,
}: UsernameFieldProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove spaces and special characters, but preserve case
    const normalized = e.target.value
      .replace(/\s/g, '') // Remove spaces
      .replace(/[^a-zA-Z0-9_-]/g, ''); // Only allow letters, numbers, underscores, and hyphens
    onChange(normalized);
  }, [onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='space-y-2'
    >
      <Label
        htmlFor='username'
        className='flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium'
      >
        <User className='h-4 w-4' aria-hidden='true' />
        Username
      </Label>

      <div className='relative'>
        <Input
          id='username'
          type='text'
          value={value}
          onChange={handleChange}
          placeholder='johndoe'
          autoComplete='username'
          disabled={isLoading}
          aria-label='Username'
          aria-required='true'
          aria-invalid={value ? validation.isUnavailable : undefined}
          aria-describedby={
            error ? 'username-error' : 
            validation.message ? 'username-validation' : 
            'username-help'
          }
          className={cn(
            'pr-10 text-gray-900 dark:text-gray-100 placeholder:text-gray-100 dark:placeholder:text-gray-100',
            value &&
              validation.isAvailable &&
              'border-green-600 focus-visible:ring-green-600 dark:border-green-500 dark:focus-visible:ring-green-500',
            value &&
              validation.isUnavailable &&
              'border-red-600 focus-visible:ring-red-600 dark:border-red-500 dark:focus-visible:ring-red-500'
          )}
        />

        {/* Validation icon */}
        {value && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2' aria-live='polite'>
            {validation.isChecking ? (
              <div 
                className='h-4 w-4 animate-spin rounded-full border-2 border-gray-500 dark:border-gray-400 border-t-transparent'
                role='status'
                aria-label='Checking username availability'
              >
                <span className='sr-only'>Checking...</span>
              </div>
            ) : validation.isAvailable ? (
              <CheckCircle 
                className='h-4 w-4 text-green-600 dark:text-green-500' 
                aria-label='Username is available'
              />
            ) : validation.isUnavailable ? (
              <AlertCircle 
                className='h-4 w-4 text-red-600 dark:text-red-500' 
                aria-label='Username is not available'
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Validation messages */}
      {value && validation.isUnavailable && validation.message && (
        <motion.p
          id='username-validation'
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-sm text-red-700 dark:text-red-400 font-medium'
          role='alert'
          aria-live='assertive'
        >
          {validation.message}
        </motion.p>
      )}

      {value && validation.isAvailable && (
        <motion.p
          id='username-validation'
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-sm text-green-700 dark:text-green-400 font-medium'
          role='status'
          aria-live='polite'
        >
          Username is available!
        </motion.p>
      )}

      {error && (
        <motion.p
          id='username-error'
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-sm text-red-700 dark:text-red-400 font-medium'
          role='alert'
          aria-live='assertive'
        >
          {error}
        </motion.p>
      )}

      <p 
        id='username-help'
        className='text-xs text-gray-600 dark:text-gray-400'
      >
        Letters, numbers, underscores, and hyphens only (4-30 characters)
      </p>
    </motion.div>
  );
});
