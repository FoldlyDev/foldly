'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/radix/dialog';
import { ActionButton } from '@/components/ui/action-button';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import { GeneralSettingsModalSection } from '../sections/GeneralSettingsModalSection';
import {
  generalSettingsSchema,
  type GeneralSettingsFormData,
} from '../../lib/validations';
import type { Link } from '@/lib/supabase/types';
import { useUpdateLinkMutation } from '../../hooks/react-query/use-update-link-mutation';

export function SettingsModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal, setLoading } = useModalStore();

  const isOpen = currentModal === 'link-settings';

  // React Query mutation hook
  const updateLink = useUpdateLinkMutation();

  // React Hook Form setup with 2025 patterns
  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    mode: 'onChange', // 2025 best practice for real-time validation
    defaultValues: {
      description: '',
      isPublic: true,
      isActive: true,
      requireEmail: false,
      requirePassword: false,
      password: '',
      maxFiles: 100,
      maxFileSize: 10,
      allowedFileTypes: [],
      brandEnabled: false,
      brandColor: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = form;

  const isSubmitting = updateLink.isPending;

  // Initialize form with real link data when modal opens
  // Following 2025 React Hook Form best practices for async data loading
  useEffect(() => {
    if (link && isOpen) {
      console.log('🔧 SETTINGS MODAL: Loading real link data into form:', link);

      // Use reset() to properly set form values after async data load
      // This is the recommended pattern from React Hook Form documentation
      reset({
        description: link.description || '',
        isPublic: link.isPublic,
        isActive: link.isActive,
        requireEmail: link.requireEmail,
        requirePassword: link.requirePassword,
        password: '', // Never pre-fill passwords for security
        maxFiles: link.maxFiles,
        maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
        allowedFileTypes: link.allowedFileTypes || [],
        brandEnabled: link.brandEnabled,
        brandColor: link.brandColor || '',
        expiresAt: link.expiresAt
          ? new Date(link.expiresAt).toISOString().slice(0, 16)
          : '',
      });

      console.log('✅ SETTINGS MODAL: Form initialized with link data');
    }
  }, [link, isOpen, reset]);

  if (!isOpen || !link) return null;

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setLoading(true);

    try {
      const updates = {
        description: data.description || undefined,
        isPublic: data.isPublic ?? true,
        isActive: data.isActive ?? true,
        requireEmail: data.requireEmail ?? false,
        requirePassword: data.requirePassword ?? false,
        password:
          data.requirePassword && data.password ? data.password : undefined,
        maxFiles: data.maxFiles ?? 100,
        maxFileSize: data.maxFileSize ?? 10, // Keep as MB - action will convert to bytes
        allowedFileTypes: data.allowedFileTypes?.length
          ? data.allowedFileTypes
          : undefined,
        expiresAt: data.expiresAt || undefined,
        brandEnabled: data.brandEnabled ?? false,
        brandColor:
          data.brandEnabled && data.brandColor ? data.brandColor : undefined,
      };

      // Use React Query mutation with proper structure
      await updateLink.mutateAsync({
        id: link.id,
        ...updates,
      });

      // Success handling and UI updates are handled by the mutation hook
      closeModal();
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Error handling is also managed by the mutation hook
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!shouldClose) return;
    }
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-md sm:max-w-xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-[var(--quaternary)] flex items-center gap-2'>
            <Settings className='w-5 h-5' />
            Link Settings
          </DialogTitle>
          <DialogDescription className='text-[var(--neutral-600)]'>
            Configure how &quot;{link.title}&quot; works for uploaders
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='pt-6 space-y-6'>
          {/* General Settings Section */}
          <GeneralSettingsModalSection
            link={{
              ...link,
              stats: {
                fileCount: link.totalFiles || 0,
                batchCount: 0,
                folderCount: 0,
                totalViewCount: 0,
                uniqueViewCount: 0,
                averageFileSize:
                  link.totalFiles > 0
                    ? (link.totalSize || 0) / link.totalFiles
                    : 0,
                storageUsedPercentage: 0,
                isNearLimit: false,
              },
            }}
            form={form}
          />

          {/* Action Buttons */}
          <div className='flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-[var(--neutral-200)]'>
            <ActionButton
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
              className='flex-1'
            >
              Cancel
            </ActionButton>

            <ActionButton
              type='submit'
              variant='default'
              disabled={isSubmitting || !isDirty || !isValid}
              className='flex-1 flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Saving...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  Save Settings
                </>
              )}
            </ActionButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
