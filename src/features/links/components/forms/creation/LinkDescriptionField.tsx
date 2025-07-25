'use client';

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface LinkDescriptionFieldProps {
  formData: {
    description?: string;
  };
  onDataChange: (data: any) => void;
  linkType: 'base' | 'topic';
  errors?: {
    description?: string;
  } | undefined;
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
          <div className='p-2 bg-blue-100 rounded-lg'>
            <MessageSquare className='w-4 h-4 text-blue-600' />
          </div>
          <div>
            <h3 className='font-medium text-foreground'>
              Collection Description
            </h3>
            <p className='text-sm text-muted-foreground'>
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
            className='w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none'
          />
          {errors?.description && (
            <p className='text-sm text-destructive'>{errors.description}</p>
          )}
          <p className='text-xs text-muted-foreground'>
            This will be displayed on your Collection Link page (optional)
          </p>
        </div>
      </div>
    </motion.div>
  );
}