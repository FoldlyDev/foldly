/**
 * Enhanced Settings Form Hook with React Hook Form + Zod + Zustand Integration
 * Following 2025 best practices for dynamic save button management
 *
 * Features:
 * - Automatic dirty state tracking
 * - Dynamic save button visibility
 * - "Close" vs "Save" button text (no cancel button)
 * - Zustand state synchronization
 * - Type-safe validation with Zod
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useZodForm } from '@/lib/hooks/use-zod-form';
import {
  generalSettingsSchema,
  type GeneralSettingsFormData,
} from '../lib/validations/forms';
import { useLinksModalStore } from '../store/links-modal-store';
import { useLinksDataStore } from '../store/links-data-store';
import type { LinkWithStats } from '@/lib/supabase/types';

export interface UseSettingsFormEnhancedReturn {
  // Form control
  form: ReturnType<typeof useZodForm<typeof generalSettingsSchema>>;

  // Link data
  linkData: LinkWithStats | null;

  // Form state
  isSubmitting: boolean;
  isDirty: boolean;
  hasUnsavedChanges: boolean;

  // Dynamic button states
  shouldShowSaveButton: boolean;
  shouldShowSaveAndCloseButton: boolean;
  saveButtonText: string;
  cancelButtonText: string;

  // Actions
  handleSave: (data: GeneralSettingsFormData) => Promise<boolean>;
  handleSaveAndClose: () => Promise<void>;
  handleCancel: () => void;
  resetForm: () => void;

  // Utility
  isLoading: boolean;
}

export const useSettingsFormEnhanced = (): UseSettingsFormEnhancedReturn => {
  // Get modal and data stores
  const modalStore = useLinksModalStore();
  const linkDataStore = useLinksDataStore();

  // Get the current link data from modal context
  const linkData = modalStore.modalData.linkData || null;

  // Create initial form values matching generalSettingsSchema
  const initialFormValues = useMemo(() => {
    if (!linkData) {
      return {
        // Schema fields with defaults
        isPublic: true,
        requireEmail: false,
        requirePassword: false,
        password: '',
        maxFiles: 100,
        maxFileSize: 100, // MB in form, converted to bytes in action
        allowedFileTypes: [] as string[],
        expiresAt: undefined,
        brandEnabled: false,
        brandColor: '',
        // Form-only fields from schema
        allowMultiple: true,
        autoCreateFolders: false,
        customMessage: '',
      };
    }

    // Convert readonly array to mutable array for form compatibility
    const fileTypes = Array.isArray(linkData.allowedFileTypes)
      ? [...linkData.allowedFileTypes]
      : [];

    return {
      // Schema fields from linkData
      isPublic: linkData.isPublic,
      requireEmail: linkData.requireEmail,
      requirePassword: linkData.requirePassword,
      password: '', // Don't populate existing password
      maxFiles: linkData.maxFiles,
      maxFileSize: Math.round(linkData.maxFileSize / (1024 * 1024)), // Convert bytes to MB
      allowedFileTypes: fileTypes,
      expiresAt: linkData.expiresAt
        ? linkData.expiresAt.toISOString().split('T')[0]
        : undefined,
      brandEnabled: linkData.brandEnabled,
      brandColor: linkData.brandColor || '',
      // Form-only fields with defaults
      allowMultiple: true,
      autoCreateFolders: false,
      customMessage: '',
    };
  }, [linkData]);

  // Initialize form with Zod validation
  const form = useZodForm({
    schema: generalSettingsSchema,
    defaultValues: initialFormValues,
  });

  const { formState, reset } = form;
  const { isDirty, isSubmitting } = formState;

  // Reset form when linkData changes
  useEffect(() => {
    reset(initialFormValues);
  }, [reset, initialFormValues]);

  // Handle save action - only update database fields
  const handleSave = useCallback(
    async (data: GeneralSettingsFormData): Promise<boolean> => {
      try {
        if (!linkData?.id) {
          throw new Error('No link data available');
        }

        // Only update database fields available in the schema
        await linkDataStore.updateLink(linkData.id, {
          isPublic: data.isPublic,
          requireEmail: data.requireEmail,
          requirePassword: data.requirePassword,
          passwordHash: data.password
            ? Buffer.from(data.password).toString('base64')
            : linkData.passwordHash,
          maxFiles: data.maxFiles,
          maxFileSize: data.maxFileSize * 1024 * 1024, // Convert MB to bytes
          allowedFileTypes:
            data.allowedFileTypes.length > 0 ? data.allowedFileTypes : null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          brandEnabled: data.brandEnabled,
          brandColor: data.brandColor || null,
        });

        // Mark form as clean after successful save
        reset(data, { keepValues: true });

        return true;
      } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
      }
    },
    [linkDataStore, linkData, reset]
  );

  // Handle save and close action
  const handleSaveAndClose = useCallback(async () => {
    const formData = form.getValues();
    const success = await handleSave(formData);
    if (success) {
      modalStore.closeModal();
    }
  }, [form, handleSave, modalStore]);

  // Handle cancel/close action (no confirmation needed)
  const handleCancel = useCallback(() => {
    modalStore.closeModal();
  }, [modalStore]);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    reset(initialFormValues);
  }, [reset, initialFormValues]);

  // Dynamic button logic for realtime setup
  const shouldShowSaveButton = isDirty;
  const shouldShowSaveAndCloseButton = isDirty;
  const hasUnsavedChanges = isDirty;

  // Button text logic - "Close" when no changes, "Cancel" when there are changes
  const saveButtonText = 'Save';
  const cancelButtonText = isDirty ? 'Cancel' : 'Close';

  return {
    form,
    linkData,
    isSubmitting,
    isDirty,
    hasUnsavedChanges,
    shouldShowSaveButton,
    shouldShowSaveAndCloseButton,
    saveButtonText,
    cancelButtonText,
    handleSave,
    handleSaveAndClose,
    handleCancel,
    resetForm,
    isLoading: isSubmitting,
  };
};
