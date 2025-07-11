'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
  type CreateLinkFormData,
} from '../../hooks/use-create-link-form';
import { LinkInformationSection } from '../sections/LinkInformationSection';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';
import { LINK_TYPE_LABELS, FORM_DEFAULTS } from '../../lib/constants';

/**
 * Information step for create link modal
 * Uses the existing LinkInformationSection component with form store integration
 * Identical layout and design for both base and topic links - only field behavior differs
 * ALIGNED WITH DATABASE SCHEMA - Only uses database fields
 */
export const CreateLinkInformationStep = () => {
  const { user } = useUser();

  // Form store subscriptions
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const isSubmitting = useCreateLinkFormStore(
    createLinkFormSelectors.isSubmitting
  );
  const canGoNext = useCreateLinkFormStore(createLinkFormSelectors.canProceed);

  // Form actions
  const updateFormField = useCreateLinkFormStore(
    state => state.updateFormField
  );
  const nextStep = useCreateLinkFormStore(state => state.nextStep);

  // Convert form data to the format expected by LinkInformationSection (using database types)
  const linkInformationData = useMemo(
    () => ({
      // Required fields from LinkCreateForm (with defaults for missing fields)
      slug: '', // Will be generated on submit
      topic: formData.topic || '',
      linkType: linkType, // Use actual linkType from store
      title: formData.title || '',
      description: formData.description || '',

      // Optional fields from LinkCreateForm
      requireEmail: formData.requireEmail,
      requirePassword: formData.requirePassword,
      password: formData.password || '', // Convert undefined to empty string
      isPublic: formData.isPublic,
      maxFiles: formData.maxFiles,
      maxFileSize: formData.maxFileSize,
      allowedFileTypes: formData.allowedFileTypes,
      ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
      brandEnabled: formData.brandEnabled,
      ...(formData.brandColor && { brandColor: formData.brandColor }),

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
      console.log('📝 INFORMATION STEP: handleFormChange called');
      console.log('📝 INFORMATION STEP: updates =', updates);
      console.log('📝 INFORMATION STEP: linkType =', linkType);
      console.log('📝 INFORMATION STEP: current formData =', formData);

      // Convert updates to CreateLinkFormData format
      const convertedUpdates: Partial<typeof formData> = {};

      // Handle the name field which maps to different fields based on link type
      if (updates.name !== undefined) {
        if (linkType === 'base') {
          // Base links get auto-assigned titles - set a default title
          convertedUpdates.title = `${user?.username || 'user'}'s Collection`;
          console.log(
            '📝 INFORMATION STEP: Base link - auto-setting title =',
            convertedUpdates.title
          );
        } else {
          // For topic links, set both topic and title fields
          convertedUpdates.topic = String(updates.name);
          convertedUpdates.title = String(updates.name);
          console.log(
            '📝 INFORMATION STEP: Topic link - setting topic and title =',
            updates.name
          );
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

      if (updates.isPublic !== undefined) {
        convertedUpdates.isPublic = Boolean(updates.isPublic);
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

      if (updates.brandEnabled !== undefined) {
        convertedUpdates.brandEnabled = Boolean(updates.brandEnabled);
      }

      if (updates.brandColor !== undefined) {
        convertedUpdates.brandColor = String(updates.brandColor);
      }

      console.log('📝 INFORMATION STEP: convertedUpdates =', convertedUpdates);

      // Update form fields individually since updateMultipleFields doesn't exist
      Object.entries(convertedUpdates).forEach(([field, value]) => {
        updateFormField(field as keyof CreateLinkFormData, value);
      });
    },
    [updateFormField, linkType]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    console.log('📝 INFORMATION STEP: handleNext called');
    console.log('📝 INFORMATION STEP: canGoNext =', canGoNext);
    console.log('📝 INFORMATION STEP: linkType =', linkType);
    console.log('📝 INFORMATION STEP: formData =', formData);
    console.log(
      '📝 INFORMATION STEP: title length =',
      formData.title?.length || 0
    );
    console.log(
      '📝 INFORMATION STEP: topic length =',
      formData.topic?.length || 0
    );

    if (canGoNext) {
      console.log('📝 INFORMATION STEP: Calling nextStep()');
      nextStep();
    } else {
      console.log('📝 INFORMATION STEP: Cannot go next - validation failed');
    }
  }, [canGoNext, nextStep, linkType, formData]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className='space-y-6'
    >
      <LinkInformationSection
        linkType={
          linkType === 'custom' || linkType === 'generated' ? 'topic' : 'base'
        }
        formData={linkInformationData}
        onDataChange={handleFormChange}
        errors={{}}
        username={user?.username?.toLowerCase() || 'username'}
      />

      <CreateLinkFormButtons
        canGoNext={canGoNext}
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
