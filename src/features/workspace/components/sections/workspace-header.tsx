'use client';

import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { GradientButton } from '@/components/ui';
import { Plus, Settings, Bell } from 'lucide-react';

interface WorkspaceHeaderProps {
  totalLinks?: number;
  totalFiles?: number;
}

export function WorkspaceHeader({
  totalLinks = 0,
  totalFiles = 0,
}: WorkspaceHeaderProps) {
  const { user } = useUser();

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name or fallback to "there"
  const firstName = user?.firstName || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='workspace-header-content'
    >
      <div className='workspace-header-text'>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className='text-2xl sm:text-3xl font-bold text-[var(--quaternary)] mb-2'
        >
          {getGreeting()}, {firstName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className='text-[var(--neutral-600)] text-base sm:text-lg'
        >
          {totalLinks === 0 && totalFiles === 0
            ? 'Organize and manage your collected files in one place'
            : `You've collected ${totalFiles} files across ${totalLinks} links. Keep going!`}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className='workspace-header-actions'
      >
        {/* Notification Bell - Always visible */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='relative p-2.5 sm:p-3 rounded-xl bg-white border border-[var(--neutral-200)] 
                   shadow-sm hover:shadow-md transition-all duration-200 
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 flex-shrink-0
                   flex items-center justify-center'
        >
          <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-[var(--neutral-600)]' />
          {/* Notification dot */}
          <div
            className='absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[var(--error-red)] 
                        rounded-full border-2 border-white'
          ></div>
        </motion.button>

        {/* Settings Button - Hidden on mobile to save space */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='hidden sm:flex p-3 rounded-xl bg-white border border-[var(--neutral-200)] 
                   shadow-sm hover:shadow-md transition-all duration-200 
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20'
        >
          <Settings className='w-5 h-5 text-[var(--neutral-600)]' />
        </motion.button>

        {/* Primary CTA - Always visible with responsive sizing */}
        <GradientButton
          variant='primary'
          size='md'
          className='shadow-brand flex-shrink-0 px-4 sm:px-6'
        >
          <Plus className='w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2' />
          <span className='text-sm sm:text-base'>Upload File</span>
        </GradientButton>

        {/* Mobile Settings Button - Only show on mobile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='sm:hidden p-2.5 rounded-xl bg-white border border-[var(--neutral-200)] 
                   shadow-sm hover:shadow-md transition-all duration-200 
                   focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 flex-shrink-0
                   flex items-center justify-center'
        >
          <Settings className='w-4 h-4 text-[var(--neutral-600)]' />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
