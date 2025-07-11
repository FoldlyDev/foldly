'use client';

import * as React from 'react';
import { useState } from 'react';
import { Settings, Crown, CheckCircle, AlertCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/radix/dialog';
import { ActionButton } from '@/components/ui/action-button';

// Import centralized types instead of defining our own
import type { LinkWithStats } from '@/lib/supabase/types';
import type { HexColor } from '@/types';
import {
  useLinksListStore,
  useLinksModalsStore,
  useLinksBrandingStore,
  useLinksSettingsStore,
} from '../../hooks/use-links-composite';

// Import the enhanced settings form hook
import { useSettingsFormEnhanced } from '../../hooks/use-settings-form';

// Custom UI Components
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/animate-ui/components/tabs';

// Import the sections
import {
  GeneralSettingsModalSection,
  BrandingSettingsSection,
} from '../sections';

// Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData;
}

export function SettingsModal({ isOpen, onClose, link }: SettingsModalProps) {
  // Use the enhanced settings form hook for dynamic button behavior
  const {
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
    isLoading: formLoading,
  } = useSettingsFormEnhanced();

  // Connect to other stores for additional operations
  const { updateLink } = useLinksListStore();
  const {
    setModalLoading,
    setModalError,
    isLoading: modalLoading,
  } = useLinksModalsStore();
  const { brandingFormData } = useLinksBrandingStore();

  // Local state for save feedback
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    timestamp?: number;
  }>({ type: null, message: '' });

  // Use the enhanced form's loading state
  const isLoading = formLoading || modalLoading;

  // Clear save status when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSaveStatus({ type: null, message: '' });
    }
  }, [isOpen]);

  // Enhanced save function that provides feedback
  const handleSaveWithFeedback = async (shouldClose = false) => {
    try {
      setSaveStatus({ type: null, message: '' }); // Clear previous status

      if (shouldClose) {
        await handleSaveAndClose();
        // Modal will be closed by the enhanced hook
      } else {
        const success = await handleSave(form.getValues());

        if (success) {
          // Show success message and keep modal open
          setSaveStatus({
            type: 'success',
            message:
              'Settings saved successfully! You can continue editing or close the modal.',
            timestamp: Date.now(),
          });

          // Auto-clear success message after 5 seconds
          setTimeout(() => {
            setSaveStatus(prev =>
              prev.type === 'success' ? { type: null, message: '' } : prev
            );
          }, 5000);
        }
      }
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
        timestamp: Date.now(),
      });
    }
  };

  // Enhanced cancel function
  const handleCancelWithConfirmation = () => {
    if (hasUnsavedChanges) {
      handleCancel(); // This will show confirmation if needed
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancelWithConfirmation}>
      <DialogContent
        className='max-w-5xl max-h-[90vh] overflow-y-auto bg-white border border-[var(--neutral-200)]'
        from='left'
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
      >
        <DialogHeader>
          <DialogTitle className='text-xl font-bold text-[var(--quaternary)] flex items-center gap-2'>
            <Settings className='w-5 h-5' />
            Link Settings
          </DialogTitle>
          <DialogDescription className='text-[var(--neutral-600)]'>
            Configure how &quot;{link.name}&quot; works for uploaders
            {hasUnsavedChanges && (
              <span className='ml-2 text-amber-600 font-medium'>
                • Unsaved changes
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='general' className='pt-6'>
          <TabsList className='w-full mb-6'>
            <TabsTrigger value='general' className='flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              General Settings
            </TabsTrigger>
            <TabsTrigger value='branding' className='flex items-center gap-2'>
              <Crown className='w-4 h-4' />
              Brand Settings
            </TabsTrigger>
          </TabsList>
          <TabsContents>
            <TabsContent value='general'>
              <GeneralSettingsModalSection link={link} form={form} />
            </TabsContent>
            <TabsContent value='branding' className='space-y-6 mt-6'>
              <BrandingSettingsSection form={form} link={link} />
            </TabsContent>
          </TabsContents>
        </Tabs>

        {/* Status Message */}
        {saveStatus.type && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              saveStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle className='w-5 h-5 text-green-600' />
            ) : (
              <AlertCircle className='w-5 h-5 text-red-600' />
            )}
            <span className='text-sm font-medium'>{saveStatus.message}</span>
          </div>
        )}

        {/* Dynamic Actions Based on Form State */}
        <div className='flex items-center gap-3 pt-6 border-t border-[var(--neutral-200)]'>
          {/* Cancel/Close Button - Always visible */}
          <ActionButton
            variant='outline'
            onClick={handleCancelWithConfirmation}
            className='flex-1'
            disabled={isLoading}
          >
            {cancelButtonText}
          </ActionButton>

          {/* Save Button - Only shows when there are changes */}
          {shouldShowSaveButton && (
            <ActionButton
              onClick={() => handleSaveWithFeedback(false)}
              className='flex-1'
              disabled={isLoading}
              variant='outline'
            >
              {isLoading ? 'Saving...' : saveButtonText}
            </ActionButton>
          )}

          {/* Save & Close Button - Only shows when there are changes */}
          {shouldShowSaveAndCloseButton && (
            <ActionButton
              onClick={() => handleSaveWithFeedback(true)}
              className='flex-1'
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save & Close'}
            </ActionButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
