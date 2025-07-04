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
      // For base links: use "Personal Collection" as hardcoded name
      // For topic links: use the custom topic name
      name: linkType === 'base' ? 'Personal Collection' : formData.topic || '',
      description: formData.description,
      requireEmail: formData.requireEmail,
      maxFiles: formData.maxFiles,
      maxFileSize: formData.maxFileSize || 100, // Default to 100MB
      // Convert array to string for UI component
      allowedFileTypes: (() => {
        if (
          !formData.allowedFileTypes ||
          formData.allowedFileTypes.length === 0
        ) {
          return 'all';
        }
        // Check for common patterns
        const types = formData.allowedFileTypes;
        if (types.includes('image/*')) return 'images';
        if (types.includes('application/pdf')) return 'documents';
        if (types.includes('video/*')) return 'media';
        if (types.includes('application/zip')) return 'archives';
        if (types.includes('text/javascript')) return 'code';
        // Custom selection
        return types.join(',');
      })(),
      autoCreateFolders: formData.autoCreateFolders || false, // Default to false
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
        // Convert UI string format to store array format
        if (updates.allowedFileTypes === 'all') {
          convertedUpdates.allowedFileTypes = []; // Empty array means all types allowed
        } else if (updates.allowedFileTypes === 'images') {
          convertedUpdates.allowedFileTypes = ['image/*'];
        } else if (updates.allowedFileTypes === 'documents') {
          convertedUpdates.allowedFileTypes = [
            'application/pdf',
            'application/msword',
            'text/*',
          ];
        } else if (updates.allowedFileTypes === 'media') {
          convertedUpdates.allowedFileTypes = ['video/*', 'audio/*'];
        } else if (updates.allowedFileTypes === 'archives') {
          convertedUpdates.allowedFileTypes = [
            'application/zip',
            'application/x-rar-compressed',
          ];
        } else if (updates.allowedFileTypes === 'code') {
          convertedUpdates.allowedFileTypes = [
            'text/javascript',
            'text/css',
            'text/html',
          ];
        } else {
          // Custom selection - split by comma
          convertedUpdates.allowedFileTypes = updates.allowedFileTypes
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);
        }
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
