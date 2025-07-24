'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/animate-ui/radix/dialog';
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
      <DialogContent className='w-[calc(100vw-1rem)] max-w-md sm:max-w-lg lg:max-w-3xl h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-4rem)] p-0 overflow-hidden'>
        <div className="modal-content">
          {/* Accessibility Labels */}
          <DialogTitle className="sr-only">
            {linkType === 'base' ? 'Create Your Base Link' : 'Create Topic Link'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {linkType === 'base' 
              ? 'Set up your personal file collection hub' 
              : 'Create a topic-specific collection space'}
          </DialogDescription>

          {/* Compact Header with Responsive Design */}
          <div className="relative overflow-hidden modal-gradient-blue border-b border-gray-200/50">
            {/* Static Decorative Background - responsive */}
            <div className="modal-decoration-overlay" />
            <div className="absolute top-0 right-0 w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-24 sm:-translate-y-32 lg:-translate-y-48 translate-x-24 sm:translate-x-32 lg:translate-x-48" />
            
            {/* Compact Header with Gradient Title */}
            <div className="relative p-4 sm:p-6">
              <div className="text-center mb-6">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-normal modal-title-gradient-blue mb-2">
                  {linkType === 'base' ? 'Create Your Base Link' : 'Create Topic Link'}
                </h1>
                <div className="flex justify-center">
                  <p className="text-sm sm:text-base text-gray-600 text-center max-w-md">
                    {linkType === 'base' ? 'Set up your personal file collection hub' : 'Create a topic-specific collection space'}
                  </p>
                </div>
              </div>
              
              <CreateLinkStepperHeader
                currentStep={currentStep}
                linkType={linkType}
              />
            </div>
          </div>

          {/* Content Area - Responsive with proper vertical padding */}
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-12 max-h-[65vh] sm:max-h-[70vh] lg:max-h-[75vh] overflow-y-auto">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
