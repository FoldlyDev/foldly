'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useModalStore } from '../../store';
import { useCreateLinkMutation } from '../../hooks/react-query/use-create-link-mutation';
import { LinkBrandingSection } from '../sections/LinkBrandingSection';
import { CreateLinkFormButtons } from '@/components/ui/core/create-link-form-buttons';
import { DEFAULT_BASE_LINK_TITLE } from '../../lib/constants/base-link-defaults';

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

  // Form actions
  const previousStep = useCreateLinkFormStore(state => state.previousStep);
  const setError = useCreateLinkFormStore(state => state.setError);
  const resetForm = useCreateLinkFormStore(state => state.resetForm);
  const updateFormField = useCreateLinkFormStore(
    state => state.updateFormField
  );

  // Modal actions
  const { closeModal } = useModalStore();

  // React Query mutation hook
  const createLink = useCreateLinkMutation();
  const isSubmitting = createLink.isPending;

  // Handle branding form changes
  const handleBrandingChange = useCallback(
    (updates: any) => {
      // Map nested branding structure to flat form structure
      if (updates.branding) {
        if (updates.branding.enabled !== undefined) {
          updateFormField('brandEnabled', updates.branding.enabled);
        }
        if (updates.branding.color !== undefined) {
          updateFormField('brandColor', updates.branding.color);
        }
        if (updates.branding.image !== undefined) {
          updateFormField('logoUrl', updates.branding.image);
        }
      }
    },
    [updateFormField]
  );

  // Prepare branding form data for the LinkBrandingSection
  const brandingFormData = {
    branding: {
      enabled: formData.brandEnabled || false,
      color: formData.brandColor || '#6c47ff',
      image: formData.logoUrl || '',
    },
  };

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      setError('User information not available');
      return;
    }

    try {
      // Prepare link data for creation
      const linkInput = {
        title:
          linkType === 'base'
            ? formData.title || DEFAULT_BASE_LINK_TITLE // Use form title, fallback to centralized default
            : formData.title || formData.topic || 'Untitled Link',
        slug: linkType === 'base' ? formData.topic || '' : undefined, // For base links, topic field is actually the slug
        topic: linkType === 'base' ? null : formData.topic || undefined, // Base links have no topic
        description: formData.description || undefined,
        requireEmail: formData.requireEmail,
        requirePassword: formData.requirePassword,
        password: formData.requirePassword ? formData.password : undefined,
        isActive: formData.isActive,
        maxFiles: formData.maxFiles,
        maxFileSize: formData.maxFileSize,
        allowedFileTypes: formData.allowedFileTypes,
        expiresAt: formData.expiresAt
          ? formData.expiresAt.toISOString()
          : undefined,
        branding: formData.brandEnabled ? {
          enabled: formData.brandEnabled,
          color: formData.brandColor,
          image: formData.logoUrl,
        } : undefined,
      };

      // Create link using React Query mutation
      await createLink.mutateAsync(linkInput);

      // Close modal and reset form
      closeModal();
      resetForm();
    } catch (error) {
      console.error('Failed to create link:', error);
      setError('Failed to create link. Please try again.');
    }
  }, [
    user?.id,
    linkType,
    formData,
    createLink,
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
            ? DEFAULT_BASE_LINK_TITLE
            : formData.title || formData.topic || 'Untitled'
        }
        description={formData.description || ''}
        formData={brandingFormData}
        onDataChange={handleBrandingChange}
        errors={{}}
        isLoading={isSubmitting}
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
