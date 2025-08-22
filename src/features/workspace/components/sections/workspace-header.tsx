'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { GradientButton } from '@/components/core/gradient-button';
import { Plus, Bell, AlertTriangle } from 'lucide-react';
import { useWorkspaceUI } from '../../hooks/use-workspace-ui';
import { useStorageQuotaStatus } from '../../hooks';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useNotificationStore } from '@/features/notifications/store/notification-store';
import { useEventBus, NotificationEventType } from '@/features/notifications/hooks/use-event-bus';
import { SettingsDropdown } from '../settings/SettingsDropdown';
import { SecondaryCTAButton } from '@/components/core';

interface WorkspaceHeaderProps {
  totalLinks?: number;
  totalFiles?: number;
  workspaceId?: string;
}

export function WorkspaceHeader({
  totalLinks = 0,
  totalFiles = 0,
  workspaceId,
}: WorkspaceHeaderProps) {
  const { user } = useUser();
  const { openUploadModal } = useWorkspaceUI();
  const quotaStatus = useStorageQuotaStatus();
  const { emit } = useEventBus();
  const [showNotifications, setShowNotifications] = useState(false);
  const totalUnread = useNotificationStore(state => state.totalUnread);

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning vibes';
    if (hour < 17) return 'Hey there';
    return 'Welcome back';
  };

  // Get user's first name or fallback to "there"
  const firstName = user?.firstName || 'there';

  // Handle upload button click with storage validation
  const handleUploadClick = () => {
    if (quotaStatus.status === 'exceeded') {
      emit(NotificationEventType.STORAGE_LIMIT_EXCEEDED, {
        currentUsage: 0, // We don't have exact bytes here
        totalLimit: 0,   // We don't have exact limit here
        remainingSpace: 0,
        usagePercentage: quotaStatus.percentage || 100,
        planKey: 'free', // Default to free plan
      });
      return;
    }

    if (quotaStatus.status === 'critical') {
      emit(NotificationEventType.STORAGE_THRESHOLD_CRITICAL, {
        currentUsage: 0, // We don't have exact bytes here
        totalLimit: 0,   // We don't have exact limit here
        remainingSpace: 0,
        usagePercentage: quotaStatus.percentage || 90,
        planKey: 'free', // Default to free plan
      });
    }

    openUploadModal(workspaceId);
  };

  // Determine upload button state
  const isUploadDisabled = quotaStatus.status === 'exceeded';
  const showStorageWarning =
    quotaStatus.status === 'critical' || quotaStatus.status === 'warning';

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
        >
          {getGreeting()}, {firstName}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className='text-muted-foreground text-base sm:text-lg'
        >
          {totalLinks === 0 && totalFiles === 0
            ? 'Ready to drop some files? This is your space 🚀'
            : `Looking good! ${totalFiles} files uploaded across ${totalLinks} links`}
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
          onClick={() => setShowNotifications(!showNotifications)}
          className='cta relative p-2.5 sm:p-3 rounded-xl bg-card border border-border 
                   shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
                   focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/20 flex-shrink-0
                   flex items-center justify-center foldly-glass-shadow-bg'
        >
          <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground' />
          {/* Notification dot - only show if there are unread notifications */}
          {totalUnread > 0 && (
            <div
              className='absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1.5 bg-destructive 
                          dark:bg-[var(--foldly-glass-bg-solid)] dark:backdrop-blur-[12px]
                          rounded-full border-2 border-card dark:border-white/10 
                          flex items-center justify-center shadow-sm dark:shadow-xl'
            >
              <span className='text-xs font-bold text-destructive-foreground dark:text-blue-300'>
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            </div>
          )}
        </motion.button>

        {/* Settings Button - Hidden on mobile to save space */}
        <div className='hidden sm:flex'>
          <SettingsDropdown />
        </div>

        {/* Primary CTA - Always visible with responsive sizing */}
        <div className='relative'>
          <SecondaryCTAButton
            className='flex-shrink-0 px-4 sm:px-6 relative cta'
            onClick={handleUploadClick}
            disabled={isUploadDisabled}
            icon={Plus}
          >
            {showStorageWarning && !isUploadDisabled && (
              <AlertTriangle className='w-3 h-3 sm:w-4 sm:h-4 mr-1 text-warning' />
            )}
            <span className='text-sm sm:text-base'>
              {isUploadDisabled ? 'Storage Full' : 'Upload Files'}
            </span>
          </SecondaryCTAButton>

          {/* Storage warning indicator */}
          {showStorageWarning && (
            <div className='absolute -top-1 -right-1 w-2 h-2 bg-warning dark:bg-warning rounded-full border border-card animate-pulse' />
          )}
        </div>

        {/* Mobile Settings Button - Only show on mobile */}
        <div className='sm:hidden'>
          <SettingsDropdown />
        </div>
      </motion.div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </motion.div>
  );
}
