'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ExternalLink, Copy, Plus } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useLinksModalStore } from '../../store/links-modal-store';
import { GradientButton, AnimatedCopyButton } from '@/components/ui';

/**
 * Success step for create link modal
 * Shows the created link and provides actions to share or create another
 */
export const CreateLinkSuccessStep = () => {
  // Form store subscriptions
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const generatedUrl = useCreateLinkFormStore(
    createLinkFormSelectors.generatedUrl
  );

  // Modal store actions
  const closeModal = useLinksModalStore(state => state.closeModal);
  const openCreateLinkModal = useLinksModalStore(
    state => state.openCreateLinkModal
  );
  const resetForm = useCreateLinkFormStore(state => state.resetForm);

  // Handle opening external link
  const handleOpenExternal = useCallback(() => {
    if (generatedUrl) {
      window.open(`https://${generatedUrl}`, '_blank', 'noopener,noreferrer');
    }
  }, [generatedUrl]);

  // Handle copy to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (generatedUrl) {
      await navigator.clipboard.writeText(`https://${generatedUrl}`);
    }
  }, [generatedUrl]);

  // Handle creating another link
  const handleCreateAnother = useCallback(() => {
    if (resetForm) {
      resetForm();
    }
    openCreateLinkModal('topic'); // Default to topic for creating another
  }, [resetForm, openCreateLinkModal]);

  // Handle done action
  const handleDone = useCallback(() => {
    if (resetForm) {
      resetForm();
    }
    closeModal();
  }, [resetForm, closeModal]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className='text-center space-y-6'
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className='flex justify-center'
      >
        <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center'>
          <CheckCircle className='w-10 h-10 text-green-600' />
        </div>
      </motion.div>

      {/* Success Message */}
      <div className='space-y-2'>
        <h3 className='text-xl font-semibold text-gray-900'>
          {linkType === 'base'
            ? 'Personal Collection Created!'
            : 'Topic Link Created!'}
        </h3>
        <p className='text-gray-600'>
          Your{' '}
          {linkType === 'base' ? 'personal collection' : `"${formData.title}"`}{' '}
          link is ready to share.
        </p>
      </div>

      {/* Generated URL Display */}
      {generatedUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='bg-gray-50 p-4 rounded-lg border'
        >
          <p className='text-sm text-gray-600 mb-2'>Your link:</p>
          <div className='flex items-center gap-2 bg-white p-3 rounded border'>
            <code className='flex-1 text-sm font-mono text-gray-800 truncate'>
              {generatedUrl}
            </code>
            <AnimatedCopyButton onCopy={handleCopyUrl} className='shrink-0' />
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='flex flex-col sm:flex-row gap-3 pt-4'
      >
        <GradientButton
          onClick={handleOpenExternal}
          variant='secondary'
          className='flex items-center gap-2'
        >
          <ExternalLink className='w-4 h-4' />
          Open Link
        </GradientButton>

        <GradientButton
          onClick={handleCreateAnother}
          variant='secondary'
          className='flex items-center gap-2'
        >
          <Plus className='w-4 h-4' />
          Create Another
        </GradientButton>

        <GradientButton
          onClick={handleDone}
          className='flex items-center gap-2'
        >
          Done
        </GradientButton>
      </motion.div>
    </motion.div>
  );
};
