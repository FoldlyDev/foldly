'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Use existing database types as single source of truth
import type {
  LinkCreateForm,
  LinkUpdateForm,
} from '@/lib/database/types/links';
import type { LinkType } from '@/lib/database/types/enums';

// Local form types
type ValidationError = string;

// Use existing database types - no custom redefinition
interface LinkInformationFormData extends LinkCreateForm {
  // Additional fields from LinkUpdateForm that we need
  isActive?: boolean;
  // Backwards compatibility field (maps to topic)
  name?: string;
}

// Import URL utility functions
import {
  generateUrlSlug,
  validateTopicName,
  generateTopicUrl,
} from '../../lib/utils';
import { useSlugValidation } from '../../hooks/use-slug-validation';
import { useTopicValidation } from '../../hooks/use-topic-validation';
import { useUser } from '@clerk/nextjs';
import { getDisplayDomain } from '@/lib/config/url-config';

// Import modular sections
import {
  LinkSlugField,
  LinkTopicNameField,
  LinkDescriptionField,
  LinkExpirationDate,
  LinkStatusControls,
  LinkPasswordProtection,
  UploaderEmailRequirement,
  UploadFileLimits,
  UploadFileTypeRestrictions,
} from '../forms/creation';

interface LinkCreationFormProps {
  readonly linkType: 'base' | 'topic';
  readonly username: string; // This will be the user's actual base slug, not username
  readonly formData: LinkInformationFormData;
  readonly onDataChange: (data: Partial<LinkInformationFormData>) => void;
  readonly errors?: Partial<
    Record<keyof LinkInformationFormData, ValidationError>
  >;
  readonly isLoading?: boolean;
}

// Import centralized constants - Following 2025 best practices
import {
  FILE_TYPE_OPTIONS,
  FILE_SIZE_OPTIONS,
  DEFAULT_FILE_TYPES,
  DEFAULT_FILE_SIZES,
} from '../../lib/constants';

// Transform centralized constants for local use
const fileOptions = [5, 10, 25, 50, 100];
const fileSizeOptions = FILE_SIZE_OPTIONS.map(option => ({
  value: parseInt(option.value),
  label: option.label,
}));
const fileTypeOptions = FILE_TYPE_OPTIONS;

// Default values from constants
const defaultMaxFileSize = parseInt(DEFAULT_FILE_SIZES); // 10 MB
const defaultFileTypes = DEFAULT_FILE_TYPES === '*' ? [] : [DEFAULT_FILE_TYPES];

export function LinkCreationForm({
  linkType,
  username: baseSlug, // Rename for clarity - this is the user's base link slug
  formData,
  onDataChange,
  errors,
  isLoading = false,
}: LinkCreationFormProps) {
  const { user } = useUser();

  // Real-time slug validation for base links (Calendly-style)
  const slugValidation = useSlugValidation(formData.slug || '', {
    enabled: linkType === 'base',
    debounceMs: 500,
  });

  // Real-time URL generation with validation
  // Use 'topic' field from database schema, fallback to 'name' for compatibility
  const topicValue = formData.topic || formData.name || '';

  // Real-time topic validation for topic links
  const topicValidation = useTopicValidation(topicValue, {
    enabled: linkType === 'topic' && !!user?.id,
    ...(user?.id && { userId: user.id }),
    slug: baseSlug,
    debounceMs: 500,
  });

  const urlData = useMemo(() => {
    const displayDomain = getDisplayDomain();
    
    if (linkType === 'base') {
      const slug = formData.slug || baseSlug;
      return {
        displayUrl: `${displayDomain}/${slug}`,
        slug: formData.slug || '',
        isValidTopic: true,
        topicError: null,
      };
    }

    const formatValidation = validateTopicName(topicValue);
    const slug = topicValue ? generateUrlSlug(topicValue) : '';
    const displayUrl = topicValue
      ? generateTopicUrl(baseSlug, topicValue)
      : `${displayDomain}/${baseSlug}/[topic-name]`;

    // Combine format validation and uniqueness validation
    const isValidTopic =
      formatValidation.isValid && (topicValidation.isAvailable || !topicValue);
    const topicError =
      formatValidation.error ||
      (topicValidation.isUnavailable ? topicValidation.message : null);

    return {
      displayUrl,
      slug,
      isValidTopic,
      topicError,
    };
  }, [
    linkType,
    baseSlug,
    topicValue,
    formData.slug,
    topicValidation.isAvailable,
    topicValidation.isUnavailable,
    topicValidation.message,
  ]);

  return (
    <div className='space-y-6'>
      {/* Form Fields */}
      <div className='space-y-4 sm:space-y-6'>
        {/* Base Link Slug Field - Only for base links */}
        {linkType === 'base' && (
          <LinkSlugField
            formData={formData}
            onDataChange={onDataChange}
            baseSlug={baseSlug}
            slugValidation={slugValidation}
            isLoading={isLoading}
          />
        )}

        {/* Collection Name / Topic Field - Only for topic links */}
        {linkType === 'topic' && (
          <LinkTopicNameField
            topicValue={topicValue}
            onDataChange={onDataChange}
            topicValidation={topicValidation}
            urlData={urlData}
            errors={errors}
            isLoading={isLoading}
          />
        )}

        {/* Description Field */}
        <LinkDescriptionField
          formData={formData}
          onDataChange={onDataChange}
          linkType={linkType}
          errors={errors}
          isLoading={isLoading}
        />

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='space-y-4'
        >
          <h3 className='text-sm font-medium text-foreground'>Settings</h3>

          <div className='rounded-lg border border-border bg-card p-4 space-y-4'>
            {/* Expiry Date Field - Only for topic links */}
            {linkType === 'topic' && (
              <LinkExpirationDate
                formData={formData}
                onDataChange={onDataChange}
                errors={errors}
                isLoading={isLoading}
              />
            )}

            {/* Link Status and Visibility Toggles */}
            <LinkStatusControls
              formData={formData}
              onDataChange={onDataChange}
              isLoading={isLoading}
            />

            {/* Password Protection Toggle */}
            <LinkPasswordProtection
              formData={formData}
              onDataChange={onDataChange}
              isLoading={isLoading}
            />

            {/* Email Requirement Toggle */}
            <UploaderEmailRequirement
              formData={formData}
              onDataChange={onDataChange}
              isLoading={isLoading}
            />

            {/* File Limits */}
            <UploadFileLimits
              formData={formData}
              onDataChange={onDataChange}
              fileOptions={fileOptions}
              fileSizeOptions={fileSizeOptions}
              defaultMaxFileSize={defaultMaxFileSize}
              isLoading={isLoading}
            />

            {/* File Type Restrictions */}
            <UploadFileTypeRestrictions
              formData={formData}
              onDataChange={onDataChange}
              fileTypeOptions={fileTypeOptions}
              isLoading={isLoading}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
