'use client';

import { motion } from 'framer-motion';
import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { LINK_TYPE_LABELS, PLACEHOLDER_TEXT } from '../../lib/constants';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useLinksStore } from '../../store/links-store';
import { LinkBrandingSection } from '../sections/LinkBrandingSection';
import { useLinksBrandingStore } from '../../hooks/use-links-composite';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';
import type { LinkInsert, LinkWithStats } from '@/lib/supabase/types';

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
  const setSuccess = useCreateLinkFormStore(state => state.setSuccess);
  const setGeneralError = useCreateLinkFormStore(
    state => state.setGeneralError
  );

  // Links store actions
  const createBaseLink = useLinksStore(state => state.createBaseLink);

  // Branding store for modal context-aware state (only database fields)
  const { brandingFormData } = useLinksBrandingStore();

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    console.log('🚀 BRANDING STEP: handleSubmit called');
    console.log('🚀 BRANDING STEP: user?.id =', user?.id);
    console.log('🚀 BRANDING STEP: linkType =', linkType);
    console.log('🚀 BRANDING STEP: formData =', formData);
    console.log('🚀 BRANDING STEP: brandingFormData =', brandingFormData);

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
      // Prepare link data for creation using database schema only
      const linkInput: Partial<LinkInsert> = {
        slug: userSlug,
        ...(linkType === 'custom' &&
          formData.topic && { topic: formData.topic }),
        title:
          linkType === 'base'
            ? LINK_TYPE_LABELS.base.title
            : formData.title || formData.topic || PLACEHOLDER_TEXT.untitled,
        ...(formData.description && { description: formData.description }),
        linkType,
        requireEmail: formData.requireEmail,
        requirePassword: formData.requirePassword,
        ...(formData.requirePassword &&
          formData.password && { passwordHash: formData.password }), // Will be hashed on server
        isPublic: formData.isPublic,
        isActive: true,
        maxFiles: formData.maxFiles,
        maxFileSize: formData.maxFileSize * 1024 * 1024, // Convert MB to bytes
        allowedFileTypes:
          formData.allowedFileTypes.length > 0
            ? formData.allowedFileTypes
            : null,
        ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
        // Database branding fields only
        brandEnabled: brandingFormData.brandEnabled,
        brandColor: brandingFormData.brandColor || null,
        // Initialize stats
        totalUploads: 0,
        totalFiles: 0,
        totalSize: 0,
        lastUploadAt: null,
      };

      console.log('🚀 BRANDING STEP: Prepared linkInput:', linkInput);

      // Create link using database service
      console.log('🚀 BRANDING STEP: Creating real link with database...');

      // Call the store's database function
      const result = await createBaseLink(linkInput as LinkInsert);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create link');
      }

      console.log('🚀 BRANDING STEP: Link created successfully:', result.data);

      // Generate URL for success message
      const generatedUrl = `foldly.io/${result.data.slug}${result.data.topic ? `/${result.data.topic}` : ''}`;

      // Update form success state
      console.log('🚀 BRANDING STEP: Setting success state...');
      setSuccess(result.data.id, generatedUrl);

      console.log('🚀 BRANDING STEP: Real link created successfully!');
      toast.success('Link created successfully!');
    } catch (error) {
      console.error('🚀 BRANDING STEP: Failed to create link:', error);
      setGeneralError('Failed to create link. Please try again.');
      toast.error('Failed to create link');
    } finally {
      setSubmitting(false);
    }
  }, [
    user?.id,
    user?.username,
    user?.firstName,
    linkType,
    formData,
    brandingFormData,
    setSubmitting,
    setSuccess,
    setGeneralError,
    createBaseLink,
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
