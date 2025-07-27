// =============================================================================
// PRICING PAGE - Clerk Billing Integration with PricingTable Component
// =============================================================================
// 🎯 Modern pricing page using Clerk's built-in PricingTable component

'use client';

import React from 'react';
import { PricingTable, ClerkLoading, ClerkLoaded } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/core/shadcn/card';
import { Loader2 } from 'lucide-react';
import { ClerkPricingTableSkeleton } from '../loaders/PricingTableSkeleton';

// =============================================================================
// CLERK PRICING TABLE WRAPPER
// =============================================================================

interface ClerkPricingTableProps {
  className?: string;
}

const ClerkPricingTableWrapper: React.FC<ClerkPricingTableProps> = ({ className }) => {
  const { isLoaded, user } = useUser();
  
  // Enhanced loading state with Clerk awareness
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ClerkLoading>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <div className="space-y-2 w-full">
                        {[...Array(4)].map((_, j) => (
                          <Skeleton key={j} className="h-4 w-full" />
                        ))}
                      </div>
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 text-gray-600 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading pricing plans...
              </div>
            </div>
          </div>
        </ClerkLoading>
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
      
      {/* Clerk PricingTable Component with Enhanced Loading */}
      <div className="max-w-6xl mx-auto">
        <ClerkLoading>
          <ClerkPricingTableSkeleton 
            loadingMessage="Loading pricing plans..."
          />
        </ClerkLoading>
        
        <ClerkLoaded>
          <PricingTable 
            loading={
              <ClerkPricingTableSkeleton 
                loadingMessage="Fetching plan details..."
              />
            }
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
        </ClerkLoaded>
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