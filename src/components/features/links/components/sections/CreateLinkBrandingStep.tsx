'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useLinksDataStore } from '../../store/links-data-store';
import {
  LinkBrandingSection,
  type LinkBrandingFormData,
} from '../sections/link-branding-section';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';
import type { CreateUploadLinkInput } from '../../types/database';
import type { HexColor } from '@/types';

/**
 * Branding step for create link modal
 * Uses the existing LinkBrandingSection component with form store integration
 */
export const CreateLinkBrandingStep = () => {
  const { user } = useUser();

  // Form store subscriptions
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const fieldErrors = useCreateLinkFormStore(
    createLinkFormSelectors.fieldErrors
  );
  const isSubmitting = useCreateLinkFormStore(
    createLinkFormSelectors.isSubmitting
  );

  // Form actions
  const updateMultipleFields = useCreateLinkFormStore(
    state => state.updateMultipleFields
  );
  const previousStep = useCreateLinkFormStore(state => state.previousStep);
  const setSubmitting = useCreateLinkFormStore(state => state.setSubmitting);
  const setSuccess = useCreateLinkFormStore(state => state.setSuccess);
  const setGeneralError = useCreateLinkFormStore(
    state => state.setGeneralError
  );

  // Data store actions
  const addLink = useLinksDataStore(state => state.addLink);

  // Convert form data to LinkBrandingSection format
  const linkBrandingData = useMemo(
    (): LinkBrandingFormData => ({
      brandingEnabled: formData.brandingEnabled,
      brandColor: formData.brandColor || ('#6c47ff' as HexColor),
      accentColor: formData.accentColor || ('#4ade80' as HexColor),
      logoFile: null, // File upload handled separately
    }),
    [formData]
  ); // Handle form changes
  const handleFormChange = useCallback(
    (updates: Partial<LinkBrandingFormData>) => {
      updateMultipleFields(updates);
    },
    [updateMultipleFields]
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!user?.username) {
      setGeneralError('User information not available');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare link data for creation
      const linkInput: CreateUploadLinkInput = {
        slug: user.username,
        ...(linkType === 'custom' &&
          formData.topic && { topic: formData.topic }),
        title:
          linkType === 'base'
            ? 'Personal Collection'
            : formData.title || formData.topic || 'Untitled',
        ...(formData.description && { description: formData.description }),
        ...(formData.instructions && { instructions: formData.instructions }),
        linkType,
        autoCreateFolders: formData.autoCreateFolders,
        requireEmail: formData.requireEmail,
        requirePassword: formData.requirePassword,
        ...(formData.requirePassword &&
          formData.password && { password: formData.password }),
        isPublic: formData.isPublic,
        allowFolderCreation: formData.allowFolderCreation,
        maxFiles: formData.maxFiles,
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        ...(formData.allowedFileTypes.length > 0 && {
          allowedFileTypes: formData.allowedFileTypes,
        }),
        ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
        brandingEnabled: formData.brandingEnabled,
        ...(formData.brandColor && { brandColor: formData.brandColor }),
        ...(formData.accentColor && { accentColor: formData.accentColor }),
        ...(formData.logoUrl && { logoUrl: formData.logoUrl }),
        ...(formData.customCss && { customCss: formData.customCss }),
        ...(formData.welcomeMessage && {
          welcomeMessage: formData.welcomeMessage,
        }),
      };

      // Simulate API call (replace with actual API integration)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockLinkId = `link_${Date.now()}`;
      const generatedUrl =
        linkType === 'base'
          ? `foldly.io/${user.username?.toLowerCase()}`
          : `foldly.io/${user.username?.toLowerCase()}/${formData.topic?.toLowerCase()}`;

      // Update stores
      setSuccess(mockLinkId, generatedUrl);

      // Add to data store (mock link data)
      // In real implementation, this would come from the API response
      // addLink(mockLinkData);

      toast.success('Link created successfully!');
    } catch (error) {
      console.error('Failed to create link:', error);
      setGeneralError('Failed to create link. Please try again.');
      toast.error('Failed to create link');
    }
  }, [
    user?.username,
    linkType,
    formData,
    setSubmitting,
    setSuccess,
    setGeneralError,
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
        formData={linkBrandingData}
        onDataChange={handleFormChange}
        username={user?.username || ''}
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
