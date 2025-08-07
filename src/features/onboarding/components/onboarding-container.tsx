'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
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
import {
  checkWorkspaceStatusAction,
  createWorkspaceAction,
} from '@/features/workspace/lib/actions/workspace-actions';

// Configuration constants
const WEBHOOK_WAIT_TIME = 3000;
const MIN_DISPLAY_TIME = 2000;
const PROGRESS_UPDATE_INTERVAL = 100;
const WORKSPACE_CHECK_INTERVAL = 500;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
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
      ease: "easeOut" as const,
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
      repeatType: "reverse" as const,
    },
  },
};

export function OnboardingContainer() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [status, setStatus] = useState<'checking' | 'creating' | 'ready' | 'error'>('checking');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  const loadStartTime = useRef<number>(Date.now());
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      router.push('/sign-in');
      return;
    }

    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let progressIntervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkWorkspace = async () => {
      try {
        const result = await checkWorkspaceStatusAction();
        return result.success && result.data?.exists;
      } catch (err) {
        console.error('Error checking workspace:', err);
        return false;
      }
    };

    const createWorkspaceIfNeeded = async () => {
      setStatus('creating');
      setProgress(90);

      try {
        const result = await createWorkspaceAction();
        if (result.success) {
          setStatus('ready');
          setProgress(100);

          const elapsedTime = Date.now() - loadStartTime.current;
          const remainingTime = Math.max(500, MIN_DISPLAY_TIME - elapsedTime);

          setTimeout(() => {
            router.push('/dashboard/workspace');
          }, remainingTime);
        } else {
          throw new Error(result.error || 'Failed to create workspace');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create workspace');
        setStatus('error');
        setProgress(0);
      }
    };

    const handleWorkspaceReady = () => {
      setStatus('ready');
      setProgress(100);

      const elapsedTime = Date.now() - loadStartTime.current;
      const remainingTime = Math.max(500, MIN_DISPLAY_TIME - elapsedTime);

      setTimeout(() => {
        router.push('/dashboard/workspace');
      }, remainingTime);
    };

    const startChecking = async () => {
      loadStartTime.current = Date.now();
      
      setTimeout(() => setShowFeatures(true), 600);

      const progressStep = 85 / (WEBHOOK_WAIT_TIME / PROGRESS_UPDATE_INTERVAL);
      progressIntervalId = setInterval(() => {
        setProgress(prev => {
          const next = prev + progressStep;
          return next >= 85 ? 85 : next;
        });
      }, PROGRESS_UPDATE_INTERVAL);

      const initialExists = await checkWorkspace();
      if (initialExists) {
        clearInterval(progressIntervalId);
        handleWorkspaceReady();
        return;
      }

      intervalId = setInterval(async () => {
        const exists = await checkWorkspace();
        if (exists) {
          clearInterval(intervalId);
          clearInterval(progressIntervalId);
          clearTimeout(timeoutId);
          handleWorkspaceReady();
        }
      }, WORKSPACE_CHECK_INTERVAL);

      timeoutId = setTimeout(async () => {
        clearInterval(intervalId);
        clearInterval(progressIntervalId);

        const exists = await checkWorkspace();
        if (!exists) {
          await createWorkspaceIfNeeded();
        } else {
          handleWorkspaceReady();
        }
      }, WEBHOOK_WAIT_TIME);
    };

    startChecking();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (progressIntervalId) clearInterval(progressIntervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId, isLoaded, router]);

  const handleRetry = () => {
    hasCheckedRef.current = false;
    setStatus('checking');
    setError('');
    setProgress(0);
    setShowFeatures(false);
    loadStartTime.current = Date.now();
    router.refresh();
  };

  const features = [
    { icon: FolderOpen, text: 'Organize files effortlessly' },
    { icon: Shield, text: 'Secure cloud storage' },
    { icon: Zap, text: 'Lightning-fast uploads' },
  ];

  if (!isLoaded) {
    return null;
  }

  return (
    <motion.div 
      className='fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden'
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div 
          className='absolute top-1/4 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate="animate"
        />
        <motion.div 
          className='absolute top-1/3 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate="animate"
          transition={{ delay: 2 }}
        />
        <motion.div 
          className='absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 dark:opacity-30'
          variants={backgroundBlobVariants}
          animate="animate"
          transition={{ delay: 4 }}
        />
      </div>

      <motion.div variants={itemVariants}>
        <Card className='relative w-full max-w-lg backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border-gray-200/50 dark:border-gray-800/50 shadow-2xl'>
          <div className='p-8'>
            <div className='space-y-8'>
              {/* Status Icon with enhanced animations */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={status}
                  className='flex justify-center'
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ scale: 0, opacity: 0 }}
                >
                  {status === 'ready' && (
                    <div className='relative'>
                      <motion.div 
                        className='absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50'
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <CheckCircle2 className='relative h-20 w-20 text-green-500' />
                    </div>
                  )}
                  {status === 'error' && (
                    <div className='relative'>
                      <motion.div 
                        className='absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50'
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <AlertCircle className='relative h-20 w-20 text-red-500' />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Title and Message with fade animations */}
              <motion.div 
                className='text-center space-y-3'
                variants={itemVariants}
              >
                <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent'>
                  {status === 'checking' && 'Preparing Your Workspace'}
                  {status === 'creating' && 'Creating Your Workspace'}
                  {status === 'ready' && 'All Set!'}
                  {status === 'error' && 'Setup Failed'}
                </h1>
                <p className='text-base text-muted-foreground max-w-sm mx-auto'>
                  {status === 'checking' && 'Setting up your personal file management system...'}
                  {status === 'creating' && 'Almost there! Finalizing your workspace...'}
                  {status === 'ready' && 'Your workspace is ready. Redirecting you now...'}
                  {status === 'error' && 'We encountered an issue while setting up your workspace.'}
                </p>
                
                <AnimatePresence>
                  {status === 'error' && error && (
                    <motion.div 
                      className='mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg'
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className='text-sm text-red-700 dark:text-red-400 font-medium mb-1'>
                        Error Details:
                      </p>
                      <p className='text-sm text-red-600 dark:text-red-300'>
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
                        className='flex items-center gap-3 text-sm text-muted-foreground'
                        custom={index}
                        variants={featureVariants}
                        initial="hidden"
                        animate="visible"
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
                      <Progress value={progress} className='h-2 bg-gray-200 dark:bg-gray-800' />
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
                    <p className='text-xs text-center text-muted-foreground font-medium'>
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
                            repeatType: "reverse",
                            delay: i * 0.1 
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Retry Button with hover effects */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div 
                    className='flex justify-center'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <Button 
                      onClick={handleRetry} 
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
                      <p className='text-sm text-muted-foreground font-medium'>
                        🐌 Taking a bit longer than usual...
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Don't worry! This sometimes happens when:
                      </p>
                      <div className='text-xs text-muted-foreground space-y-1'>
                        <p>• The internet hamsters are on a coffee break ☕</p>
                        <p>• Your workspace is being extra thoroughly prepared 🎁</p>
                        <p>• Mercury is in retrograde (we blame everything on this) 🪐</p>
                      </div>
                      <p className='text-xs text-muted-foreground italic mt-3'>
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