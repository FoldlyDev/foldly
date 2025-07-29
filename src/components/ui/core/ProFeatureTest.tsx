// =============================================================================
// PRO FEATURE TEST COMPONENT - Test Pro Feature Access
// =============================================================================
// 🎯 Simple component to test pro feature access with corrected billing

'use client';

import { useClerkSubscription } from '@/features/billing/hooks/use-clerk-billing';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/core/shadcn/card';
import { Badge } from '@/components/ui/core/shadcn/badge';
import { Button } from '@/components/ui/core/shadcn/button';
import { Lock, Crown, Zap, Shield } from 'lucide-react';

export function ProFeatureTest() {
  const {
    currentPlan,
    isProTier,
    hasCustomBranding,
    hasPremiumShortLinks,
    hasPasswordProtectedLinks,
    hasPrioritySupport,
    isLoaded,
  } = useClerkSubscription();

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <div className='animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full'></div>
        </CardContent>
      </Card>
    );
  }

  const proFeatures = [
    {
      name: 'Custom Branding',
      hasAccess: hasCustomBranding,
      icon: Crown,
      description: 'Add your logo and colors to upload pages',
    },
    {
      name: 'Premium Short Links',
      hasAccess: hasPremiumShortLinks,
      icon: Zap,
      description: 'Custom short URLs for your links',
    },
    {
      name: 'Password Protection',
      hasAccess: hasPasswordProtectedLinks,
      icon: Lock,
      description: 'Secure your links with passwords',
    },
    {
      name: 'Priority Support',
      hasAccess: hasPrioritySupport,
      icon: Shield,
      description: 'Get help faster with priority support',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Pro Feature Access Test</CardTitle>
          <Badge
            variant={isProTier ? 'default' : 'secondary'}
            className={isProTier ? 'bg-purple-600' : ''}
          >
            {currentPlan} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {proFeatures.map(feature => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.name}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                feature.hasAccess
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  feature.hasAccess ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium'>{feature.name}</span>
                  {feature.hasAccess ? (
                    <Badge variant='default' className='text-xs bg-green-600'>
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant='secondary' className='text-xs'>
                      Locked
                    </Badge>
                  )}
                </div>
                <p className='text-sm text-muted-foreground'>
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}

        {!isProTier && (
          <div className='mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border'>
            <h4 className='font-medium text-purple-900 mb-2'>Upgrade to Pro</h4>
            <p className='text-sm text-purple-700 mb-3'>
              Unlock all pro features and get the most out of your file sharing.
            </p>
            <Button size='sm' className='bg-purple-600 hover:bg-purple-700'>
              Upgrade Now
            </Button>
          </div>
        )}

        {isProTier && (
          <div className='mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
            <h4 className='font-medium text-green-900 mb-2'>
              🎉 Pro Plan Active!
            </h4>
            <p className='text-sm text-green-700'>
              You have access to all pro features. Enjoy the enhanced
              experience!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
