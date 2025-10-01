'use client';

import { motion } from 'framer-motion';
import { Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { useSlugNormalization } from '../../../lib/utils/slug-normalization';
import { getDisplayDomain } from '@/lib/config/url-config';

interface LinkSlugFieldProps {
  formData: {
    slug?: string;
  };
  onDataChange: (data: any) => void;
  baseSlug: string;
  slugValidation: {
    isAvailable: boolean;
    isUnavailable: boolean;
    isChecking: boolean;
    message: string | null;
  };
  isLoading?: boolean;
}

export function LinkSlugField({
  formData,
  onDataChange,
  baseSlug,
  slugValidation,
  isLoading = false,
}: LinkSlugFieldProps) {
  const { normalizeSlug } = useSlugNormalization();
  const displayDomain = getDisplayDomain();

  const slugLength = formData.slug?.length || 0;
  const isShortSlug = slugLength > 0 && slugLength < 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className='p-4 bg-card rounded-lg border border-border space-y-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-primary/10 rounded-lg'>
            <Hash className='w-4 h-4 text-primary' />
          </div>
          <div>
            <label className='form-label'>
              Personal Collection Link URL
            </label>
            <p className='form-helper'>
              Customize your Personal Collection Link URL (optional)
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='relative'>
            <div className='flex items-center'>
              <span className='px-3 py-2 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground'>
                {displayDomain}/
              </span>
              <input
                type='text'
                value={formData.slug || ''}
                onChange={e => {
                  const normalizedSlug = normalizeSlug(e.target.value);
                  onDataChange({
                    slug: normalizedSlug,
                  });
                }}
                placeholder={`Leave empty to use: ${baseSlug}`}
                disabled={isLoading}
                className={`premium-input rounded-l-none border-l-0 pr-10 ${
                  formData.slug
                    ? slugValidation.isAvailable
                      ? '!border-green-600 focus:!border-green-600'
                      : slugValidation.isUnavailable
                        ? 'form-input-error'
                        : ''
                    : ''
                }`}
              />
              {/* Validation icon */}
              {formData.slug && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  {slugValidation.isChecking ? (
                    <div className='w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin' />
                  ) : slugValidation.isAvailable ? (
                    <CheckCircle className='w-4 h-4 text-green-600' />
                  ) : slugValidation.isUnavailable ? (
                    <AlertCircle className='w-4 h-4 text-destructive' />
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Error feedback for unavailable slugs */}
          {formData.slug && slugValidation.isUnavailable && (
            <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md'>
              <AlertCircle className='w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0' />
              <p className='text-sm font-medium text-red-800 dark:text-red-200'>{slugValidation.message}</p>
            </div>
          )}

          {/* Success feedback for available slugs */}
          {formData.slug && slugValidation.isAvailable && (
            <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md'>
              <CheckCircle className='w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0' />
              <p className='text-sm font-medium text-green-800 dark:text-green-200'>This URL is available!</p>
            </div>
          )}

          {/* Character counter and help text */}
          <div className='flex items-center justify-between'>
            <p className='form-helper text-xs'>
              Use letters, numbers, hyphens, and underscores only
              {isShortSlug && ' • Minimum 5 characters'}
            </p>
            {formData.slug && isShortSlug && (
              <span className={`text-xs font-medium ${isShortSlug ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {slugLength}/5 characters
              </span>
            )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
