'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TestTube, Mail, Lock, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  useCreateLinkFormStore,
  createLinkFormSelectors,
} from '../../hooks/use-create-link-form';
import { useLinksListStore } from '../../hooks/use-links-composite';
import { CreateLinkInformationStep } from '../sections/CreateLinkInformationStep';
import { LinkDetailsModal } from '../modals/link-modals';

/**
 * Comprehensive test panel for both issues:
 * 1. Email showing "No" instead of "Optional"
 * 2. Password being saved to Zustand store
 */
export const ComprehensiveTestPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLinkDetails, setShowLinkDetails] = useState(false);

  // Form store
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);
  const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
  const initializeForm = useCreateLinkFormStore(state => state.initializeForm);

  // Links store
  const { links } = useLinksListStore();

  // Create a test link based on current form data
  const testLink = {
    id: 'test_link_001',
    name:
      linkType === 'base'
        ? 'Personal Collection'
        : formData.topic || 'Test Topic',
    title: formData.title || 'Test Link',
    slug: 'test-link',
    linkType: linkType,
    isPublic: formData.isPublic,
    status: 'active' as const,
    url: 'foldly.io/testuser/test-link',
    uploads: 0,
    views: 0,
    lastActivity: new Date().toISOString(),
    createdAt: new Date().toLocaleDateString(),
    requireEmail: formData.requireEmail,
    requirePassword: formData.requirePassword,
    password: formData.password,
    maxFiles: formData.maxFiles,
    maxFileSize: (formData.maxFileSize || 100) * 1024 * 1024, // Convert MB to bytes
    allowedFileTypes: formData.allowedFileTypes || [],
    autoCreateFolders: formData.autoCreateFolders || false,
    settings: {
      allowMultiple: true,
      customMessage: formData.description,
    },
  };

  const handleStartTest = () => {
    console.log('🧪 TEST PANEL: Starting comprehensive test');

    // Initialize form for testing
    initializeForm('topic');

    // Log current state
    console.log('🧪 TEST PANEL: Current form data:', formData);
  };

  return (
    <>
      {/* Test Trigger Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='fixed bottom-44 right-4 z-50'
      >
        <Button
          onClick={() => {
            handleStartTest();
            setIsOpen(true);
          }}
          className='shadow-lg bg-teal-600 hover:bg-teal-700 text-white'
        >
          <TestTube className='w-4 h-4 mr-2' />
          Test Email + Password
        </Button>
      </motion.div>

      {/* Main Test Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <TestTube className='w-5 h-5' />
              Comprehensive Email & Password Test
            </DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Left Column - Form Test */}
            <div className='space-y-4'>
              <div className='border rounded-lg p-4'>
                <h3 className='font-medium mb-3 flex items-center gap-2'>
                  <Settings className='w-4 h-4' />
                  Link Creation Form
                </h3>
                <div className='text-sm text-muted-foreground mb-4'>
                  Test the password and email settings here:
                </div>

                {/* Embed the actual form */}
                <div className='max-h-96 overflow-y-auto border rounded p-3 bg-muted/30'>
                  <CreateLinkInformationStep />
                </div>
              </div>
            </div>

            {/* Right Column - Current State & Test Results */}
            <div className='space-y-4'>
              {/* Current Form State */}
              <div className='border rounded-lg p-4 bg-card'>
                <h3 className='font-medium mb-3 flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                  Current Form State
                </h3>

                <div className='space-y-3 text-sm'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <span className='font-medium text-muted-foreground'>
                        Email Required:
                      </span>
                      <div
                        className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium ${
                          formData.requireEmail
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {formData.requireEmail ? 'Required' : 'No'}
                      </div>
                    </div>

                    <div>
                      <span className='font-medium text-muted-foreground'>
                        Password Protection:
                      </span>
                      <div
                        className={`inline-block ml-2 px-2 py-1 rounded text-xs font-medium ${
                          formData.requirePassword
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {formData.requirePassword ? 'Enabled' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className='font-medium text-muted-foreground'>
                      Password Value:
                    </span>
                    <div className='mt-1 font-mono text-xs bg-background border rounded px-2 py-1'>
                      {formData.password
                        ? `"${formData.password}" (${formData.password.length} chars)`
                        : 'null/empty'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Link Details Modal */}
              <div className='border rounded-lg p-4 bg-card'>
                <h3 className='font-medium mb-3 flex items-center gap-2'>
                  <Lock className='w-4 h-4' />
                  Test Link Details Modal
                </h3>

                <div className='text-sm text-muted-foreground mb-3'>
                  Click to see how the values appear in the link details modal:
                </div>

                <Button
                  onClick={() => setShowLinkDetails(true)}
                  className='w-full'
                  variant='outline'
                >
                  Open Link Details Modal
                </Button>
              </div>

              {/* Test Instructions */}
              <div className='border rounded-lg p-4 bg-amber-50 border-amber-200'>
                <h3 className='font-medium mb-2 text-amber-800'>
                  Test Instructions
                </h3>
                <ol className='text-sm text-amber-700 space-y-1 list-decimal list-inside'>
                  <li>
                    Toggle the "Require Email" setting and check the state
                    display
                  </li>
                  <li>Enable "Password Protection" and enter a password</li>
                  <li>Watch the console logs for password updates</li>
                  <li>
                    Click "Open Link Details Modal" to verify the display shows
                    "No" instead of "Optional"
                  </li>
                  <li>Verify the password is saved and displayed correctly</li>
                </ol>
              </div>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button onClick={() => setIsOpen(false)} variant='outline'>
              Close Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Details Test Modal */}
      {showLinkDetails && (
        <LinkDetailsModal
          isOpen={showLinkDetails}
          onClose={() => setShowLinkDetails(false)}
          link={testLink}
        />
      )}
    </>
  );
};
