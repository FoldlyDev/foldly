'use client';

import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui';
import {
  Plus,
  FolderOpen,
  Share,
  Settings,
  HelpCircle,
  Download,
  Upload,
  Link2,
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant: 'primary' | 'secondary' | 'tertiary';
  size?: 'md' | 'lg';
}

interface QuickActionsProps {
  onCreateLink?: () => void;
  onManageFiles?: () => void;
  onViewLinks?: () => void;
  onShareLink?: () => void;
}

export function QuickActions({
  onCreateLink = () => {},
  onManageFiles = () => {},
  onViewLinks = () => {},
  onShareLink = () => {},
}: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      title: 'Create Upload Link',
      description: 'Generate a new link to collect files',
      icon: Plus,
      action: onCreateLink,
      variant: 'primary',
      size: 'lg',
    },
    {
      title: 'Manage Files',
      description: 'View and organize collected files',
      icon: FolderOpen,
      action: onManageFiles,
      variant: 'secondary',
    },
    {
      title: 'View All Links',
      description: 'See all your upload links',
      icon: Link2,
      action: onViewLinks,
      variant: 'secondary',
    },
    {
      title: 'Share Existing',
      description: 'Share an existing upload link',
      icon: Share,
      action: onShareLink,
      variant: 'tertiary',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='bg-white rounded-2xl border border-[var(--neutral-200)] p-6 shadow-sm mb-8'
    >
      <motion.h2
        variants={itemVariants}
        className='text-xl font-semibold text-[var(--quaternary)] mb-4'
      >
        Quick Actions
      </motion.h2>

      <motion.div
        variants={containerVariants}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      >
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          const isPrimary = action.variant === 'primary';

          return (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                group relative p-4 rounded-xl border transition-all duration-200
                ${
                  isPrimary
                    ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary-subtle)] to-white'
                    : 'border-[var(--neutral-200)] bg-white hover:border-[var(--neutral-300)]'
                }
                hover:shadow-md cursor-pointer
              `}
              onClick={action.action}
            >
              {/* Primary action gets special styling */}
              {isPrimary && (
                <div
                  className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/10 
                              rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                />
              )}

              <div className='relative z-10'>
                <div
                  className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3
                  transition-all duration-200 group-hover:scale-110
                  ${
                    isPrimary
                      ? 'bg-[var(--primary)] text-[var(--quaternary)]'
                      : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] group-hover:bg-[var(--neutral-200)]'
                  }
                `}
                >
                  <IconComponent className='w-5 h-5' />
                </div>

                <h3
                  className={`
                  font-semibold text-sm mb-1
                  ${isPrimary ? 'text-[var(--quaternary)]' : 'text-[var(--quaternary)]'}
                `}
                >
                  {action.title}
                </h3>

                <p className='text-[var(--neutral-500)] text-xs leading-relaxed'>
                  {action.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Secondary Actions */}
      <motion.div
        variants={itemVariants}
        className='flex items-center justify-between mt-6 pt-6 border-t border-[var(--neutral-100)]'
      >
        <div className='flex items-center gap-4'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 text-[var(--neutral-600)] hover:text-[var(--quaternary)] 
                     transition-colors duration-200 text-sm'
          >
            <HelpCircle className='w-4 h-4' />
            Help & Support
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 text-[var(--neutral-600)] hover:text-[var(--quaternary)] 
                     transition-colors duration-200 text-sm'
          >
            <Settings className='w-4 h-4' />
            Settings
          </motion.button>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='text-xs text-[var(--neutral-500)]'
        >
          Press{' '}
          <kbd className='px-2 py-1 bg-[var(--neutral-100)] rounded text-[var(--neutral-600)] font-mono'>
            Ctrl+K
          </kbd>{' '}
          for shortcuts
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
