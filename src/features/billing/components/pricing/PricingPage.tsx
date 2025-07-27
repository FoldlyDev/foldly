// =============================================================================
// PRICING PAGE - Clerk Billing Integration with PricingTable Component
// =============================================================================
// 🎯 Modern pricing page using Clerk's built-in PricingTable component

'use client';

import React from 'react';
import { PricingTable } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';

// =============================================================================
// CLERK PRICING TABLE WRAPPER
// =============================================================================

interface ClerkPricingTableProps {
  className?: string;
}

const ClerkPricingTableWrapper: React.FC<ClerkPricingTableProps> = ({ className }) => {
  const { isLoaded, user } = useUser();
  
  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Skeleton className="h-8 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className={`container mx-auto px-4 py-16 ${className || ''}`}>
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Scale your file sharing with plans designed for every need. 
          Start free and upgrade as you grow.
        </p>
      </div>
      
      {/* Clerk PricingTable Component */}
      <div className="max-w-6xl mx-auto">
        <PricingTable 
          appearance={{
            elements: {
              // Customize the appearance to match your design system
              rootBox: 'max-w-6xl mx-auto',
              card: 'border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300',
              cardContent: 'p-6',
              priceText: 'text-3xl font-bold',
              planName: 'text-xl font-semibold mb-2',
              planDescription: 'text-muted-foreground mb-4',
              button: 'w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200',
            },
          }}
        />
      </div>
      
      {/* FAQ Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Can I change my plan anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time through your account settings. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">What happens to my data?</h4>
              <p className="text-sm text-muted-foreground">
                Your data remains safe and accessible. Premium features may be restricted on downgrade, but your files are never deleted.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                Our Free plan gives you generous storage and features to get started. Upgrade anytime to unlock more capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">How does billing work?</h4>
              <p className="text-sm text-muted-foreground">
                We offer both monthly and yearly billing. Yearly plans come with a 20% discount and you can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// =============================================================================
// MAIN PRICING PAGE COMPONENT (CLERK BILLING)
// =============================================================================

export const PricingPage: React.FC = () => {
  return <ClerkPricingTableWrapper />;
};