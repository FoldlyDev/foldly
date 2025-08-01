'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { GradientButton } from '@/components/ui/core/gradient-button';
import { ActionButton } from '@/components/ui/core/action-button';
import { useModalStore } from '../../store';
import { useQuickStart } from '../../hooks/use-quick-start';
import { getDisplayDomain } from '@/lib/config/url-config';
import {
  Link2,
  Plus,
  Sparkles,
  User,
  Globe,
  ArrowRight,
  Crown,
  Target,
  Zap,
} from 'lucide-react';

interface EmptyLinksStateProps {
  readonly onRefreshDashboard?: () => void; // For refreshing dashboard after base link creation
}

export function EmptyLinksState({ onRefreshDashboard }: EmptyLinksStateProps) {
  const { user } = useUser();
  const { openCreateModal } = useModalStore();

  // Local loading state to persist until component unmounts
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Quick start hook with clean separation of concerns
  const { quickStart, isLoading, username } = useQuickStart({
    onSuccess: () => {
      onRefreshDashboard?.();
      // Keep loading state true until component unmounts
      // This prevents the brief flash of empty state before populated state loads
    },
  });

  // Fallback username for display purposes
  const displayUsername = username || 'your-username';
  
  // Get the display domain from centralized configuration
  const displayDomain = getDisplayDomain();

  // Enhanced quick start function that manages local loading state
  const handleQuickStart = async () => {
    setIsCreatingLink(true);
    await quickStart();
    // Don't set isCreatingLink to false here - let it persist until component unmounts
  };

  // Show loading state if either hook is loading or local state is true
  const showLoadingState = isLoading || isCreatingLink;

  // If loading, show loading state overlay
  if (showLoadingState) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className='flex flex-col items-center justify-center py-16 px-8 text-center'
      >
        {/* Loading Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
          className='mb-8'
        >
          <div className='relative'>
            {/* Background Glow */}
            <div className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 via-transparent to-[var(--secondary)]/20 rounded-full blur-3xl scale-150' />

            {/* Loading Spinner Container */}
            <div className='relative bg-gradient-to-br from-[var(--primary-subtle)] to-white rounded-3xl p-8 border border-[var(--neutral-200)] shadow-lg'>
              <div className='w-16 h-16 mx-auto'>
                <div className='w-16 h-16 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin' />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='max-w-md mx-auto space-y-4'
        >
          <h2 className='text-2xl font-bold text-[var(--quaternary)]'>
            Setting up your base link...
          </h2>

          <p className='text-[var(--neutral-600)]'>
            Creating your personalized collection hub at{' '}
            <span className='font-mono text-[var(--primary)]'>
              {displayDomain}/{displayUsername}
            </span>
          </p>

          <div className='flex items-center justify-center gap-2 text-sm text-[var(--neutral-500)]'>
            <div className='w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse' />
            <span>This will only take a moment</span>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className='flex flex-col items-center justify-center py-16 px-8 text-center'
    >
      {/* Foundation Crown Illustration */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
        className='mb-8'
      >
        <div className='relative'>
          {/* Background Glow */}
          <div
            className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 via-transparent to-[var(--secondary)]/20 
                        rounded-full blur-3xl scale-150'
          />

          {/* Main Icon Container */}
          <div
            className='relative bg-gradient-to-br from-[var(--primary-subtle)] to-white 
                        rounded-3xl p-8 border border-[var(--neutral-200)] shadow-lg'
          >
            <Crown className='w-16 h-16 text-[var(--primary)] mx-auto' />

            {/* Sparkle Effects */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              }}
              className='absolute -top-2 -right-2'
            >
              <Sparkles className='w-6 h-6 text-[var(--secondary)]' />
            </motion.div>

            <motion.div
              animate={{
                rotate: -360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
              className='absolute -bottom-1 -left-1'
            >
              <div className='w-3 h-3 bg-[var(--tertiary)] rounded-full opacity-60' />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className='max-w-2xl mx-auto mb-8'
      >
        <h2 className='text-3xl font-bold text-[var(--quaternary)] mb-6'>
          Create Your Base Link
        </h2>

        <p className='text-lg text-[var(--neutral-600)] leading-relaxed max-w-lg mx-auto'>
          Your personal hub for collecting files from clients and collaborators.
        </p>
      </motion.div>

      {/* URL Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className='bg-gradient-to-br from-[var(--primary-subtle)] to-[var(--secondary-subtle)] 
                   border border-[var(--primary)]/30 rounded-xl p-5 mb-10 max-w-md mx-auto'
      >
        <div className='flex items-center justify-center gap-2 text-sm text-[var(--tertiary)] mb-3'>
          <Globe className='w-4 h-4' />
          <span>Your Link</span>
        </div>
        <div className='text-xl font-mono text-[var(--quaternary)] font-bold'>
          {displayDomain}/
          <span className='text-[var(--primary)]'>{displayUsername}</span>
        </div>
      </motion.div>

      {/* Actions & Descriptions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className='space-y-6 mb-8'
      >
        {/* Two-column layout for better alignment */}
        <div className='flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto'>
          {/* Quick Start Option */}
          <div className='flex-1 text-center space-y-3'>
            <GradientButton
              variant='primary'
              size='lg'
              onClick={handleQuickStart}
              disabled={showLoadingState}
              className='group shadow-brand text-lg px-8 py-4 w-full h-[60px] flex items-center justify-center gap-3'
            >
              {showLoadingState ? (
                <>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Setting up...
                </>
              ) : (
                <>
                  <Zap className='w-6 h-6' />
                  Quick Start
                  <ArrowRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
                </>
              )}
            </GradientButton>
            <div className='space-y-1'>
              <p className='font-medium text-[var(--quaternary)] text-sm'>
                ⚡ Ready in seconds
              </p>
              <p className='text-xs text-[var(--neutral-600)]'>
                We'll set up "{displayUsername}" as your link and get you
                started right away
              </p>
            </div>
          </div>

          {/* Custom Setup Option */}
          <div className='flex-1 text-center space-y-3'>
            <ActionButton
              variant='outline'
              size='lg'
              onClick={() => {
                console.log('🔥 EMPTY STATE: Custom Setup button clicked');
                openCreateModal('base');
                console.log('🔥 EMPTY STATE: openCreateModal("base") called');
              }}
              disabled={showLoadingState}
              className='text-lg px-8 py-4 border-2 w-full h-[60px] flex items-center justify-center gap-3'
            >
              <Crown className='w-6 h-6' />
              Custom Setup
            </ActionButton>
            <div className='space-y-1'>
              <p className='font-medium text-[var(--quaternary)] text-sm'>
                👑 Make it yours
              </p>
              <p className='text-xs text-[var(--neutral-600)]'>
                Choose your perfect URL and configure everything to your liking
              </p>
            </div>
          </div>
        </div>

        {/* Reassurance Message */}
        <div className='text-[var(--neutral-500)] text-sm max-w-md mx-auto pt-4 border-t border-[var(--neutral-200)]'>
          <p>Don't worry—you can always change everything later! ✨</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
