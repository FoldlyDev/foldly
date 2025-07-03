'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

import { Dialog, DialogContent } from '@/components/animate-ui/radix/dialog';
import {
  useLinksModalStore,
  linksModalSelectors,
} from '../../store/links-modal-store';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { CreateLinkStepperHeader } from '../sections/CreateLinkStepperHeader';
import { CreateLinkInformationStep } from '../sections/CreateLinkInformationStep';
import { CreateLinkBrandingStep } from '../sections/CreateLinkBrandingStep';
import { CreateLinkSuccessStep } from '../views/CreateLinkSuccessStep';

/**
 * Main container for the create link modal
 * Orchestrates the form flow and integrates with the modal store
 * Following 2025 architecture patterns with store integration
 */
export const CreateLinkModalContainer = () => {
  const { user } = useUser();

  // Modal store subscriptions
  const isOpen = useLinksModalStore(linksModalSelectors.isCreateLinkModalOpen);
  const modalData = useLinksModalStore(linksModalSelectors.modalData);
  const closeModal = useLinksModalStore(state => state.closeModal);

  // Form store subscriptions
  const currentStep = useCreateLinkFormStore(
    createLinkFormSelectors.currentStep
  );
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const initializeForm = useCreateLinkFormStore(state => state.initializeForm);
  const resetForm = useCreateLinkFormStore(state => state.resetForm); // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && modalData.linkType && initializeForm) {
      // Convert from modal linkType (base/topic) to store linkType (base/custom)
      const storeLinkType =
        modalData.linkType === 'topic' ? 'custom' : modalData.linkType;
      initializeForm(storeLinkType);
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
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='space-y-6'>
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
