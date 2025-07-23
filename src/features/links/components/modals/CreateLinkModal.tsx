'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

import { Dialog, DialogContent } from '@/components/animate-ui/radix/dialog';
import { useModalStore } from '../../store';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { CreateLinkStepperHeader } from '../sections/CreateLinkStepperHeader';
import { CreateLinkInformationStep } from '../sections/CreateLinkInformationStep';
import { CreateLinkBrandingStep } from '../sections/CreateLinkBrandingStep';
import { CreateLinkSuccessStep } from '../sections/CreateLinkSuccessStep';

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
      <DialogContent className='w-[calc(100vw-2rem)] max-w-sm sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='space-y-4 md:space-y-6'>
          {/* Progress indicator */}
          <CreateLinkStepperHeader
            currentStep={currentStep}
            linkType={linkType}
          />

          {/* Step content with animations */}
          <AnimatePresence mode='wait'>
            {currentStep === 'information' && (
              <CreateLinkInformationStep key='information' />
            )}
            {currentStep === 'branding' && (
              <CreateLinkBrandingStep key='branding' />
            )}
            {currentStep === 'success' && (
              <CreateLinkSuccessStep key='success' />
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
