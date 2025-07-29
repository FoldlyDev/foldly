'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/core/shadcn/button';
import { CreditCard, Settings } from 'lucide-react';
import { usePlanConfig } from '../../hooks/react-query/use-billing-data-query';

interface BillingHeaderProps {
  onManageSubscription?: () => void;
  onViewProfile?: () => void;
}

export function BillingHeader({
  onManageSubscription,
  onViewProfile,
}: BillingHeaderProps) {
  const { user } = useUser();
  const { data: planConfig } = usePlanConfig();

  // Get user's first name or fallback to "there"
  const firstName = user?.firstName || 'there';

  // ✅ Dynamic subtitle based on database plan configuration - NO conditional logic
  const getSubtitle = () => {
    if (!planConfig) return 'Loading your subscription details...';

    // Use plan description directly from database
    return (
      planConfig.planDescription ||
      'Manage your subscription and billing preferences.'
    );
  };

  const handleManageSubscription = () => {
    if (onManageSubscription) {
      onManageSubscription();
    } else {
      // Default scroll to pricing section
      const pricingSection = document.getElementById('pricing-section');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className='workspace-header-content'>
      <div className='workspace-header-text'>
        <h1 className='text-2xl sm:text-3xl font-bold text-[var(--quaternary)] mb-2'>
          Billing & Subscription
        </h1>
        <p className='text-[var(--neutral-600)] text-base sm:text-lg max-w-2xl'>
          {getSubtitle()}
        </p>

        {/* Subscription Status Badge */}
        <div className='mt-3'>
          <div
            className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border
            ${
              planConfig?.planKey === 'business'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : planConfig?.planKey === 'pro'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
            }
          `}
          >
            <CreditCard className='w-4 h-4' />
            <span>{planConfig?.planName || 'Loading...'} Plan</span>
          </div>
        </div>
      </div>

      <div className='workspace-header-actions'>
        {/* Settings Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onViewProfile}
          className='hidden sm:flex'
        >
          <Settings className='w-4 h-4 mr-2' />
          Settings
        </Button>

        {/* Primary CTA */}
        <Button variant='default' size='sm' onClick={handleManageSubscription}>
          <CreditCard className='w-4 h-4 mr-2' />
          {planConfig?.planKey !== 'business'
            ? 'Upgrade Plan'
            : 'Manage Billing'}
        </Button>

        {/* Mobile Settings Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={onViewProfile}
          className='sm:hidden'
        >
          <Settings className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
}
