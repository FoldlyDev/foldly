// =============================================================================
// PRICING TABLE SKELETON - Enhanced Loading Component for Billing
// =============================================================================
// 🎯 Professional skeleton loader for PricingTable components

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/core/shadcn/card';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Loader2 } from 'lucide-react';

interface PricingTableSkeletonProps {
  planCount?: number;
  showLoadingMessage?: boolean;
  loadingMessage?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const PricingTableSkeleton: React.FC<PricingTableSkeletonProps> = ({
  planCount = 3,
  showLoadingMessage = true,
  loadingMessage = 'Loading pricing plans...',
  variant = 'default',
}) => {
  const getVariantConfig = () => {
    switch (variant) {
      case 'compact':
        return {
          cardHeight: 'h-64',
          iconSize: 'w-12 h-12',
          featuresCount: 3,
          spacing: 'space-y-2',
        };
      case 'detailed':
        return {
          cardHeight: 'h-[28rem]',
          iconSize: 'w-20 h-20',
          featuresCount: 6,
          spacing: 'space-y-4',
        };
      default:
        return {
          cardHeight: 'h-96',
          iconSize: 'w-16 h-16',
          featuresCount: 4,
          spacing: 'space-y-3',
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className="w-full">
      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[...Array(planCount)].map((_, i) => (
          <Card 
            key={i} 
            className={`
              animate-pulse border border-[var(--neutral-200)] 
              ${config.cardHeight} flex flex-col
              ${i === 1 ? 'ring-2 ring-[var(--primary)]/20 border-[var(--primary)]/30' : ''}
            `}
          >
            {/* Popular Badge for Middle Card */}
            {i === 1 && (
              <div className="absolute -top-px left-1/2 -translate-x-1/2">
                <Skeleton className="h-6 w-24 rounded-b-lg" />
              </div>
            )}

            <CardHeader className="text-center pb-6 pt-8">
              {/* Plan Icon */}
              <div className="flex justify-center mb-4">
                <div 
                  className={`
                    ${config.iconSize} rounded-2xl flex items-center justify-center
                    bg-gradient-to-br from-[var(--neutral-100)] to-[var(--neutral-200)]
                  `}
                >
                  <Loader2 
                    className={`
                      ${config.iconSize === 'w-12 h-12' ? 'w-5 h-5' : 
                        config.iconSize === 'w-20 h-20' ? 'w-8 h-8' : 'w-6 h-6'} 
                      text-[var(--neutral-400)] animate-spin
                    `} 
                  />
                </div>
              </div>

              {/* Plan Name */}
              <Skeleton className="h-6 w-20 mx-auto mb-2" />
              
              {/* Plan Description */}
              <Skeleton className="h-4 w-32 mx-auto mb-4" />
              
              {/* Pricing */}
              <div className="space-y-2">
                <Skeleton className="h-8 w-24 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            </CardHeader>

            <CardContent className="flex-1 px-6 pb-6">
              {/* Features List */}
              <div className={config.spacing}>
                {[...Array(config.featuresCount)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                    <Skeleton className={`h-3 ${j % 2 === 0 ? 'flex-1' : 'w-3/4'}`} />
                  </div>
                ))}
              </div>

              {/* Button */}
              <div className="mt-auto pt-6">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading Message */}
      {showLoadingMessage && (
        <div className="text-center mt-6">
          <div className="inline-flex items-center gap-2 text-[var(--neutral-600)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingMessage}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

export const ClerkPricingTableSkeleton: React.FC<Pick<PricingTableSkeletonProps, 'loadingMessage'>> = ({
  loadingMessage = 'Initializing Clerk billing system...'
}) => (
  <PricingTableSkeleton 
    variant="detailed"
    loadingMessage={loadingMessage}
    showLoadingMessage={true}
  />
);

export const QuickPricingTableSkeleton: React.FC = () => (
  <PricingTableSkeleton 
    variant="compact"
    showLoadingMessage={false}
  />
);

export const DetailedPricingTableSkeleton: React.FC<Pick<PricingTableSkeletonProps, 'loadingMessage'>> = ({
  loadingMessage = 'Loading subscription details...'
}) => (
  <PricingTableSkeleton 
    variant="detailed"
    loadingMessage={loadingMessage}
  />
);