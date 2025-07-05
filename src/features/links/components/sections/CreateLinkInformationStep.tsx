'use client';

import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { LinkInformationSection } from '../sections/LinkInformationSection';
import type { LinkInformationFormData } from '../../types';
import { CreateLinkFormButtons } from '@/components/ui/create-link-form-buttons';
import { LINK_TYPE_LABELS, FORM_DEFAULTS } from '../../constants';

/**
 * Information step for create link modal
 * Uses the existing LinkInformationSection component with form store integration
 * Identical layout and design for both base and topic links - only field behavior differs
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

  // Convert form data to LinkInformationSection format - identical structure for both link types
  const linkInformationData = useMemo(
    (): LinkInformationFormData => ({
      // Use constant instead of hardcoded string
      name:
        linkType === 'base' ? LINK_TYPE_LABELS.base.name : formData.topic || '',
      description: formData.description,
      requireEmail: formData.requireEmail,
      maxFiles: formData.maxFiles,
      // Use constant instead of hardcoded value
      maxFileSize: formData.maxFileSize || FORM_DEFAULTS.maxFileSize,
      // Pass array directly to UI component for multi-select
      allowedFileTypes: formData.allowedFileTypes || [],
      // Use constant instead of hardcoded value
      autoCreateFolders:
        formData.autoCreateFolders || FORM_DEFAULTS.autoCreateFolders,
      isPublic: formData.isPublic,
      requirePassword: formData.requirePassword,
      password: formData.password,
      isActive: true, // Default to active
      ...(formData.expiresAt && { expiresAt: new Date(formData.expiresAt) }),
    }),
    [formData, linkType]
  );

  // Handle form changes
  const handleFormChange = useCallback(
    (updates: Partial<LinkInformationFormData>) => {
      console.log('📝 INFORMATION STEP: handleFormChange called');
      console.log('📝 INFORMATION STEP: updates =', updates);
      console.log('📝 INFORMATION STEP: linkType =', linkType);

      // Convert LinkInformationFormData updates to CreateLinkFormData format
      const convertedUpdates: Partial<typeof formData> = {};

      if ('name' in updates) {
        if (linkType === 'base') {
          convertedUpdates.title = updates.name;
          console.log(
            '📝 INFORMATION STEP: Base link - setting title =',
            updates.name
          );
        } else {
          // For topic links, set both topic and title fields
          convertedUpdates.topic = updates.name;
          convertedUpdates.title = updates.name; // Ensure title is also set for consistency
          console.log(
            '📝 INFORMATION STEP: Topic link - setting topic and title =',
            updates.name
          );
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
        console.log(
          '📝 INFORMATION STEP: Password protection toggled to:',
          updates.requirePassword
        );

        // Only clear password if explicitly disabling protection AND we're not also updating the password in the same change
        if (!updates.requirePassword && !('password' in updates)) {
          convertedUpdates.password = '';
          console.log(
            '📝 INFORMATION STEP: Password cleared because protection disabled'
          );
        }
      }

      if ('password' in updates) {
        convertedUpdates.password = updates.password;
        console.log(
          '📝 INFORMATION STEP: Password updated to:',
          updates.password ? '[PASSWORD SET]' : '[PASSWORD EMPTY]'
        );
      }

      if ('isPublic' in updates) {
        convertedUpdates.isPublic = updates.isPublic;
      }

      if ('maxFiles' in updates) {
        convertedUpdates.maxFiles = updates.maxFiles;
      }

      if ('maxFileSize' in updates) {
        convertedUpdates.maxFileSize = updates.maxFileSize;
      }

      if ('allowedFileTypes' in updates) {
        // Pass array directly to store - no conversion needed
        convertedUpdates.allowedFileTypes = updates.allowedFileTypes;
      }

      if ('autoCreateFolders' in updates) {
        convertedUpdates.autoCreateFolders = updates.autoCreateFolders;
      }

      if ('expiresAt' in updates && updates.expiresAt) {
        convertedUpdates.expiresAt = updates.expiresAt.toISOString();
      }

      console.log('📝 INFORMATION STEP: convertedUpdates =', convertedUpdates);
      updateMultipleFields(convertedUpdates);
    },
    [updateMultipleFields, linkType]
  );

  // Handle next step
  const handleNext = useCallback(() => {
    console.log('📝 INFORMATION STEP: handleNext called');
    console.log('📝 INFORMATION STEP: canGoNext =', canGoNext);
    console.log('📝 INFORMATION STEP: linkType =', linkType);
    console.log('📝 INFORMATION STEP: formData =', formData);

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
        errors={Object.fromEntries(
          Object.entries(fieldErrors).map(([key, value]) => [
            key,
            value as string,
          ])
        )}
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
