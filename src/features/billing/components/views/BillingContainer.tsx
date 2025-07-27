'use client';

import { useState, useMemo, Suspense } from 'react';
import { BillingHeader } from '../sections/BillingHeader';
import { BillingOverviewCards } from '../cards/BillingOverviewCards';
import { usePlanConfig } from '../../hooks/react-query/use-billing-data-query';
import type { PlanUIMetadata } from '@/lib/database/schemas';
import { useBillingStats } from '../../hooks/use-billing-data';
import { useUser } from '@clerk/nextjs';
import { PricingTable } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Button } from '@/components/ui/core/shadcn/button';

interface BillingContainerProps {
  onNavigateToProfile?: () => void;
}

export function BillingContainer({ onNavigateToProfile }: BillingContainerProps) {
  const { user, isLoaded } = useUser();
  const { data: planConfig, isLoading: planLoading } = usePlanConfig(); // ✅ Direct database fetch
  const billingStats = useBillingStats();
  const [activeSection, setActiveSection] = useState<'overview' | 'pricing'>('overview');

  // ✅ Clean billing data using new simplified database schema - NO conditional logic
  const billingData = useMemo(() => {
    if (!planConfig || !user) return null;

    // Count features from the new JSON highlight_features array
    const highlightFeatures = planConfig.highlightFeatures || [];
    const featureDescriptions = planConfig.featureDescriptions || {};
    const activeFeatures = Math.max(highlightFeatures.length, Object.keys(featureDescriptions).length);

    return {
      currentPlan: planConfig.planName, // Direct from database: "Free", "Pro", "Business"
      storageUsed: billingStats.storageUsed,
      storageLimit: planConfig.storageLimitGb === -1 ? 'Unlimited' : `${planConfig.storageLimitGb}GB`, // Handle unlimited storage
      featuresActive: activeFeatures, // Count from feature_descriptions JSON
      monthlySpend: parseFloat(planConfig.monthlyPrice), // Direct from database: 0.00, 12.00, 30.00
      highlightFeatures, // For display purposes
      featureDescriptions, // For detailed feature info
    };
  }, [planConfig, user, billingStats]);

  const handleManageSubscription = () => {
    setActiveSection('pricing');
    // Scroll to pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (!isLoaded || planLoading) {
    return (
      <div className='dashboard-container'>
        <div className='space-y-6'>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      {/* Header Section */}
      <div className='workspace-header'>
        <BillingHeader 
          onManageSubscription={handleManageSubscription}
          onViewProfile={onNavigateToProfile}
        />
      </div>

      {/* Main Content */}
      <div className='space-y-6 mt-6'>
        {/* Overview Cards - Keep premium styling */}
        <BillingOverviewCards data={billingData} />

        {/* Simple Navigation Tabs */}
        <div className='bg-white rounded-lg border border-[var(--neutral-200)] p-1'>
          <div className='flex items-center gap-2'>
            <Button
              variant={activeSection === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('overview')}
            >
              Account Overview
            </Button>
            <Button
              variant={activeSection === 'pricing' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('pricing')}
            >
              Plans & Pricing
            </Button>
          </div>
        </div>

        {/* Content Sections */}
        <div className='min-h-[500px]'>
          {activeSection === 'overview' && (
            <div className='space-y-6'>
              {/* Current Plan Details */}
              <div className='bg-white rounded-lg border border-[var(--neutral-200)] p-6'>
                <h3 className='text-lg font-semibold text-[var(--quaternary)] mb-4'>
                  Your Current Plan
                </h3>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Plan Information */}
                  <div className='space-y-4'>
                    <div>
                      <h4 className='font-medium text-[var(--quaternary)] mb-2'>
                        {planConfig?.planName} Plan
                      </h4>
                      <p className='text-[var(--neutral-600)] text-sm'>
                        {planConfig?.planDescription}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className='font-medium text-[var(--quaternary)] mb-2'>Subscription Status</h4>
                      <p className='text-[var(--neutral-600)] text-sm'>
                        {planConfig?.planKey === 'free' ? 'Free tier - no billing required' : `Active subscription - $${planConfig?.monthlyPrice}/month`}
                      </p>
                    </div>
                    
                    {planConfig?.planKey !== 'free' && (
                      <div>
                        <h4 className='font-medium text-[var(--quaternary)] mb-2'>Next Billing Date</h4>
                        <p className='text-[var(--neutral-600)] text-sm'>
                          {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Plan Features Highlights */}
                  <div className='space-y-4'>
                    <h4 className='font-medium text-[var(--quaternary)]'>Plan Highlights</h4>
                    <ul className='space-y-3 text-sm text-[var(--neutral-600)]'>
                      {/* Show only highlight features (not detailed descriptions) */}
                      {billingData?.highlightFeatures?.map((feature, index) => (
                        <li key={index} className='flex items-center gap-3'>
                          <div className='w-2 h-2 bg-[var(--success-green)] rounded-full flex-shrink-0'></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>


              {/* Upgrade Prompt */}
              {planConfig?.planKey !== 'business' && (
                <div className='bg-[var(--primary-subtle)] rounded-lg border border-[var(--primary)]/20 p-6'>
                  <h3 className='text-lg font-semibold text-[var(--quaternary)] mb-2'>
                    Unlock More Features
                  </h3>
                  <p className='text-[var(--neutral-600)] text-sm mb-4'>
                    Upgrade your plan to access more storage, advanced features, and priority support.
                  </p>
                  <Button
                    onClick={() => setActiveSection('pricing')}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'pricing' && (
            <div id="pricing-section">
              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-[var(--quaternary)] mb-2'>
                  Choose Your Plan
                </h3>
                <p className='text-[var(--neutral-600)]'>
                  Upgrade or downgrade your subscription at any time. Changes take effect immediately.
                </p>
              </div>

              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-96 w-full" />
                  ))}
                </div>
              }>
                <div className="max-w-6xl mx-auto">
                  <PricingTable 
                    appearance={{
                      elements: {
                        rootBox: 'w-full max-w-7xl mx-auto',
                        card: `
                          relative border border-[var(--neutral-200)] rounded-xl bg-white shadow-sm 
                          hover:shadow-lg hover:border-[var(--primary)]/40 hover:-translate-y-1
                          transition-all duration-300 ease-out overflow-hidden
                          before:absolute before:inset-0 before:bg-gradient-to-br 
                          before:from-[var(--primary)]/5 before:via-transparent before:to-[var(--secondary)]/5
                          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                        `,
                        cardContent: 'relative p-6 md:p-8 z-10',
                        priceText: `
                          text-3xl md:text-4xl font-bold mb-2
                          bg-gradient-to-br from-[var(--quaternary)] via-[var(--tertiary)] to-[var(--quaternary)] 
                          bg-clip-text text-transparent
                        `,
                        planName: `
                          text-xl md:text-2xl font-bold mb-3
                          bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] 
                          bg-clip-text text-transparent
                        `,
                        planDescription: `
                          text-[var(--neutral-600)] mb-6 text-sm md:text-base 
                          leading-relaxed
                        `,
                        featuresContainer: 'space-y-3 mb-8',
                        featureText: `
                          text-sm md:text-base text-[var(--neutral-700)] 
                          flex items-center gap-3
                          before:content-['✓'] before:text-[var(--success-green)] 
                          before:font-semibold before:text-lg
                        `,
                        button: `
                          w-full relative overflow-hidden
                          bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]
                          hover:from-[var(--primary-dark)] hover:to-[var(--secondary-dark)]
                          text-white font-semibold py-4 px-6 rounded-xl
                          shadow-lg hover:shadow-xl
                          transition-all duration-300 ease-out
                          transform hover:scale-[1.02]
                          before:absolute before:inset-0 
                          before:bg-gradient-to-r before:from-white/20 before:to-transparent
                          before:opacity-0 hover:before:opacity-100 
                          before:transition-opacity before:duration-300
                        `,
                        buttonDisabled: `
                          w-full bg-[var(--neutral-100)] text-[var(--neutral-400)] 
                          font-medium py-4 px-6 rounded-xl cursor-not-allowed
                          border border-[var(--neutral-200)]
                        `,
                        popular: `
                          relative before:absolute before:top-0 before:left-1/2 
                          before:-translate-x-1/2 before:-translate-y-1/2
                          before:bg-gradient-to-r before:from-[var(--primary)] before:to-[var(--secondary)]
                          before:text-white before:px-4 before:py-1 before:rounded-full
                          before:text-sm before:font-medium before:content-['Most_Popular']
                          border-[var(--primary)]/30 shadow-[var(--primary)]/10
                        `,
                      },
                      variables: {
                        colorPrimary: 'var(--primary)',
                        colorBackground: 'white',
                        colorText: 'var(--quaternary)',
                        colorTextSecondary: 'var(--neutral-600)',
                        borderColor: 'var(--neutral-200)',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      },
                    }}
                  />
                </div>
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}