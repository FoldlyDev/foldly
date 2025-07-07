'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { GradientButton } from '@/components/ui';
import { LinkCreationModal } from './link-creation-modal';
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
  const [isBaseLinkModalOpen, setIsBaseLinkModalOpen] = useState(false);

  // Get username from Clerk user data
  const username =
    user?.username || user?.firstName?.toLowerCase() || 'your-username';
  const baseUrl = `foldly.io/${username}`;

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
        <h2 className='text-3xl font-bold text-[var(--quaternary)] mb-3'>
          Set Up Your Base Link
        </h2>

        <p className='text-lg text-[var(--neutral-600)] mb-4 font-medium'>
          Your personal file collection hub
        </p>

        <p className='text-[var(--neutral-500)] leading-relaxed max-w-lg mx-auto'>
          Your base link unlocks custom topic links and makes file sharing
          effortless. Collect files from clients and collaborators with ease.
        </p>
      </motion.div>

      {/* URL Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className='bg-gradient-to-br from-[var(--primary-subtle)] to-[var(--secondary-subtle)] 
                   border border-[var(--primary)]/30 rounded-xl p-4 mb-8 max-w-md mx-auto'
      >
        <div className='flex items-center justify-center gap-2 text-sm text-[var(--tertiary)] mb-2'>
          <User className='w-4 h-4' />
          <span>Your Base URL Preview</span>
        </div>
        <code className='text-lg font-mono text-[var(--quaternary)] font-semibold'>
          {baseUrl}
        </code>
      </motion.div>

      {/* Foundation Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto'
      >
        {[
          {
            icon: Crown,
            title: 'Permanent Identity',
            description: 'Your dedicated file collection space',
            gradient: 'from-[var(--primary-subtle)] to-[var(--primary-light)]',
            iconColor: 'text-[var(--primary)]',
          },
          {
            icon: Target,
            title: 'Custom Links',
            description: 'Create topic-specific upload links',
            gradient:
              'from-[var(--secondary-subtle)] to-[var(--secondary-light)]',
            iconColor: 'text-[var(--secondary)]',
          },
          {
            icon: Globe,
            title: 'Memorable URL',
            description: 'Easy to share and remember',
            gradient: 'from-[var(--tertiary-subtle)] to-white',
            iconColor: 'text-[var(--tertiary)]',
          },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className='p-4 bg-white rounded-xl border border-[var(--neutral-200)] shadow-sm hover:shadow-md transition-shadow'
          >
            <div
              className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-3 mx-auto`}
            >
              <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
            </div>
            <h3 className='font-semibold text-[var(--quaternary)] text-sm mb-1'>
              {feature.title}
            </h3>
            <p className='text-[var(--neutral-500)] text-xs leading-relaxed'>
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className='flex flex-col sm:flex-row gap-4 items-center mb-8'
      >
        <GradientButton
          variant='primary'
          size='lg'
          onClick={() => setIsBaseLinkModalOpen(true)}
          className='group shadow-brand text-lg px-8 py-4'
        >
          <Crown className='w-6 h-6' />
          Set Up Base Link
          <ArrowRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
        </GradientButton>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className='text-[var(--neutral-500)] text-sm max-w-md mx-auto'
      >
        Once configured, create custom links like{' '}
        <code className='text-xs bg-[var(--neutral-100)] text-[var(--tertiary)] px-2 py-1 rounded'>
          {baseUrl}/project-name
        </code>
      </motion.p>

      {/* Base Link Creation Modal */}
      <LinkCreationModal
        isOpen={isBaseLinkModalOpen}
        onClose={() => setIsBaseLinkModalOpen(false)}
        linkType='base'
        username={username}
      />
    </motion.div>
  );
}
