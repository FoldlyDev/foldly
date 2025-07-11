'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
  LINK_TYPE_LABELS,
  BUTTON_TEXT,
  NOTIFICATION_MESSAGES,
  PLACEHOLDER_TEXT,
} from '../../lib/constants';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useLinksDataStore } from '../../store/links-data-store';
import { LinkBrandingSection } from '../sections/LinkBrandingSection';
import { useLinksBrandingStore } from '../../hooks/use-links-composite';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';
import type { LinkInsert, LinkWithStats } from '@/lib/supabase/types';

// Local form type for branding data
interface LinkBrandingFormData {
  brandingEnabled: boolean;
  brandColor: string;
  accentColor: string;
  logoUrl: string;
}

/**
 * Branding step for create link modal
 * Uses the existing LinkBrandingSection component with form store integration
 * Identical layout and design for both base and topic links - only content differs
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

  // Branding store for modal context-aware state
  const { brandingFormData } = useLinksBrandingStore();

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    console.log('🚀 BRANDING STEP: handleSubmit called');
    console.log('🚀 BRANDING STEP: user?.fullName =', user?.fullName);
    console.log('🚀 BRANDING STEP: user?.firstName =', user?.firstName);
    console.log('🚀 BRANDING STEP: user?.id =', user?.id);
    console.log('🚀 BRANDING STEP: linkType =', linkType);
    console.log('🚀 BRANDING STEP: formData =', formData);

    // Use user.id as fallback if no name is available
    if (!user?.id) {
      console.log('🚀 BRANDING STEP: No user available, setting error');
      setGeneralError('User information not available');
      return;
    }

    const userSlug = (user?.username?.toLowerCase() ||
      user.firstName?.toLowerCase().replace(/\s+/g, '-') ||
      user.id ||
      'user') as string;

    console.log('🚀 BRANDING STEP: Setting submitting to true');
    setSubmitting(true);

    try {
      // Prepare link data for creation
      const linkInput: CreateUploadLinkInput = {
        slug: userSlug,
        ...(linkType === 'custom' &&
          formData.topic && { topic: formData.topic }),
        title:
          linkType === 'base'
            ? LINK_TYPE_LABELS.base.title
            : formData.title || formData.topic || PLACEHOLDER_TEXT.untitled,
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
        brandingEnabled: brandingFormData.brandingEnabled,
        ...(brandingFormData.brandColor && {
          brandColor: brandingFormData.brandColor as HexColor,
        }),
        ...(brandingFormData.accentColor && {
          accentColor: brandingFormData.accentColor as HexColor,
        }),
        ...(brandingFormData.logoUrl && { logoUrl: brandingFormData.logoUrl }),
        ...(formData.customCss && { customCss: formData.customCss }),
        ...(formData.welcomeMessage && {
          welcomeMessage: formData.welcomeMessage,
        }),
      };

      console.log('🚀 BRANDING STEP: Prepared linkInput:', linkInput);

      // Create real link using Zustand as temporary testing database
      console.log('🚀 BRANDING STEP: Creating real link...');

      const linkId = `link_${Date.now()}`;
      const generatedUrl =
        linkType === 'base'
          ? `foldly.io/${userSlug.toLowerCase()}`
          : `foldly.io/${userSlug.toLowerCase()}/${formData.topic?.toLowerCase()}`;

      console.log('🚀 BRANDING STEP: Generated linkId:', linkId);
      console.log('🚀 BRANDING STEP: Generated URL:', generatedUrl);

      // Create real link data using the linkInput and store it in Zustand
      const linkData: LinkData = {
        id: linkId,
        name:
          linkType === 'base'
            ? LINK_TYPE_LABELS.base.name
            : formData.title || formData.topic || 'Untitled',
        title:
          linkType === 'base'
            ? LINK_TYPE_LABELS.base.title
            : formData.title || formData.topic || 'Untitled',
        slug: userSlug.toLowerCase(),
        username: userSlug.toLowerCase(), // Always lowercase username
        ...(linkType === 'custom' &&
          formData.topic && { topic: formData.topic }),
        linkType,
        isPublic: formData.isPublic,
        status: 'active' as const, // Set proper status for LinkStatusIndicator
        url: generatedUrl,
        uploads: 0, // Use correct field name for LinkCard
        views: 0, // Use correct field name for analytics
        lastActivity: new Date().toISOString(),
        ...(formData.expiresAt && {
          expiresAt: new Date(formData.expiresAt).toLocaleDateString(),
        }),
        createdAt: new Date().toLocaleDateString(),
        requireEmail: formData.requireEmail,
        requirePassword: formData.requirePassword,
        maxFiles: formData.maxFiles,
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        allowedFileTypes: formData.allowedFileTypes,
        autoCreateFolders: formData.autoCreateFolders,
        settings: {
          allowMultiple: true,
          maxFileSize: `${formData.maxFileSize}MB`,
          ...(formData.description && { customMessage: formData.description }),
        },
        // Include all branding data from modal store
        brandingEnabled: brandingFormData.brandingEnabled,
        ...(brandingFormData.brandColor && {
          brandColor: brandingFormData.brandColor as HexColor,
        }),
        ...(brandingFormData.accentColor && {
          accentColor: brandingFormData.accentColor as HexColor,
        }),
        ...(brandingFormData.logoUrl && { logoUrl: brandingFormData.logoUrl }),
      };

      // Update form success state
      console.log('🚀 BRANDING STEP: Setting success state...');
      setSuccess(linkId, generatedUrl);

      // Store in Zustand (acting as temporary testing database)
      console.log(
        '🚀 BRANDING STEP: Storing link in Zustand database:',
        linkData
      );
      addLink(linkData);

      console.log('🚀 BRANDING STEP: Real link created successfully!');
      toast.success('Link created successfully!');
    } catch (error) {
      console.error('🚀 BRANDING STEP: Failed to create link:', error);
      setGeneralError('Failed to create link. Please try again.');
      toast.error('Failed to create link');
    }
  }, [
    user?.id,
    user?.fullName,
    user?.firstName,
    linkType,
    formData,
    brandingFormData,
    setSubmitting,
    setSuccess,
    setGeneralError,
    addLink,
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
