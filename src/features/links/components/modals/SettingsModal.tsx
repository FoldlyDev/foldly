'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Sliders, Palette } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/ui/animate-ui/components/tabs';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import { LinkSettingsForm } from '../sections/LinkSettingsForm';
import { BrandingSettingsForm } from '../sections/BrandingSettingsForm';
import {
  generalSettingsSchema,
  type GeneralSettingsFormData,
} from '../../lib/validations/forms';
import { useUpdateLinkMutation } from '../../hooks/react-query/use-update-link-mutation';
import { useSlugValidation } from '../../hooks/use-slug-validation';
import { useTopicValidation } from '../../hooks/use-topic-validation';
import { useStorageTracking } from '@/lib/hooks/use-storage-tracking';

export function SettingsModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal, setLoading } = useModalStore();

  const isOpen = currentModal === 'link-settings';

  // Get storage information for percentage calculations
  const storageQuery = useStorageTracking();
  const storageInfo = storageQuery.data;

  // React Query mutation hook
  const updateLink = useUpdateLinkMutation();

  // React Hook Form setup with 2025 patterns
  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    mode: 'onChange', // 2025 best practice for real-time validation
    defaultValues: {
      slug: '',
      topic: '',
      title: '',
      description: '',
      isActive: true,
      requireEmail: false,
      requirePassword: false,
      password: '',
      maxFiles: 100,
      maxFileSize: 5, // 5MB (Supabase deployment limit)
      allowedFileTypes: [],
      branding: undefined,
      expiresAt: undefined,
    },
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty, isValid },
  } = form;

  const watchedValues = watch();
  const isSubmitting = updateLink.isPending;

  // Add slug validation for base links
  const slugValidation = useSlugValidation(watchedValues.slug || '', {
    enabled: link?.linkType === 'base',
    ...(link?.id && { excludeId: link.id }),
    debounceMs: 500,
  });

  // Add topic validation for topic/custom links
  const topicValidation = useTopicValidation(watchedValues.topic || '', {
    enabled: link?.linkType === 'custom',
    ...(link?.id && { excludeId: link.id }),
    ...(link?.userId && { userId: link.userId }),
    ...(link?.slug && { slug: link.slug }),
    debounceMs: 500,
  });

  // Enhanced validation that includes slug availability
  const canSubmit = useMemo(() => {
    console.log('🔧 SETTINGS MODAL: Checking canSubmit', {
      isDirty,
      isValid,
      isSubmitting,
      linkType: link?.linkType,
      slug: watchedValues.slug,
      topic: watchedValues.topic,
      slugValidation: {
        isAvailable: slugValidation.isAvailable,
        isChecking: slugValidation.isChecking,
      },
      topicValidation: {
        isAvailable: topicValidation.isAvailable,
        isChecking: topicValidation.isChecking,
      },
    });

    if (!isDirty || !isValid || isSubmitting) return false;

    // For base links, check slug validation if slug is provided
    if (link?.linkType === 'base') {
      // If slug is provided, it must be available
      if (watchedValues.slug) {
        const result = slugValidation.isAvailable && !slugValidation.isChecking;
        console.log(
          '🔧 SETTINGS MODAL: Base link with slug validation result:',
          result
        );
        return result;
      }
      // If no slug (empty), it's valid (will use username)
      console.log('🔧 SETTINGS MODAL: Base link with empty slug - valid');
      return true;
    }

    // For topic/custom links, check topic validation if topic is provided
    if (link?.linkType === 'custom') {
      // If topic is provided, it must be available
      if (watchedValues.topic) {
        const result =
          topicValidation.isAvailable && !topicValidation.isChecking;
        console.log(
          '🔧 SETTINGS MODAL: Custom link with topic validation result:',
          result
        );
        return result;
      }
      // Topic is required for custom links, so empty is not valid
      console.log('🔧 SETTINGS MODAL: Custom link with empty topic - invalid');
      return false;
    }

    console.log('🔧 SETTINGS MODAL: Default case - valid');
    return true;
  }, [
    isDirty,
    isValid,
    isSubmitting,
    link?.linkType,
    watchedValues.slug,
    slugValidation.isAvailable,
    slugValidation.isChecking,
    watchedValues.topic,
    topicValidation.isAvailable,
    topicValidation.isChecking,
  ]);

  // Initialize form with real link data when modal opens
  // Following 2025 React Hook Form best practices for async data loading
  useEffect(() => {
    if (link && isOpen) {
      console.log('🔧 SETTINGS MODAL: Loading real link data into form:', link);

      // Use reset() to properly set form values after async data load
      // This is the recommended pattern from React Hook Form documentation
      reset({
        slug: link.slug || '',
        topic: link.topic || '',
        title: link.title || '',
        description: link.description || '',
        isActive: link.isActive,
        requireEmail: link.requireEmail,
        requirePassword: link.requirePassword,
        password: link.passwordHash
          ? Buffer.from(link.passwordHash, 'base64').toString()
          : '', // Decode password for editing
        maxFiles: link.maxFiles,
        maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
        allowedFileTypes: link.allowedFileTypes || [],
        branding: link.branding || undefined,
        expiresAt: link.expiresAt ? new Date(link.expiresAt) : undefined,
      });

      console.log('✅ SETTINGS MODAL: Form initialized with link data');
    }
  }, [link, isOpen, reset]);

  if (!isOpen || !link) return null;

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setLoading(true);

    try {
      const updates = {
        slug: data.slug || undefined,
        topic: data.topic || undefined,
        title: data.title || undefined,
        description: data.description || undefined,
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
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : undefined,
        branding: data.branding,
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
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Link Settings: {link.title}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Configure how "{link.title}" works for uploaders including privacy,
          security, and upload restrictions
        </DialogDescription>
        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                <Sliders className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                  Link Settings
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                  Configure how "{link.title}" works for uploaders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area with Tabs */}
        <div className='flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 py-4'>
          <Tabs defaultValue='general' className='h-full flex flex-col'>
            <TabsList className='grid w-full grid-cols-2 mb-6'>
              <TabsTrigger value='general'>
                <Sliders className='w-4 h-4 mr-2' />
                General Settings
              </TabsTrigger>
              <TabsTrigger value='branding'>
                <Palette className='w-4 h-4 mr-2' />
                Branding
              </TabsTrigger>
            </TabsList>

            <TabsContents className='flex-1 overflow-y-auto'>
              <TabsContent value='general' className='h-full'>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className='space-y-6 max-w-2xl mx-auto pb-6'
                >
                  {/* General Settings Section */}
                  <LinkSettingsForm
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
                        storageUsedPercentage: storageInfo?.usagePercentage || 0,
                        isNearLimit: false,
                      },
                    }}
                    form={form}
                  />
                </form>
              </TabsContent>

              <TabsContent value='branding' className='h-full'>
                <div className='max-w-2xl mx-auto pb-6'>
                  <BrandingSettingsForm
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
                        storageUsedPercentage: storageInfo?.usagePercentage || 0,
                        isNearLimit: false,
                      },
                    }}
                    form={form}
                  />
                </div>
              </TabsContent>
            </TabsContents>
          </Tabs>
        </div>

        {/* Modal Footer */}
        <div className='modal-footer mt-auto p-4 sm:p-6 lg:p-8 shrink-0'>
          <div className='flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={handleCancel}
              disabled={isSubmitting}
              className='w-full sm:w-auto min-w-0 sm:min-w-[100px] border-border hover:bg-muted/50 hover:border-border/80 transition-all duration-200'
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!canSubmit}
              variant='outline'
              className='w-full sm:w-auto min-w-0 sm:min-w-[140px] border-border hover:bg-muted/50 hover:border-border/80 transition-all duration-200'
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin' />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
