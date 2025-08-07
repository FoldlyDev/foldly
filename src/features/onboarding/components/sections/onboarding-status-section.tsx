'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/core/shadcn/card';
import { Progress } from '@/components/ui/core/shadcn/progress';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Shield,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface OnboardingStatusSectionProps {
  status: 'checking' | 'creating' | 'ready' | 'error';
  error?: string;
  progress: number;
  showFeatures?: boolean;
  onRetry?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  }),
};

const backgroundBlobVariants = {
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

const features = [
  { icon: FolderOpen, text: 'Organize files effortlessly' },
  { icon: Shield, text: 'Secure cloud storage' },
  { icon: Zap, text: 'Lightning-fast uploads' },
];

export function OnboardingStatusSection({
  status,
  error = '',
  progress,
  showFeatures = false,
  onRetry,
}: OnboardingStatusSectionProps) {
  return (
    <motion.div
      className='fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden p-4 sm:p-6 md:p-8'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          className='absolute top-1/4 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate='animate'
        />
        <motion.div
          className='absolute top-1/3 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate='animate'
          transition={{ delay: 2 }}
        />
        <motion.div
          className='absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate='animate'
          transition={{ delay: 4 }}
        />
      </div>

      <motion.div variants={itemVariants}>
        <Card className='relative w-full max-w-lg backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-800/50 shadow-2xl'>
          <div className='p-6 sm:p-8'>
            <div className='space-y-8'>
              {/* Status Icon with enhanced animations */}
              <AnimatePresence mode='wait'>
                <motion.div
                  key={status}
                  className='flex justify-center'
                  variants={iconVariants}
                  initial='hidden'
                  animate='visible'
                  exit={{ scale: 0, opacity: 0 }}
                >
                  {status === 'ready' && (
                    <div className='relative'>
                      <motion.div
                        className='absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50'
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <CheckCircle2 className='relative h-16 w-16 sm:h-20 sm:w-20 text-green-500' />
                    </div>
                  )}
                  {status === 'error' && (
                    <div className='relative'>
                      <motion.div
                        className='absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50'
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <AlertCircle className='relative h-16 w-16 sm:h-20 sm:w-20 text-red-500' />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Title and Message with fade animations */}
              <motion.div
                className='text-center space-y-3'
                variants={itemVariants}
              >
                <h1 className='text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100'>
                  {status === 'checking' && 'Checking Your Account'}
                  {status === 'creating' && 'Creating Your Workspace'}
                  {status === 'ready' && 'All Set!'}
                  {status === 'error' && 'Setup Failed'}
                </h1>
                <p className='text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-sm mx-auto'>
                  {status === 'checking' && 'Verifying your account status...'}
                  {status === 'creating' &&
                    'Almost there! Finalizing your workspace...'}
                  {status === 'ready' &&
                    'Your workspace is ready. Redirecting you now...'}
                  {status === 'error' &&
                    'We encountered an issue while setting up your workspace.'}
                </p>

                <AnimatePresence>
                  {status === 'error' && error && (
                    <motion.div
                      className='mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className='text-sm text-red-800 dark:text-red-300 font-medium mb-1'>
                        Error Details:
                      </p>
                      <p className='text-sm text-red-700 dark:text-red-400'>
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Feature list with staggered animations */}
              <AnimatePresence>
                {showFeatures && status !== 'error' && status !== 'ready' && (
                  <motion.div
                    className='space-y-3'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        className='flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300'
                        custom={index}
                        variants={featureVariants}
                        initial='hidden'
                        animate='visible'
                      >
                        <feature.icon className='h-5 w-5 text-blue-500' />
                        <span>{feature.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Progress Bar */}
              <AnimatePresence>
                {status !== 'error' && (
                  <motion.div
                    className='space-y-2'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className='relative'>
                      <Progress
                        value={progress}
                        className='h-2 bg-gray-200 dark:bg-gray-800'
                      />
                      <motion.div
                        className='absolute inset-0 flex items-center justify-center'
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                      >
                        <div
                          className='h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'
                          style={{ width: `${progress}%` }}
                        />
                      </motion.div>
                    </div>
                    <p className='text-xs text-center text-gray-600 dark:text-gray-400 font-medium'>
                      {progress.toFixed(0)}% complete
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success checkmark animation */}
              <AnimatePresence>
                {status === 'ready' && (
                  <motion.div
                    className='flex justify-center space-x-2'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className='flex space-x-1'>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className='w-2 h-2 bg-green-500 rounded-full'
                          initial={{ y: 0 }}
                          animate={{ y: [-10, 0] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Retry Button with hover effects */}
              <AnimatePresence>
                {status === 'error' && onRetry && (
                  <motion.div
                    className='flex justify-center'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Button
                      onClick={onRetry}
                      variant='default'
                      className='group'
                    >
                      <RefreshCw className='mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500' />
                      Retry Setup
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Humorous message for delays */}
              <AnimatePresence>
                {status === 'checking' && progress >= 85 && (
                  <motion.div
                    className='text-center space-y-3'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <div className='space-y-2'>
                      <p className='text-sm text-gray-700 dark:text-gray-300 font-medium'>
                        🐌 Taking a bit longer than usual...
                      </p>
                      <p className='text-xs text-gray-600 dark:text-gray-400'>
                        Don't worry! This sometimes happens when:
                      </p>
                      <div className='text-xs text-gray-600 dark:text-gray-400 space-y-1'>
                        <p>• The internet hamsters are on a coffee break ☕</p>
                        <p>
                          • Your workspace is being extra thoroughly prepared 🎁
                        </p>
                        <p>
                          • Mercury is in retrograde (we blame everything on
                          this) 🪐
                        </p>
                      </div>
                      <p className='text-xs text-gray-600 dark:text-gray-400 italic mt-3'>
                        Hang tight, we're almost there!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}