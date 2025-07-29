// =============================================================================
// BILLING PAGE CLIENT - Modernized Billing Interface
// =============================================================================
// 🎯 Redesigned billing page following workspace/links page patterns with consistent design

'use client';

import React from 'react';
import { UserProfile } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { BillingContainer } from './BillingContainer';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';

interface BillingPageClientProps {
  params: {
    rest?: string[];
  };
}

export const BillingPageClient: React.FC<BillingPageClientProps> = React.memo(
  ({ params }) => {
    const { isLoaded, user } = useUser();
    const router = useRouter();

    // Determine current view based on route parameters
    const currentPath = params.rest?.[0] || 'billing';
    const isProfileView = currentPath === 'profile';

    // Handle navigation to profile view
    const handleNavigateToProfile = () => {
      router.push('/dashboard/billing/profile');
    };

    // Handle navigation back to billing
    const handleNavigateToBilling = () => {
      router.push('/dashboard/billing');
    };

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
      return (
        <div className='min-h-screen bg-[var(--neutral-50)]'>
          <div className='dashboard-container billing-layout'>
            <div className='space-y-6'>
              <Skeleton className='h-32 w-full' />
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className='h-32 w-full' />
                ))}
              </div>
              <Skeleton className='h-96 w-full' />
            </div>
          </div>
        </div>
      );
    }

    // Profile view with consistent layout
    if (isProfileView) {
      return (
        <div className='min-h-screen bg-[var(--neutral-50)]'>
          <div className='home-container w-full mx-auto'>
            <div className='space-y-6'>
              {/* Back to Billing Navigation */}
              <div className='flex items-center gap-4 py-4'>
                <button
                  onClick={handleNavigateToBilling}
                  className='text-[var(--primary)] hover:text-[var(--primary-dark)] text-sm font-medium flex items-center gap-2 transition-colors'
                >
                  ← Back to Billing
                </button>
              </div>

              {/* Profile Header */}
              <div className='bg-white rounded-lg md:rounded-2xl p-6 border border-[var(--neutral-200)] shadow-sm'>
                <h1 className='text-2xl font-semibold text-[var(--quaternary)] mb-2'>
                  Account Settings
                </h1>
                <p className='text-[var(--neutral-600)]'>
                  Manage your profile, security settings, and billing
                  information.
                </p>
              </div>

              {/* Clerk UserProfile with beautiful design system styling */}
              <div className='bg-white rounded-xl border border-[var(--neutral-200)] shadow-sm overflow-hidden'>
                <UserProfile
                  routing='path'
                  path='/dashboard/billing/profile'
                  appearance={{
                    elements: {
                      rootBox: 'w-full min-h-[600px]',
                      card: 'shadow-none border-none bg-transparent',

                      // Navigation sidebar styling
                      navbar: `
                      bg-gradient-to-b from-[var(--neutral-50)] to-[var(--neutral-100)]/50
                      border-r border-[var(--neutral-200)] 
                      backdrop-blur-sm
                    `,
                      navbarButton: `
                      text-[var(--neutral-700)] hover:text-[var(--quaternary)] 
                      hover:bg-[var(--neutral-100)] rounded-xl mx-3 my-1 px-4 py-3
                      transition-all duration-200 ease-out
                      font-medium text-sm
                      hover:shadow-sm
                    `,
                      navbarButtonActive: `
                      text-[var(--primary)] bg-gradient-to-r from-[var(--primary-subtle)] to-[var(--primary-light)]
                      border-r-4 border-[var(--primary)] rounded-xl mx-3 my-1 px-4 py-3
                      font-semibold text-sm shadow-sm
                      hover:from-[var(--primary-light)] hover:to-[var(--primary-subtle)]
                    `,

                      // Main content area
                      pageScrollBox:
                        'p-8 bg-gradient-to-br from-white to-[var(--neutral-50)]/30',

                      // Headers and titles
                      headerTitle: `
                      text-2xl font-bold mb-2
                      bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] 
                      bg-clip-text text-transparent
                    `,
                      headerSubtitle:
                        'text-[var(--neutral-600)] mb-6 text-base leading-relaxed',

                      // Form elements
                      formFieldLabel:
                        'text-[var(--quaternary)] font-medium mb-2 text-sm',
                      formFieldInput: `
                      border border-[var(--neutral-200)] rounded-lg px-4 py-3
                      bg-white hover:bg-[var(--neutral-50)]/50
                      focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20
                      transition-all duration-200
                    `,

                      // Buttons
                      formButtonPrimary: `
                      bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]
                      hover:from-[var(--primary-dark)] hover:to-[var(--secondary-dark)]
                      text-white font-semibold py-3 px-6 rounded-xl
                      shadow-lg hover:shadow-xl
                      transition-all duration-300 ease-out
                      transform hover:scale-[1.02]
                    `,
                      formButtonSecondary: `
                      bg-white border border-[var(--neutral-200)]
                      hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-300)]
                      text-[var(--quaternary)] font-medium py-3 px-6 rounded-xl
                      transition-all duration-200
                    `,

                      // Cards and sections
                      cardBox: `
                      bg-white border border-[var(--neutral-200)] rounded-xl p-6
                      shadow-sm hover:shadow-md
                      transition-shadow duration-200
                    `,

                      // Profile image
                      avatarBox: `
                      border-4 border-[var(--primary)]/20 rounded-full
                      shadow-lg hover:shadow-xl
                      transition-all duration-300
                    `,

                      // Text elements
                      profileSectionTitle: `
                      text-lg font-semibold text-[var(--quaternary)] mb-4
                      border-b border-[var(--neutral-200)] pb-2
                    `,

                      // Badges and status indicators
                      badge: `
                      bg-gradient-to-r from-[var(--primary-subtle)] to-[var(--secondary-subtle)]
                      text-[var(--primary)] font-medium px-3 py-1 rounded-full text-sm
                      border border-[var(--primary)]/20
                    `,
                    },
                    variables: {
                      colorPrimary: 'var(--primary)',
                      colorBackground: 'white',
                      colorText: 'var(--quaternary)',
                      colorTextSecondary: 'var(--neutral-600)',
                      colorNeutral: 'var(--neutral-200)',
                      fontFamily:
                        'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      borderRadius: '0.75rem',
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Main billing view with new design
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <BillingContainer onNavigateToProfile={handleNavigateToProfile} />
      </div>
    );
  }
);

BillingPageClient.displayName = 'BillingPageClient';
