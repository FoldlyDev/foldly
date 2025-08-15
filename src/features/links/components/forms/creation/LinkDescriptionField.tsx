'use client';

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface LinkDescriptionFieldProps {
  formData: {
    description?: string;
  };
  onDataChange: (data: any) => void;
  linkType: 'base' | 'topic';
  errors?:
    | {
        description?: string;
      }
    | undefined;
  isLoading?: boolean;
}

export function LinkDescriptionField({
  formData,
  onDataChange,
  linkType,
  errors,
  isLoading = false,
}: LinkDescriptionFieldProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className='p-4 bg-card rounded-lg border border-border space-y-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-primary/10 rounded-lg'>
            <MessageSquare className='w-4 h-4 text-primary' />
          </div>
          <div>
            <label className='form-label'>
              Collection Description
            </label>
            <p className='form-helper'>
              {linkType === 'base'
                ? 'Add a welcome message for visitors to your Personal Collection Link'
                : "Tell people what files you're looking for in this Custom Topic Link"}
            </p>
          </div>
        </div>

        <div className='space-y-2'>
          <textarea
            value={formData.description || ''}
            onChange={e => onDataChange({ description: e.target.value })}
            placeholder={
              linkType === 'base'
                ? 'Share files with me easily...'
                : 'What files are you looking for?'
            }
            disabled={isLoading}
            rows={3}
            className='form-textarea'
          />
          {errors?.description && (
            <p className='text-sm text-destructive'>{errors.description}</p>
          )}
          <p className='form-helper text-xs'>
            This will be displayed on your Collection Link page (optional)
          </p>
        </div>
      </div>
    </motion.div>
  );
}
