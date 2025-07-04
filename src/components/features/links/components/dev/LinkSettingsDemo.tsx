'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  LinkInformationSection,
  type LinkInformationFormData,
} from '../sections/link-information-section';

/**
 * Demo component to test all the new settings
 * Shows how the information step now includes file size, file types, and auto-create folders
 */
export const LinkSettingsDemo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<LinkInformationFormData>({
    name: 'Demo Collection',
    description: 'Testing all the new settings...',
    requireEmail: false,
    maxFiles: 50,
    maxFileSize: 100,
    allowedFileTypes: 'all',
    autoCreateFolders: false,
    isPublic: true,
    requirePassword: false,
    password: '',
    isActive: true,
  });

  const handleDataChange = (updates: Partial<LinkInformationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    console.log('💧 SETTINGS DEMO: Updated data:', updates);
    console.log('📊 SETTINGS DEMO: Full form data:', {
      ...formData,
      ...updates,
    });
  };

  return (
    <>
      {/* Demo Trigger Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='fixed bottom-20 right-4 z-50'
      >
        <Button
          onClick={() => setIsOpen(true)}
          className='shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground'
        >
          <Settings className='w-4 h-4 mr-2' />
          Test New Settings
        </Button>
      </motion.div>

      {/* Settings Demo Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              Link Settings Demo
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Information Section with New Settings */}
            <LinkInformationSection
              linkType='topic'
              username='demo-user'
              formData={formData}
              onDataChange={handleDataChange}
            />

            {/* Current Values Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='rounded-lg border border-border bg-muted/30 p-4'
            >
              <div className='flex items-center gap-2 mb-3'>
                <Eye className='w-4 h-4 text-primary' />
                <h3 className='font-medium'>Current Settings Values</h3>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
                <div className='space-y-2'>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Max Files:
                    </span>
                    <span className='ml-2'>{formData.maxFiles}</span>
                  </div>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Max File Size:
                    </span>
                    <span className='ml-2'>{formData.maxFileSize} MB</span>
                  </div>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      File Types:
                    </span>
                    <span className='ml-2'>{formData.allowedFileTypes}</span>
                  </div>
                </div>
                <div className='space-y-2'>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Auto-organize:
                    </span>
                    <span className='ml-2'>
                      {formData.autoCreateFolders ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Require Email:
                    </span>
                    <span className='ml-2'>
                      {formData.requireEmail ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Password Protected:
                    </span>
                    <span className='ml-2'>
                      {formData.requirePassword ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className='flex justify-end'>
              <Button onClick={() => setIsOpen(false)} variant='outline'>
                Close Demo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
