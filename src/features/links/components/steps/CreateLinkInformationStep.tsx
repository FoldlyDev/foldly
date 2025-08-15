'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
  type CreateLinkFormData,
} from '../../hooks/use-create-link-form';
import { LinkCreationForm } from '../sections/LinkCreationForm';
import { CreateLinkFormButtons } from '@/components/ui/core/create-link-form-buttons';
import { LINK_TYPE_LABELS, FORM_DEFAULTS } from '../../lib/constants';
import { useSlugValidation } from '../../hooks/use-slug-validation';
import { useTopicValidation } from '../../hooks/use-topic-validation';
import { useLinksQuery } from '../../hooks/react-query/use-links-query';

/**
 * Information step for create link modal
 * Uses the existing LinkCreationForm component with form store integration
 * Identical layout and design for both base and topic links - only field behavior differs
 * ALIGNED WITH DATABASE SCHEMA - Only uses database fields
 */
export const CreateLinkInformationStep = () => {
  const { user } = useUser();

  // Get user's links to find their base link slug
  const { data: links } = useLinksQuery();

  // Find the user's base link slug
  const userBaseSlug = useMemo(() => {
    const baseLink = links?.find(
      link => link.linkType === 'base' && !link.topic
    );
    return baseLink?.slug || user?.username?.toLowerCase() || 'username';
  }, [links, user?.username]);

  // Form store subscriptions
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const isSubmitting = useCreateLinkFormStore(
    createLinkFormSelectors.isSubmitting
  );
  const canGoNext = useCreateLinkFormStore(createLinkFormSelectors.canProceed);

  // Add slug validation for base links
  const slugValidation = useSlugValidation(formData.slug || '', {
    enabled: linkType === 'base',
    debounceMs: 500,
  });

  // Add topic validation for topic links
  const topicValidation = useTopicValidation(formData.topic || '', {
    enabled: linkType === 'custom' || linkType === 'generated',
    ...(user?.id && { userId: user.id }),
    slug: userBaseSlug,
    debounceMs: 500,
  });

  // Form actions
  const updateFormField = useCreateLinkFormStore(
    state => state.updateFormField
  );
  const nextStep = useCreateLinkFormStore(state => state.nextStep);

  // Convert form data to the format expected by LinkCreationForm (using database types)
  const linkInformationData = useMemo(
    () => ({
      // Required fields from LinkCreateForm (with defaults for missing fields)
      slug: formData.slug || '', // Allow editing the slug
      topic: formData.topic || '',
      linkType: linkType, // Use actual linkType from store
      title: formData.title || '',
      description: formData.description || '',

      // Optional fields from LinkCreateForm
      requireEmail: formData.requireEmail,
      requirePassword: formData.requirePassword,
      password: formData.password || '', // Convert undefined to empty string
      maxFiles: formData.maxFiles,
      maxFileSize: formData.maxFileSize,
      allowedFileTypes: formData.allowedFileTypes,
      ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
      branding: formData.branding || { enabled: false },

      // Additional field for UI (now included in CreateLinkFormData)
      isActive: formData.isActive,

      // Backwards compatibility field (maps to topic)
      name:
        linkType === 'base'
          ? LINK_TYPE_LABELS.base.name
          : formData.topic || formData.title || '',
    }),
    [formData, linkType]
  );

  // Handle form changes with proper typing
  const handleFormChange = useCallback(
    (updates: Record<string, any>) => {
      // Convert updates to CreateLinkFormData format
      const convertedUpdates: Partial<typeof formData> = {};

      // Handle the slug field for base links
      if (updates.slug !== undefined) {
        convertedUpdates.slug = String(updates.slug);
      }

      // Handle the name field which maps to different fields based on link type
      if (updates.name !== undefined) {
        if (linkType === 'base') {
          // Base links get auto-assigned titles - set a default title
          convertedUpdates.title = 'Base link';
        } else {
          // For topic links, set both topic and title fields
          convertedUpdates.topic = String(updates.name);
          convertedUpdates.title = String(updates.name);
        }
      }

      // Handle other fields
      if (updates.description !== undefined) {
        convertedUpdates.description = String(updates.description);
      }

      if (updates.requireEmail !== undefined) {
        convertedUpdates.requireEmail = Boolean(updates.requireEmail);
      }

      if (updates.requirePassword !== undefined) {
        convertedUpdates.requirePassword = Boolean(updates.requirePassword);
        console.log(
          '📝 INFORMATION STEP: Password protection toggled to:',
          updates.requirePassword
        );

        // Only clear password if explicitly disabling protection
        if (!updates.requirePassword && updates.password === undefined) {
          convertedUpdates.password = '';
          console.log(
            '📝 INFORMATION STEP: Password cleared because protection disabled'
          );
        }
      }

      if (updates.password !== undefined) {
        convertedUpdates.password = String(updates.password);
        console.log(
          '📝 INFORMATION STEP: Password updated to:',
          updates.password ? '[PASSWORD SET]' : '[PASSWORD EMPTY]'
        );
      }


      if (updates.isActive !== undefined) {
        convertedUpdates.isActive = Boolean(updates.isActive);
      }

      if (updates.maxFiles !== undefined) {
        convertedUpdates.maxFiles = Number(updates.maxFiles);
      }

      if (updates.maxFileSize !== undefined) {
        convertedUpdates.maxFileSize = Number(updates.maxFileSize);
      }

      if (updates.allowedFileTypes !== undefined) {
        convertedUpdates.allowedFileTypes = Array.isArray(
          updates.allowedFileTypes
        )
          ? updates.allowedFileTypes
          : [];
      }

      if (
        updates.expiresAt !== undefined &&
        updates.expiresAt instanceof Date
      ) {
        convertedUpdates.expiresAt = updates.expiresAt;
      }

      if (updates.branding !== undefined) {
        convertedUpdates.branding = updates.branding;
      }

      // Update form fields individually since updateMultipleFields doesn't exist
      Object.entries(convertedUpdates).forEach(([field, value]) => {
        updateFormField(field as keyof CreateLinkFormData, value);
      });
    },
    [updateFormField, linkType]
  );

  // Enhanced validation logic including slug and topic validation
  const canProceedToNext = useMemo(() => {
    // Basic form validation
    if (!canGoNext) return false;

    // Password validation - if password protection is enabled, password must be 8+ characters
    if (
      formData.requirePassword &&
      (!formData.password || formData.password.length < 8)
    ) {
      return false;
    }

    // For base links, also check slug validation
    if (linkType === 'base') {
      // If slug is provided, it must be available
      if (formData.slug) {
        return slugValidation.isAvailable && !slugValidation.isChecking;
      }
      // If no slug provided, it's OK (will use username)
      return true;
    }

    // For topic links, check topic validation
    if (linkType === 'custom' || linkType === 'generated') {
      // If topic is provided, it must be available
      if (formData.topic) {
        return topicValidation.isAvailable && !topicValidation.isChecking;
      }
      // Topic is required for topic links
      return false;
    }

    return true;
  }, [
    canGoNext,
    linkType,
    formData.slug,
    formData.topic,
    formData.requirePassword,
    formData.password,
    slugValidation.isAvailable,
    slugValidation.isChecking,
    topicValidation.isAvailable,
    topicValidation.isChecking,
  ]);

  // Handle next step
  const handleNext = useCallback(() => {
    if (canProceedToNext) {
      nextStep();
    }
  }, [canProceedToNext, nextStep]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='space-y-6'
    >
      <LinkCreationForm
        linkType={
          linkType === 'custom' || linkType === 'generated' ? 'topic' : 'base'
        }
        formData={linkInformationData}
        onDataChange={handleFormChange}
        errors={{}}
        username={userBaseSlug}
      />

      <CreateLinkFormButtons
        canGoNext={canProceedToNext}
        canGoPrevious={false}
        isSubmitting={isSubmitting}
        onNext={handleNext}
        onPrevious={() => {}}
        nextLabel='Continue to Branding'
        showPrevious={false}
      />
    </motion.div>
  );
};
