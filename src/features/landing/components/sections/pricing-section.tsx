'use client';

import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/core';
import { GradientButton } from '@/components/ui/core';
import Link from 'next/link';

// Static pricing plans for Clerk integration
const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for individuals getting started',
    price: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    icon: Sparkles,
    colorScheme: 'border-blue-200 bg-blue-50/50',
    iconColor: 'bg-blue-100 text-blue-600',
    features: [
      '5GB storage',
      'Up to 3 upload links',
      'Basic file sharing',
      'Community support',
      'Mobile & desktop apps',
    ],
    isPopular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for individuals and small teams',
    price: 9,
    yearlyPrice: 90,
    yearlyDiscount: 17,
    icon: Zap,
    colorScheme: 'border-purple-200 bg-purple-50/50 ring-2 ring-purple-500/20',
    iconColor: 'bg-purple-100 text-purple-600',
    features: [
      '100GB storage',
      'Unlimited upload links',
      'Password protection',
      'Custom branding',
      'QR code generation',
      'Priority support',
    ],
    isPopular: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Advanced features for growing teams',
    price: 29,
    yearlyPrice: 290,
    yearlyDiscount: 17,
    icon: Crown,
    colorScheme: 'border-orange-200 bg-orange-50/50',
    iconColor: 'bg-orange-100 text-orange-600',
    features: [
      'Unlimited storage',
      'Everything in Pro',
      'Advanced analytics',
      'Team collaboration',
      'White-label branding',
      'Dedicated support',
    ],
    isPopular: false,
  },
] as const;

interface PricingCardProps {
  plan: (typeof pricingPlans)[number];
}

const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  const IconComponent = plan.icon;

  return (
    <div
      className={cn(
        'relative p-6 rounded-xl border transition-all duration-300 hover:shadow-lg w-full h-full flex flex-col',
        plan.colorScheme,
        plan.isPopular && 'md:scale-105 z-10'
      )}
    >
      {/* Popular badge */}
      {plan.isPopular && (
        <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
          <div className='bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium'>
            Most Popular
          </div>
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          'inline-flex items-center justify-center w-12 h-12 rounded-full mb-4',
          plan.iconColor
        )}
      >
        <IconComponent className='h-6 w-6' />
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h3 className='text-2xl font-bold mb-2'>{plan.name}</h3>
        <p className='text-gray-600 text-sm mb-4'>{plan.description}</p>

        {/* Pricing */}
        <div className='mb-4'>
          {plan.price === 0 ? (
            <div className='text-4xl font-bold'>Free</div>
          ) : (
            <div>
              <div className='text-4xl font-bold'>
                ${plan.price}
                <span className='text-lg font-normal text-gray-500'>
                  /month
                </span>
              </div>
              {plan.yearlyDiscount > 0 && (
                <div className='text-sm text-green-600 font-medium mt-1'>
                  Save {plan.yearlyDiscount}% with yearly billing
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className='space-y-3 mb-8 flex-1'>
        {plan.features.map((feature, index) => (
          <div key={index} className='flex items-start'>
            <Check className='h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
            <span className='text-sm text-gray-700'>{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div className='pt-4 border-t mt-auto'>
        {plan.id === 'free' ? (
          <Link href='/sign-up'>
            <Button variant='outline' className='w-full'>
              Get Started Free
            </Button>
          </Link>
        ) : plan.isPopular ? (
          <Link href='/sign-up'>
            <GradientButton className='w-full'>
              Start {plan.name} Plan
            </GradientButton>
          </Link>
        ) : (
          <Link href='/sign-up'>
            <Button className='w-full'>Choose {plan.name}</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export function PricingSection() {
  return (
    <section className='py-24 bg-gradient-to-b from-white to-gray-50/80 overflow-hidden relative'>
      <div className='container mx-auto px-4 max-w-7xl'>
        {/* Header */}
        <div className='text-center mb-16'>
          <h2 className='text-4xl font-bold mb-6'>
            Simple, Transparent Pricing
          </h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Choose the perfect plan for your file sharing needs. Start free and
            scale as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto'>
          {pricingPlans.map(plan => (
            <div key={plan.id} className='flex'>
              <PricingCard plan={plan} />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className='text-center mt-16 relative z-0'>
          <div className='bg-white/60 backdrop-blur-sm rounded-xl p-6 md:p-8 max-w-4xl mx-auto border overflow-hidden'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center'>
              <div className='flex flex-col items-center'>
                <div className='text-2xl md:text-3xl font-bold text-purple-600 mb-2'>
                  99.9%
                </div>
                <div className='text-sm text-gray-600'>Uptime SLA</div>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-2xl md:text-3xl font-bold text-purple-600 mb-2'>
                  24/7
                </div>
                <div className='text-sm text-gray-600'>Support Available</div>
              </div>
              <div className='flex flex-col items-center'>
                <div className='text-2xl md:text-3xl font-bold text-purple-600 mb-2'>
                  30 Day
                </div>
                <div className='text-sm text-gray-600'>
                  Money Back Guarantee
                </div>
              </div>
            </div>
          </div>

          <div className='mt-8'>
            <p className='text-gray-600 mb-4 max-w-2xl mx-auto'>
              Have questions about our plans? We're here to help.
            </p>
            <Link href='/dashboard/billing'>
              <Button variant='outline' className='whitespace-nowrap'>
                View Detailed Pricing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
