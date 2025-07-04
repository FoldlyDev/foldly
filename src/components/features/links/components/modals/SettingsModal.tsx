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
import type { LinkData } from '../../types';
import type { HexColor } from '@/types';
import {
  useLinksListStore,
  useLinksModalsStore,
  useLinksBrandingStore,
} from '../../hooks/use-links-composite';

// Custom UI Components
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
} from '@/components/animate-ui/components/tabs';

// Feature Components
import { LinkBrandingSection, GeneralSettingsModalSection } from '../sections';

// Settings Modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkData;
}

export function SettingsModal({ isOpen, onClose, link }: SettingsModalProps) {
  // Connect to Zustand stores for real data operations
  const { updateLink } = useLinksListStore();
  const { setModalLoading, setModalError, modalLoading } =
    useLinksModalsStore();
  const { brandingFormData } = useLinksBrandingStore();

  // Local state for save feedback
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    timestamp?: number;
  }>({ type: null, message: '' });

  const [settings, setSettings] = useState({
    // Visibility and Security
    isPublic: link.isPublic,
    requireEmail: link.requireEmail ?? false,
    requirePassword: link.requirePassword ?? false,
    password: '',
    expiresAt: link.expiresAt,

    // File and Upload Limits
    maxFiles: link.maxFiles,
    maxFileSize: Math.round(link.maxFileSize / (1024 * 1024)), // Convert bytes to MB
    allowedFileTypes: link.allowedFileTypes,

    // Organization Settings
    autoCreateFolders: link.autoCreateFolders,

    // Legacy settings
    allowMultiple: link.settings?.allowMultiple ?? false,
    customMessage: link.settings?.customMessage || '',
  });

  // Clear save status when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSaveStatus({ type: null, message: '' });
    }
  }, [isOpen]);

  // Branding is now handled by the modal store, no local state needed

  const handleSaveSettings = async (shouldCloseAfterSave = false) => {
    try {
      setModalLoading(true);
      setModalError(null);
      setSaveStatus({ type: null, message: '' }); // Clear previous status

      // Convert UI settings back to LinkData format
      const updatedSettings = {
        isPublic: settings.isPublic,
        requireEmail: settings.requireEmail,
        requirePassword: settings.requirePassword,
        maxFiles: settings.maxFiles,
        maxFileSize: settings.maxFileSize * 1024 * 1024, // Convert MB back to bytes
        allowedFileTypes: settings.allowedFileTypes,
        autoCreateFolders: settings.autoCreateFolders,
        settings: {
          ...link.settings,
          allowMultiple: settings.allowMultiple,
          customMessage: settings.customMessage || undefined,
        },
        // Include branding data from store
        brandingEnabled: brandingFormData.brandingEnabled,
        brandColor: brandingFormData.brandColor,
        accentColor: brandingFormData.accentColor,
        logoUrl: brandingFormData.logoUrl,
      };

      // Update link in store
      updateLink(link.id, updatedSettings);

      console.log('✅ Settings saved successfully:', updatedSettings);

      if (shouldCloseAfterSave) {
        // Close modal immediately if user chose "Save & Close"
        onClose();
      } else {
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
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
        timestamp: Date.now(),
      });
    } finally {
      setModalLoading(false);
    }
  };

  const isBaseLink = link.linkType === 'base';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              <GeneralSettingsModalSection
                link={link}
                settings={settings}
                onSettingsChange={updates =>
                  setSettings(prev => ({ ...prev, ...updates }))
                }
              />
            </TabsContent>
            <TabsContent value='branding'>
              <div className='max-w-4xl'>
                <LinkBrandingSection
                  linkType={link.linkType === 'base' ? 'base' : 'topic'}
                  username={link.username}
                  linkName={link.name}
                  description={
                    settings.customMessage ||
                    'Your description will appear here'
                  }
                  errors={{}}
                  isLoading={false}
                />
              </div>
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

        {/* Actions */}
        <div className='flex items-center gap-3 pt-6 border-t border-[var(--neutral-200)]'>
          <ActionButton variant='outline' onClick={onClose} className='flex-1'>
            {saveStatus.type === 'success' ? 'Close' : 'Cancel'}
          </ActionButton>
          <ActionButton
            onClick={() => handleSaveSettings(false)}
            className='flex-1'
            disabled={modalLoading}
            variant='outline'
          >
            {modalLoading ? 'Saving...' : 'Save Changes'}
          </ActionButton>
          <ActionButton
            onClick={() => handleSaveSettings(true)}
            className='flex-1'
            disabled={modalLoading}
          >
            {modalLoading ? 'Saving...' : 'Save & Close'}
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
