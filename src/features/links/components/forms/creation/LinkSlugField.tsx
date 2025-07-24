'use client';

import { motion } from 'framer-motion';
import { Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { useSlugNormalization } from '../../../lib/utils/slug-normalization';

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
            <h3 className='font-medium text-foreground'>Personal Collection Link URL</h3>
            <p className='text-sm text-muted-foreground'>
              Customize your Personal Collection Link URL (optional)
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='relative'>
            <div className='flex items-center'>
              <span className='px-3 py-2 bg-gray-100 border border-r-0 border-[var(--neutral-200)] rounded-l-md text-sm text-gray-600'>
                foldly.io/
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
                className={`flex-1 px-3 py-2 pr-10 text-sm bg-white border rounded-r-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-[var(--neutral-700)] placeholder:text-[var(--neutral-400)] ${
                  formData.slug
                    ? slugValidation.isAvailable
                      ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
                      : slugValidation.isUnavailable
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-[var(--neutral-200)]'
                    : 'border-[var(--neutral-200)]'
                }`}
              />
              {/* Validation icon */}
              {formData.slug && (
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

          {/* Error feedback for unavailable slugs */}
          {formData.slug && slugValidation.isUnavailable && (
            <div className='flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs'>
              <AlertCircle className='w-3 h-3 text-red-500 flex-shrink-0' />
              <p className='text-red-700'>{slugValidation.message}</p>
            </div>
          )}

          {/* Success feedback for available slugs */}
          {formData.slug && slugValidation.isAvailable && (
            <div className='flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs'>
              <CheckCircle className='w-3 h-3 text-green-600 flex-shrink-0' />
              <p className='text-green-700'>This URL is available!</p>
            </div>
          )}

          {/* Help text */}
          <p className='text-xs text-[var(--neutral-500)]'>
            Use letters, numbers, hyphens, and underscores only
          </p>
        </div>
      </div>
    </motion.div>
  );
}