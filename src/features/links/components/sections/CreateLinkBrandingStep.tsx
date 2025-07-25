'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { createLinkAction } from '../../lib/actions';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useModalStore } from '../../store';
import { LinkBrandingSection } from '../sections/LinkBrandingSection';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';

/**
 * Branding step for create link modal
 * Uses the existing LinkBrandingSection component with form store integration
 * Identical layout and design for both base and topic links - only content differs
 * ALIGNED WITH DATABASE SCHEMA - Only uses database fields
 */
export const CreateLinkBrandingStep = () => {
  const { user } = useUser();

  // Form store subscriptions
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const isSubmitting = useCreateLinkFormStore(
    createLinkFormSelectors.isSubmitting
  );

  // Form actions
  const previousStep = useCreateLinkFormStore(state => state.previousStep);
  const setSubmitting = useCreateLinkFormStore(state => state.setSubmitting);
  const setGeneratedUrl = useCreateLinkFormStore(
    state => state.setGeneratedUrl
  );
  const setCurrentStep = useCreateLinkFormStore(state => state.setCurrentStep);
  const setError = useCreateLinkFormStore(state => state.setError);
  const resetForm = useCreateLinkFormStore(state => state.resetForm);

  // Modal actions
  const { closeModal } = useModalStore();

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    console.log('🚀 BRANDING STEP: handleSubmit called');
    console.log('🚀 BRANDING STEP: user?.id =', user?.id);
    console.log('🚀 BRANDING STEP: linkType =', linkType);
    console.log('🚀 BRANDING STEP: formData =', formData);

    if (!user?.id) {
      console.log('🚀 BRANDING STEP: No user available, setting error');
      setError('User information not available');
      return;
    }

    console.log('🚀 BRANDING STEP: Setting submitting to true');
    setSubmitting(true);

    try {
      // Prepare link data for creation
      const linkInput = {
        title:
          linkType === 'base'
            ? 'Personal Collection'
            : formData.title || formData.topic || 'Untitled Link',
        topic: linkType === 'base' ? undefined : formData.topic,
        description: formData.description || undefined,
        requireEmail: formData.requireEmail,
        requirePassword: formData.requirePassword,
        password: formData.requirePassword ? formData.password : undefined,
        isPublic: formData.isPublic,
        isActive: formData.isActive,
        maxFiles: formData.maxFiles,
        maxFileSize: formData.maxFileSize,
        allowedFileTypes: formData.allowedFileTypes,
        expiresAt: formData.expiresAt
          ? formData.expiresAt.toISOString()
          : undefined,
        brandEnabled: formData.brandEnabled,
        brandColor: formData.brandEnabled ? formData.brandColor : undefined,
      };

      console.log('🚀 BRANDING STEP: Prepared linkInput:', linkInput);

      // Create link using server action
      const result = await createLinkAction(linkInput);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create link');
      }

      console.log('🚀 BRANDING STEP: Link created successfully:', result.data);

      // Generate URL for success message
      const generatedUrl = `foldly.io/${result.data.slug}${result.data.topic ? `/${result.data.topic}` : ''}`;

      console.log('🚀 BRANDING STEP: Real link created successfully!');
      toast.success(`Link created successfully! Visit: ${generatedUrl}`);

      // IMMEDIATELY CLOSE MODAL AND REFRESH DATA - NO PAGE REFRESH EVER!
      // 1. First close modal and reset form to prevent any race conditions

      // Close modal immediately
      closeModal();

      // Reset form state
      resetForm();

      // 2. Then refresh data after modal is closed
      setTimeout(() => {
        const refreshLinksData = (window as any).refreshLinksData;
        if (refreshLinksData) {
          console.log(
            '🔄 BRANDING STEP: Data refresh AFTER modal closed - ZERO page refresh'
          );
          refreshLinksData().catch((error: Error) => {
            console.error('Failed to refresh links:', error);
          });
        } else {
          console.warn(
            'refreshLinksData not available - check LinksContainer setup'
          );
        }
      }, 150); // Delay to ensure modal is fully closed
    } catch (error) {
      console.error('🚀 BRANDING STEP: Failed to create link:', error);
      setError('Failed to create link. Please try again.');
      toast.error('Failed to create link');
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.id,
    linkType,
    formData,
    setSubmitting,
    setGeneratedUrl,
    setCurrentStep,
    setError,
    closeModal,
    resetForm,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='space-y-6'
    >
      <LinkBrandingSection
        linkType={
          linkType === 'custom' || linkType === 'generated' ? 'topic' : 'base'
        }
        username={user?.username?.toLowerCase() || 'username'}
        linkName={
          linkType === 'base'
            ? 'Personal Collection'
            : formData.title || formData.topic || 'Untitled'
        }
        description={formData.description || ''}
      />

      <CreateLinkFormButtons
        canGoNext={true}
        canGoPrevious={true}
        isSubmitting={isSubmitting}
        onNext={handleSubmit}
        onPrevious={previousStep}
        nextLabel={isSubmitting ? 'Creating Link...' : 'Create Link'}
        previousLabel='Back to Information'
        showPrevious={true}
      />
    </motion.div>
  );
};
