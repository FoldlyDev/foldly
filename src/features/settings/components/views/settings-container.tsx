// =============================================================================
// SETTINGS CONTAINER - Clerk UserProfile Integration
// =============================================================================
// 🎯 Simplified settings container using Clerk UserProfile component

'use client';

import { useState, useEffect } from 'react';
import { UserProfile, ClerkLoading, ClerkLoaded } from '@clerk/nextjs';
import {
  MotionDiv,
  AnimatePresenceWrapper,
} from '@/components/ui/core/motion-wrappers';
import { ClerkUserProfileSkeleton } from '../skeletons';

// =============================================================================
// TYPES
// =============================================================================

interface SettingsContainerProps {
  // Simplified - no props needed for Clerk UserProfile
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SettingsContainer({}: SettingsContainerProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='dashboard-container'>
      {/* Header Section */}
      <div className='workspace-header'>
        <AnimatePresenceWrapper>
          {showContent && (
            <MotionDiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className='workspace-header-content'>
                <div className='workspace-header-text'>
                  <h1 className='text-2xl sm:text-3xl font-bold text-[var(--quaternary)]'>
                    Settings
                  </h1>
                </div>
              </div>
            </MotionDiv>
          )}
        </AnimatePresenceWrapper>
      </div>

      {/* Main Content - Clerk UserProfile Only */}
      <div className='space-y-6 mt-6 px-0 sm:px-6'>
        <AnimatePresenceWrapper>
          {showContent && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ClerkLoading>
                <ClerkUserProfileSkeleton loadingMessage='Loading your profile settings...' />
              </ClerkLoading>

              <ClerkLoaded>
                <div className='w-full'>
                  <UserProfile routing='hash' />
                </div>
              </ClerkLoaded>
            </MotionDiv>
          )}
        </AnimatePresenceWrapper>
      </div>
    </div>
  );
}
