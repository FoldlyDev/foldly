'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import {
  LinkInformationSection,
  type LinkInformationFormData,
} from '../sections/link-information-section';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';

/**
 * Information step for create link modal
 * Uses the existing LinkInformationSection component with form store integration
 */
export const CreateLinkInformationStep = () => {
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
  const canGoNext = useCreateLinkFormStore(createLinkFormSelectors.canGoNext);

  // Form actions
  const updateFormField = useCreateLinkFormStore(
    state => state.updateFormField
  );
  const updateMultipleFields = useCreateLinkFormStore(
    state => state.updateMultipleFields
  );
  const nextStep = useCreateLinkFormStore(state => state.nextStep);

  // Convert form data to LinkInformationSection format
  const linkInformationData = useMemo(
    (): LinkInformationFormData => ({
      name: linkType === 'base' ? formData.title : formData.topic || '',
      description: formData.description,
      requireEmail: formData.requireEmail,
      maxFiles: formData.maxFiles,
      isPublic: formData.isPublic,
      requirePassword: formData.requirePassword,
      password: formData.password,
      isActive: true, // Default to active
      ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
    }),
    [formData, linkType]
  ); // Handle form changes
  const handleFormChange = useCallback(
    (updates: Partial<LinkInformationFormData>) => {
      // Convert LinkInformationFormData updates to CreateLinkFormData format
      const convertedUpdates: Partial<typeof formData> = {};

      if ('name' in updates) {
        if (linkType === 'base') {
          convertedUpdates.title = updates.name;
        } else {
          convertedUpdates.topic = updates.name;
        }
      }

      if ('description' in updates) {
        convertedUpdates.description = updates.description;
      }

      if ('requireEmail' in updates) {
        convertedUpdates.requireEmail = updates.requireEmail;
      }

      if ('requirePassword' in updates) {
        convertedUpdates.requirePassword = updates.requirePassword;
      }

      if ('password' in updates) {
        convertedUpdates.password = updates.password;
      }

      if ('isPublic' in updates) {
        convertedUpdates.isPublic = updates.isPublic;
      }

      if ('maxFiles' in updates) {
        convertedUpdates.maxFiles = updates.maxFiles;
      }

      if ('expiresAt' in updates && updates.expiresAt) {
        convertedUpdates.expiresAt = updates.expiresAt.toISOString();
      }

      updateMultipleFields(convertedUpdates);
    },
    [updateMultipleFields, linkType]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    if (canGoNext) {
      nextStep();
    }
  }, [canGoNext, nextStep]);

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
        errors={Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [
            key,
            value as string,
          ])
        )}
        username={user?.username || user?.firstName?.toLowerCase() || 'user'}
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
