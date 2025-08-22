'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { Link2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
import { useModalStore } from '../../store';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { CreateLinkStepperHeader } from '../steps/CreateLinkStepperHeader';
import { CreateLinkInformationStep } from '../steps/CreateLinkInformationStep';
import { CreateLinkBrandingStep } from '../steps/CreateLinkBrandingStep';
import { CreateLinkSuccessStep } from '../steps/CreateLinkSuccessStep';

/**
 * Create Link Modal Component
 * Multi-step wizard for creating new links (base or custom/topic)
 * Following 2025 architecture patterns with proper modal structure
 */
export const CreateLinkModal = () => {
  const { user } = useUser();

  // Modal store subscriptions
  const { activeModal, modalData, closeModal } = useModalStore();
  const isOpen = activeModal === 'create-link';

  // Form store subscriptions
  const currentStep = useCreateLinkFormStore(
    createLinkFormSelectors.currentStep
  );
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const initializeForm = useCreateLinkFormStore(state => state.initializeForm);
  const resetForm = useCreateLinkFormStore(state => state.resetForm);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && modalData.linkType && initializeForm) {
      // Use the linkType directly from modalData (it's already the correct LinkType)
      console.log(
        '🎪 CREATE LINK MODAL: Initializing form with linkType:',
        modalData.linkType
      );
      initializeForm(modalData.linkType);
    }
  }, [isOpen, modalData.linkType, initializeForm]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (currentStep !== 'success' && resetForm) {
      resetForm();
    }
    closeModal();
  }, [currentStep, resetForm, closeModal]);

  // Don't render if user is not available
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          {linkType === 'base' ? 'Base link setup' : 'Topic link setup'}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          {linkType === 'base'
            ? 'Set up your Personal Collection Link where people can upload files'
            : 'Create a dedicated Custom Topic Link for collecting specific types of files'}
        </DialogDescription>

        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                <Link2 className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground'>
                  {linkType === 'base' ? 'Base link setup' : 'Topic link setup'}
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                  {linkType === 'base'
                    ? 'Set up your Personal Collection Link where people can upload files'
                    : 'Create a dedicated Custom Topic Link for collecting specific types of files'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper Section */}
        <div className='px-4 sm:px-6 lg:px-8'>
          <CreateLinkStepperHeader
            currentStep={currentStep}
            linkType={linkType}
          />
        </div>
        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6'>
          {/* Step content with clean animations - no extra containers */}
          <AnimatePresence mode='wait'>
            {currentStep === 'information' && (
              <motion.div
                key='information'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <CreateLinkInformationStep />
              </motion.div>
            )}
            {currentStep === 'branding' && (
              <motion.div
                key='branding'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <CreateLinkBrandingStep />
              </motion.div>
            )}
            {currentStep === 'success' && (
              <motion.div
                key='success'
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <CreateLinkSuccessStep />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
