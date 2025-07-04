'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
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

/**
 * Debug panel to test password functionality
 * Shows current password state and helps debug the store
 */
export const PasswordDebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get form data from store
  const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);

  const currentPassword = formData.password || '';
  const hasPassword = currentPassword.length > 0;
  const passwordProtectionEnabled = formData.requirePassword;

  return (
    <>
      {/* Debug Trigger Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className='fixed bottom-32 right-4 z-50'
      >
        <Button
          onClick={() => setIsOpen(true)}
          className='shadow-lg bg-purple-600 hover:bg-purple-700 text-white'
        >
          <Lock className='w-4 h-4 mr-2' />
          Debug Password
        </Button>
      </motion.div>

      {/* Password Debug Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Lock className='w-5 h-5' />
              Password Debug Panel
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Current State Display */}
            <div className='rounded-lg border border-border bg-muted/30 p-4'>
              <h3 className='font-medium mb-3'>Current Store State</h3>

              <div className='space-y-3 text-sm'>
                <div className='flex justify-between items-center'>
                  <span className='font-medium text-muted-foreground'>
                    Password Protection:
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      passwordProtectionEnabled
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {passwordProtectionEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='font-medium text-muted-foreground'>
                    Password Set:
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasPassword
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {hasPassword ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className='flex justify-between items-center'>
                  <span className='font-medium text-muted-foreground'>
                    Password Length:
                  </span>
                  <span className='font-mono text-xs bg-background px-2 py-1 rounded border'>
                    {currentPassword.length} chars
                  </span>
                </div>
              </div>
            </div>

            {/* Password Value Display */}
            {passwordProtectionEnabled && (
              <div className='rounded-lg border border-border bg-card p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='font-medium'>Password Value</h3>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4' />
                    ) : (
                      <Eye className='w-4 h-4' />
                    )}
                  </Button>
                </div>

                <div className='font-mono text-sm bg-background border rounded px-3 py-2 break-all'>
                  {hasPassword ? (
                    showPassword ? (
                      currentPassword
                    ) : (
                      '•'.repeat(currentPassword.length)
                    )
                  ) : (
                    <span className='text-muted-foreground italic'>
                      No password set
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div className='rounded-lg border border-border bg-card p-4'>
              <h3 className='font-medium mb-2'>Status</h3>
              {passwordProtectionEnabled && hasPassword && (
                <div className='flex items-center gap-2 text-green-600'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <span className='text-sm'>
                    Password protection is properly configured
                  </span>
                </div>
              )}
              {passwordProtectionEnabled && !hasPassword && (
                <div className='flex items-center gap-2 text-orange-600'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                  <span className='text-sm'>
                    Password protection enabled but no password set
                  </span>
                </div>
              )}
              {!passwordProtectionEnabled && (
                <div className='flex items-center gap-2 text-gray-600'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <span className='text-sm'>
                    Password protection is disabled
                  </span>
                </div>
              )}
            </div>

            <div className='flex justify-end'>
              <Button onClick={() => setIsOpen(false)} variant='outline'>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
