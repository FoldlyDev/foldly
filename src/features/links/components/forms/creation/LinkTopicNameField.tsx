'use client';

import { motion } from 'framer-motion';
import { Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { useSlugNormalization } from '../../../lib/utils/slug-normalization';

interface LinkTopicNameFieldProps {
  topicValue: string;
  onDataChange: (data: any) => void;
  topicValidation: {
    isAvailable: boolean;
    isUnavailable: boolean;
    isChecking: boolean;
    message: string | null;
  };
  urlData: {
    isValidTopic: boolean;
    topicError: string | null;
    slug: string;
  };
  errors?:
    | {
        topic?: string;
        name?: string;
      }
    | undefined;
  isLoading?: boolean;
}

export function LinkTopicNameField({
  topicValue,
  onDataChange,
  topicValidation,
  urlData,
  errors,
  isLoading = false,
}: LinkTopicNameFieldProps) {
  const { normalizeTopic } = useSlugNormalization();

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
              Custom Topic Link Name
            </label>
            <p className='form-helper'>
              Choose a name for your Custom Topic Link
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <div className='relative'>
            <input
              type='text'
              value={topicValue}
              onChange={e => {
                const normalizedTopic = normalizeTopic(e.target.value);
                onDataChange({
                  topic: normalizedTopic,
                  name: normalizedTopic,
                });
              }}
              placeholder='e.g., resumes, portfolios, feedback'
              disabled={isLoading}
              className={`premium-input pr-10 ${
                topicValue
                  ? urlData.isValidTopic
                    ? '!border-green-600 focus:!border-green-600'
                    : 'form-input-error'
                  : ''
              }`}
            />
            {/* Validation icon */}
            {topicValue && (
              <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                {topicValidation.isChecking ? (
                  <div className='w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin' />
                ) : urlData.isValidTopic ? (
                  <CheckCircle className='w-4 h-4 text-green-600' />
                ) : (
                  <AlertCircle className='w-4 h-4 text-destructive' />
                )}
              </div>
            )}
          </div>

          {/* Error message from real-time validation */}
          {topicValue && urlData.topicError && (
            <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md'>
              <AlertCircle className='w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0' />
              <p className='text-sm font-medium text-red-800 dark:text-red-200 leading-5 m-0'>
                {urlData.topicError}
              </p>
            </div>
          )}

          {/* Schema validation error (from form validation) */}
          {(errors?.topic || errors?.name) && (
            <div className='flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md'>
              <AlertCircle className='w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0' />
              <p className='text-sm font-medium text-red-800 dark:text-red-200 leading-5 m-0'>
                {errors?.topic || errors?.name}
              </p>
            </div>
          )}

          {/* Success message for valid topics */}
          {topicValue && urlData.isValidTopic && urlData.slug && (
            <div className='flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md'>
              <CheckCircle className='w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0' />
              <div className='flex-1'>
                <p className='text-sm font-medium text-green-800 dark:text-green-200 leading-5 m-0'>
                  Custom Topic Link name is valid and ready to use!
                </p>
              </div>
            </div>
          )}

          {/* Help text */}
          <div className='space-y-2'>
            <p className='form-helper text-xs'>
              <strong>Allowed characters:</strong> Letters, numbers, spaces,
              hyphens, and underscores
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
