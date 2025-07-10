'use client';

import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui';
import {
  Plus,
  FolderOpen,
  BarChart3,
  Settings,
  HelpCircle,
  Zap,
  Link2,
  Target,
} from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  action: () => void;
  variant: 'primary' | 'secondary' | 'tertiary';
  size?: 'md' | 'lg';
  badge?: string;
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
      title: 'Create Base Link',
      description: 'Your main link: foldly.com/yourname',
      icon: Plus,
      action: onCreateLink,
      variant: 'primary',
      size: 'lg',
      badge: 'Core Feature',
    },
    {
      title: 'Custom Topic Link',
      description: 'Project-specific: /yourname/project',
      icon: Target,
      action: () => {
        // This will be handled by the parent with the custom type
        onCreateLink();
      },
      variant: 'secondary',
      badge: 'Pro',
    },
    {
      title: 'Manage Collections',
      description: 'Organize received files & batches',
      icon: FolderOpen,
      action: onManageFiles,
      variant: 'secondary',
    },
    {
      title: 'View Analytics',
      description: 'Track link performance & growth',
      icon: BarChart3,
      action: onShareLink, // Using onShareLink prop for analytics
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
      <motion.div
        variants={itemVariants}
        className='flex items-center justify-between mb-6'
      >
        <div>
          <h2 className='text-xl font-semibold text-[var(--quaternary)] mb-1'>
            Multi-Link File Collection
          </h2>
          <p className='text-sm text-[var(--neutral-600)]'>
            Start collecting files with zero-friction upload links
          </p>
        </div>
        <div className='hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--primary-subtle)] rounded-lg'>
          <Zap className='w-4 h-4 text-[var(--primary)]' />
          <span className='text-xs font-medium text-[var(--primary)]'>
            Zero Setup
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
      >
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          const isPrimary = action.variant === 'primary';
          const isSecondary = action.variant === 'secondary';

          return (
            <motion.div
              key={action.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                group relative p-5 rounded-xl border transition-all duration-300
                ${
                  isPrimary
                    ? 'border-[var(--primary)] bg-gradient-to-br from-[var(--primary-subtle)] to-white ring-2 ring-[var(--primary)]/10'
                    : isSecondary
                      ? 'border-[var(--secondary)] bg-gradient-to-br from-[var(--secondary-subtle)] to-white'
                      : 'border-[var(--neutral-200)] bg-white hover:border-[var(--neutral-300)]'
                }
                hover:shadow-lg cursor-pointer
              `}
              onClick={action.action}
            >
              {/* Badge for special features */}
              {action.badge && (
                <div
                  className={`
                  absolute -top-2 -right-2 px-2 py-1 text-xs font-medium rounded-full
                  ${
                    isPrimary
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--secondary)] text-white'
                  }
                `}
                >
                  {action.badge}
                </div>
              )}

              {/* Enhanced gradient overlay for primary */}
              {isPrimary && (
                <div
                  className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/8 via-transparent to-[var(--primary)]/15 
                              rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                />
              )}

              <div className='relative z-10'>
                <div
                  className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                  transition-all duration-300 group-hover:scale-110
                  ${
                    isPrimary
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25'
                      : isSecondary
                        ? 'bg-[var(--secondary)] text-white'
                        : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] group-hover:bg-[var(--neutral-200)]'
                  }
                `}
                >
                  <IconComponent className='w-6 h-6' />
                </div>

                <h3
                  className={`
                  font-semibold text-sm mb-2
                  ${isPrimary ? 'text-[var(--quaternary)]' : 'text-[var(--quaternary)]'}
                `}
                >
                  {action.title}
                </h3>

                <p className='text-[var(--neutral-500)] text-xs leading-relaxed'>
                  {action.description}
                </p>

                {/* Call-to-action indicator for primary */}
                {isPrimary && (
                  <div className='mt-3 flex items-center gap-1 text-[var(--primary)] text-xs font-medium'>
                    <span>Get Started</span>
                    <svg
                      className='w-3 h-3 transition-transform group-hover:translate-x-0.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Enhanced Footer with Foldly-specific features */}
      <motion.div
        variants={itemVariants}
        className='flex items-center justify-between mt-6 pt-6 border-t border-[var(--neutral-100)]'
      >
        <div className='flex items-center gap-6'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewLinks}
            className='flex items-center gap-2 text-[var(--neutral-600)] hover:text-[var(--quaternary)] 
                     transition-colors duration-200 text-sm font-medium'
          >
            <Link2 className='w-4 h-4' />
            All Links
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='flex items-center gap-2 text-[var(--neutral-600)] hover:text-[var(--quaternary)] 
                     transition-colors duration-200 text-sm'
          >
            <HelpCircle className='w-4 h-4' />
            Setup Guide
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
          className='hidden sm:flex items-center gap-2 text-xs text-[var(--neutral-500)]'
        >
          <span>Quick create:</span>
          <kbd className='px-2 py-1 bg-[var(--neutral-100)] rounded text-[var(--neutral-600)] font-mono'>
            Ctrl+L
          </kbd>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
