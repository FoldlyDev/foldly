// =============================================================================
// CLERK BILLING PAGE - Authenticated User Billing Management (UPDATED 2025)
// =============================================================================
// 🎯 Modern Clerk 2025 billing integration with specific feature checking
// ✅ UPDATED: Now uses specific feature keys instead of generic feature groups
// ⚡ IMPROVED: Better granular feature detection for Pro and Business plans

'use client';

import React from 'react';
import { PricingTable, Protect } from '@clerk/nextjs';
import { useUser, useAuth } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/core/shadcn/card';
import { CreditCard, Shield, Zap } from 'lucide-react';

// =============================================================================
// PROTECTED PRICING TABLE FOR AUTHENTICATED USERS
// =============================================================================

interface AuthenticatedBillingPageProps {
  className?: string;
}

const AuthenticatedBillingPage: React.FC<AuthenticatedBillingPageProps> = ({ className }) => {
  const { isLoaded, user } = useUser();
  const { has } = useAuth();
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ✅ UPDATED: Check specific features using Clerk's 2025 billing integration
  // Using actual feature keys that match your feature definitions
  const hasCustomBranding = has({ feature: "custom_branding" });
  const hasPremiumShortLinks = has({ feature: "premium_short_links" });
  const hasPasswordProtectedLinks = has({ feature: "password_protected_links" });
  const hasFileRestrictions = has({ feature: "file_restrictions" });
  const hasPrioritySupport = has({ feature: "priority_support" });
  
  // Plan-based checks for broader feature groups
  const hasProPlan = has({ plan: "pro" }) || has({ plan: "Pro" });
  const hasBusinessPlan = has({ plan: "business" }) || has({ plan: "Business" });
  
  // Derived feature groups for UI display
  const hasProFeatures = hasProPlan || hasCustomBranding || hasPremiumShortLinks || hasPasswordProtectedLinks;
  const hasBusinessFeatures = hasBusinessPlan || hasFileRestrictions || hasPrioritySupport;
  const hasUnlimitedStorage = hasBusinessPlan; // Business plan typically includes unlimited storage

  return (
    <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing settings below.
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-[var(--neutral-200)] hover:border-[var(--primary)]/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--quaternary)]">Plan Status</CardTitle>
            <div className="p-2 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] bg-clip-text text-transparent">
              {hasBusinessFeatures ? 'Business' : hasProFeatures ? 'Pro' : 'Free'}
            </div>
            <p className="text-xs text-[var(--neutral-600)] mt-1">
              Current subscription tier
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--neutral-200)] hover:border-[var(--success-green)]/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--quaternary)]">Storage</CardTitle>
            <div className="p-2 bg-gradient-to-br from-[var(--success-green)] to-emerald-600 rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] bg-clip-text text-transparent">
              {hasUnlimitedStorage ? 'Unlimited' : hasProFeatures ? '100GB' : '5GB'}
            </div>
            <p className="text-xs text-[var(--neutral-600)] mt-1">
              Available storage space
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--neutral-200)] hover:border-[var(--secondary)]/30 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--quaternary)]">Features</CardTitle>
            <div className="p-2 bg-gradient-to-br from-[var(--secondary)] to-[var(--tertiary)] rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] bg-clip-text text-transparent">
              {hasBusinessFeatures ? 'All' : hasProFeatures ? 'Pro' : 'Basic'}
            </div>
            <p className="text-xs text-[var(--neutral-600)] mt-1">
              Feature access level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clerk PricingTable for Plan Changes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Change Your Plan</h2>
          <p className="text-muted-foreground mb-6">
            Upgrade or downgrade your subscription at any time. Changes take effect immediately.
          </p>
        </div>

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
      </div>

      {/* Feature Access Examples */}
      <div className="mt-12 space-y-6">
        <h3 className="text-xl font-bold">Your Current Access</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Features - Using specific feature check */}
          <Protect 
            feature="custom_branding" 
            fallback={
              <Card className="opacity-60 border-[var(--neutral-200)] hover:border-[var(--neutral-300)] transition-colors duration-200">
                <CardHeader>
                  <CardTitle className="text-base text-[var(--quaternary)] flex items-center">
                    <div className="p-2 bg-[var(--neutral-200)] rounded-lg mr-3">
                      <Zap className="h-4 w-4 text-[var(--neutral-500)]" />
                    </div>
                    Pro Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                    Upgrade to Pro to unlock advanced features like custom branding, password protection, and priority support.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/60 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center text-[var(--quaternary)]">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg mr-3 shadow-lg">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Pro Features Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                  You have access to custom branding, password protection, advanced analytics, and priority support.
                </p>
              </CardContent>
            </Card>
          </Protect>

          {/* Business Features - Using specific feature check */}
          <Protect 
            feature="file_restrictions" 
            fallback={
              <Card className="opacity-60 border-[var(--neutral-200)] hover:border-[var(--neutral-300)] transition-colors duration-200">
                <CardHeader>
                  <CardTitle className="text-base text-[var(--quaternary)] flex items-center">
                    <div className="p-2 bg-[var(--neutral-200)] rounded-lg mr-3">
                      <Shield className="h-4 w-4 text-[var(--neutral-500)]" />
                    </div>
                    Business Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                    Upgrade to Business for team collaboration, advanced security, and enterprise-grade features.
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/60 shadow-md hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base flex items-center text-[var(--quaternary)]">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg mr-3 shadow-lg">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  Business Features Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--neutral-600)] leading-relaxed">
                  You have access to team collaboration, advanced security, SSO integration, and dedicated support.
                </p>
              </CardContent>
            </Card>
          </Protect>
        </div>
      </div>
    </div>
  );
};

export default AuthenticatedBillingPage;