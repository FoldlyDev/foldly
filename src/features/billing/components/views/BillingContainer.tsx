'use client';

import { useState, useMemo, Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { BillingHeader } from '../sections/BillingHeader';
import { BillingOverviewCards } from '../cards/BillingOverviewCards';
import { usePlanConfig, useUserStorageStatusQuery } from '../../hooks/react-query/use-billing-data-query';
import { useCoordinatedBillingLoading, useTabSwitchingReadiness, usePricingTableReadiness } from '../../hooks/use-coordinated-billing-loading';
import { billingQueryKeys } from '../../lib/query-keys';
import { useUser } from '@clerk/nextjs';
import { PricingTable, ClerkLoading, ClerkLoaded } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Button } from '@/components/ui/core/shadcn/button';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/core/shadcn/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/core/shadcn/alert';
import { ClerkPricingTableSkeleton } from '../loaders/PricingTableSkeleton';

interface BillingContainerProps {
  onNavigateToProfile: () => void;
}

export function BillingContainer({ onNavigateToProfile }: BillingContainerProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: planConfig } = usePlanConfig();
  const { data: storageStatus } = useUserStorageStatusQuery();
  const [activeSection, setActiveSection] = useState<'overview' | 'pricing'>('overview');
  
  // Coordinated loading state management
  const coordinatedLoading = useCoordinatedBillingLoading();
  const { isReady: canSwitchTabs, shouldShowTabLoading } = useTabSwitchingReadiness();
  const { isReady: canRenderPricingTable, shouldShowClerkLoading, shouldShowDataLoading } = usePricingTableReadiness();
  
  // Debug logs removed - tab switching now works correctly without unnecessary re-renders

  // Enhanced tab state preservation with loading awareness
  const preserveActiveSection = useCallback((section: 'overview' | 'pricing') => {
    // Only allow tab switching when data is ready to prevent lag
    if (!canSwitchTabs && section !== activeSection) {
      console.log('🚫 Tab switching blocked - data not ready');
      return;
    }
    
    setActiveSection(section);
    
    // Update URL search params to preserve state across refreshes
    const url = new URL(window.location.href);
    url.searchParams.set('tab', section);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router, activeSection, canSwitchTabs]);

  // Handle URL parameters and subscription success
  useEffect(() => {
    const tab = searchParams.get('tab');
    
    if (tab === 'overview' || tab === 'pricing') {
      setActiveSection(tab);
    }
  }, [searchParams]);

  // Listen for subscription changes and show success notification
  useEffect(() => {
    if (user && isLoaded && planConfig) {
      // If we're on the pricing tab and the plan data changes, show success notification
      const urlParams = new URLSearchParams(window.location.search);
      const isFromClerkCheckout = urlParams.has('success') || activeSection === 'pricing';
      
      if (isFromClerkCheckout && planConfig.planKey !== 'free') {
        // Small delay to let Clerk's state settle
        const showSuccessNotification = setTimeout(() => {
          toast.success('🎉 Plan upgraded successfully! Your new features are now active.');
          
          // Refresh billing data
          queryClient.invalidateQueries({
            queryKey: billingQueryKeys.all,
          });
          
          // Clean up URL if needed
          if (urlParams.has('success')) {
            window.history.replaceState({}, '', window.location.pathname + '?tab=pricing');
          }
        }, 500);

        return () => clearTimeout(showSuccessNotification);
      }
    }
  }, [user?.organizationMemberships, planConfig, queryClient, isLoaded, activeSection]);

  // ✅ Modern billing data using React Query hooks (2025 approach)
  const billingData = useMemo(() => {
    if (!planConfig || !user) return null;

    // Count features from the plan configuration
    const highlightFeatures = planConfig.highlightFeatures || [];
    const featureDescriptions = planConfig.featureDescriptions || {};
    const activeFeatures = Math.max(highlightFeatures.length, Object.keys(featureDescriptions).length);

    // Extract storage data from modern storage status hook with safe typing
    const storageData = storageStatus as any; // Safe typing for beta API
    const storageUsedBytes = storageData?.usage || 0;
    const storageUsedGB = Math.round((storageUsedBytes / (1024 ** 3)) * 100) / 100;

    return {
      currentPlan: planConfig.planName, // Direct from database: "Free", "Pro", "Business"
      storageUsed: storageUsedGB,
      storageLimit: planConfig.storageLimitGb === -1 ? 'Unlimited' : `${planConfig.storageLimitGb}GB`,
      storagePercentage: storageData?.percentage || 0,
      featuresActive: activeFeatures,
      monthlySpend: parseFloat(planConfig.monthlyPrice), // Direct from database: 0.00, 12.00, 30.00
      highlightFeatures, // For display purposes
      featureDescriptions, // For detailed feature info
      // Additional modern data
      storageFormatted: storageData?.limitFormatted || '0 GB',
      filesCount: storageData?.filesCount || 0,
      isNearLimit: storageData?.isNearLimit || false,
      isOverLimit: storageData?.isOverLimit || false,
    };
  }, [planConfig, user, storageStatus]); // 🔧 FIXED: activeSection removed from dependencies

  const handleManageSubscription = () => {
    // FIXED: Use the new tab preservation function
    preserveActiveSection('pricing');
    // Scroll to pricing section
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Use coordinated loading state instead of individual checks
  if (!coordinatedLoading.isFullyLoaded) {
    return (
      <div className='dashboard-container'>
        <div className='space-y-6'>
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg border border-[var(--neutral-200)] p-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {/* Overview Cards Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Tab Navigation Skeleton */}
          <div className='bg-white rounded-lg border border-[var(--neutral-200)] p-1'>
            <div className='flex items-center gap-2'>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          
          {/* Content Skeleton */}
          <div className="bg-white rounded-lg border border-[var(--neutral-200)] p-6">
            <Skeleton className="h-96 w-full" />
          </div>
          
          {/* Loading Status */}
          <div className="text-center mt-4">
            <div className="inline-flex items-center gap-2 text-[var(--neutral-600)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {coordinatedLoading.loadingMessage}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle error states
  if (coordinatedLoading.hasErrors) {
    return (
      <div className='dashboard-container'>
        <div className='space-y-6'>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-2">Failed to load billing data</div>
              <ul className="text-sm space-y-1">
                {coordinatedLoading.errors.map((error, index) => (
                  <li key={index}>• {error.source}: {error.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry Loading
          </Button>
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

        {/* Enhanced Navigation Tabs with Loading States */}
        <div className='bg-white rounded-lg border border-[var(--neutral-200)] p-1'>
          <div className='flex items-center gap-2'>
            <Button
              variant={activeSection === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => preserveActiveSection('overview')}
              disabled={shouldShowTabLoading}
            >
              {shouldShowTabLoading && activeSection === 'overview' && (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              )}
              Account Overview
            </Button>
            <Button
              variant={activeSection === 'pricing' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => preserveActiveSection('pricing')}
              disabled={shouldShowTabLoading}
            >
              {shouldShowTabLoading && activeSection === 'pricing' && (
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              )}
              Plans & Pricing
            </Button>
            {shouldShowTabLoading && (
              <div className="ml-auto text-xs text-[var(--neutral-600)] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </div>
            )}
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
                    onClick={() => preserveActiveSection('pricing')}
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

              {/* Enhanced Clerk-Aware PricingTable with Coordinated Loading */}
              {!canRenderPricingTable && (
                <div className="max-w-6xl mx-auto mb-6">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    <AlertDescription className="text-blue-800">
                      <div className="inline-flex items-center gap-2">
                        Preparing subscription plans...
                        <span className="text-xs">({coordinatedLoading.loadingPhase})</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <ClerkLoading>
                <ClerkPricingTableSkeleton 
                  loadingMessage="Initializing Clerk billing system..."
                />
              </ClerkLoading>
              
              <ClerkLoaded>
                <Suspense fallback={
                  <ClerkPricingTableSkeleton 
                    loadingMessage="Loading pricing data..."
                  />
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
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                        },
                      }}
                    />
                  </div>
                </Suspense>
              </ClerkLoaded>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}