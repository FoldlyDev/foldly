'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useReverification } from '@clerk/nextjs';
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from '@clerk/clerk-react/errors';
import { motion, type Variants } from 'framer-motion';
import { Card } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/shadcn/avatar';
import { Loader2, AlertCircle, User } from 'lucide-react';
import { UsernameField } from '../forms/username-field';
import { useUsernameValidation } from '../../hooks/use-username-validation';
import { completeOnboardingAction } from '../../lib/actions/onboarding-actions';

interface OnboardingFormSectionProps {
  onComplete: (username: string) => Promise<void>;
  onError: (error: string) => void;
}

// Memoize animation variants to prevent recreating on each render
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
} as const;

const backgroundBlobVariants: Variants = {
  animate: {
    x: [0, 30, -20, 0],
    y: [0, -50, 20, 0],
    scale: [1, 1.1, 0.9, 1],
    transition: {
      duration: 7,
      repeat: Infinity,
      repeatType: 'reverse' as const,
    },
  },
};

// Memoized background blobs component
const BackgroundBlobs = memo(() => (
  <div className='absolute inset-0 overflow-hidden'>
    <motion.div
      className='absolute top-1/4 -left-4 w-48 sm:w-72 h-48 sm:h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
      variants={backgroundBlobVariants}
      animate='animate'
    />
    <motion.div
      className='absolute top-1/3 -right-4 w-48 sm:w-72 h-48 sm:h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
      variants={backgroundBlobVariants}
      animate='animate'
      transition={{ delay: 2 }}
    />
    <motion.div
      className='absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
      variants={backgroundBlobVariants}
      animate='animate'
      transition={{ delay: 4 }}
    />
  </div>
));

BackgroundBlobs.displayName = 'BackgroundBlobs';

export function OnboardingFormSection({
  onComplete,
  onError,
}: OnboardingFormSectionProps) {
  const router = useRouter();
  const { user } = useUser();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Use reverification for secure username update
  const updateUsernameWithReverification = useReverification(() =>
    user?.update({ username: username.toLowerCase() })
  );

  // Real-time username validation
  const validation = useUsernameValidation(username, {
    enabled: !!username,
    debounceMs: 500,
  });

  // Memoize canSubmit to prevent unnecessary recalculations
  const canSubmit = useMemo(
    () => username && validation.isAvailable && !validation.isChecking,
    [username, validation.isAvailable, validation.isChecking]
  );

  // Memoize handleSubmit to prevent recreation on each render
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!canSubmit) return;

      setIsSubmitting(true);
      setError('');

      try {
        // Update username in Clerk first - this is required
        // Use lowercase to match Clerk's storage format
        if (user) {
          try {
            // Use reverification-enhanced update method
            await updateUsernameWithReverification();
            console.log('Username successfully updated in Clerk');
          } catch (clerkError: any) {
            // Handle if user cancels the reverification process
            if (
              isClerkRuntimeError(clerkError) &&
              isReverificationCancelledError(clerkError)
            ) {
              setError('Verification was cancelled. Please try again.');
              console.error('User cancelled reverification:', clerkError.code);
            } else if (
              clerkError.errors?.some(
                (e: any) =>
                  e.code === 'form_identifier_exists' ||
                  e.message?.toLowerCase().includes('username') ||
                  e.message?.toLowerCase().includes('already taken') ||
                  e.message?.toLowerCase().includes('already exists')
              )
            ) {
              setError('This username is already taken');
            } else {
              setError(
                'Failed to update username. Please try again or contact support.'
              );
              console.error('Failed to update username in Clerk:', clerkError);
            }
            setIsSubmitting(false);
            return; // Stop here - no database interaction if Clerk update fails
          }
        } else {
          setError('User session not found. Please refresh and try again.');
          setIsSubmitting(false);
          return;
        }

        // If parent provided onComplete callback, use that
        if (onComplete) {
          await onComplete(username);
        } else {
          // Otherwise use the default action
          const result = await completeOnboardingAction(username);

          if (result.success) {
            router.push('/dashboard/workspace');
          } else {
            const errorMsg = result.error || 'Failed to complete onboarding';
            setError(errorMsg);
            onError?.(errorMsg);
          }
        }
      } catch (err) {
        const errorMsg = 'An unexpected error occurred. Please try again.';
        setError(errorMsg);
        onError?.(errorMsg);
        console.error('Onboarding error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      canSubmit,
      user,
      username,
      updateUsernameWithReverification,
      onComplete,
      onError,
      router,
    ]
  );

  return (
    <motion.div
      className='fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden p-4 sm:p-6 md:p-8'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <BackgroundBlobs />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className='relative w-full max-w-lg backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 shadow-2xl'>
          <div className='p-6 sm:p-8'>
            <div className='space-y-8'>
              {/* User Avatar */}
              <motion.div
                className='flex justify-center'
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Avatar className='h-16 w-16 sm:h-20 sm:w-20'>
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName || 'User'}
                  />
                  <AvatarFallback>
                    <User className='h-8 w-8 sm:h-10 sm:w-10' />
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Title and Description */}
              <div className='text-center space-y-3'>
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
                  Welcome to Foldly!
                </h1>
                <p className='text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-sm mx-auto'>
                  Choose a username to complete your profile. Your personal link
                  can be changed later.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className='space-y-6'>
                <UsernameField
                  value={username}
                  onChange={setUsername}
                  validation={validation}
                  isLoading={isSubmitting}
                />

                {error && (
                  <motion.div
                    className='mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-4 w-4 text-red-500' />
                      <p className='text-sm text-red-800 dark:text-red-300'>
                        {error}
                      </p>
                    </div>
                  </motion.div>
                )}

                <Button
                  type='submit'
                  disabled={!canSubmit || isSubmitting}
                  className='w-full'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Creating your workspace...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
