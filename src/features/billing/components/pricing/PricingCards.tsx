// =============================================================================
// PRICING CARDS COMPONENT - Database-Driven Pricing Display
// =============================================================================
// 🎯 Displays subscription plans from database with modern design

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/core/shadcn/card';
import { Button } from '@/components/ui/core/shadcn/button';
import { cn } from '@/lib/utils';
import { usePlansForDisplay } from '../../hooks/use-subscription-plans';
import { usePlanConfig } from '../../hooks/react-query/use-billing-data-query';
import type { PlanForDisplay } from '../../hooks/use-subscription-plans';

// =============================================================================
// TYPES
// =============================================================================

interface PricingCardsProps {
  className?: string;
  billingPeriod?: 'monthly' | 'yearly';
  onPlanSelect?: (planKey: string) => void;
}

// =============================================================================
// PLAN ICONS
// =============================================================================

const getPlanIcon = (tier: string) => {
  switch (tier) {
    case 'free':
      return Shield;
    case 'pro':
      return Zap;
    case 'business':
      return Crown;
    default:
      return Shield;
  }
};

// =============================================================================
// INDIVIDUAL PRICING CARD
// =============================================================================

interface PricingCardProps {
  plan: PlanForDisplay;
  billingPeriod: 'monthly' | 'yearly';
  isCurrentPlan?: boolean;
  onSelect?: (planKey: string) => void;
  index: number;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingPeriod,
  isCurrentPlan = false,
  onSelect,
  index,
}) => {
  const IconComponent = getPlanIcon(plan.tier);
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const savingsPercentage = billingPeriod === 'yearly' && plan.yearlyPrice > 0 
    ? Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)
    : 0;

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      className="relative"
    >
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        'border-2 hover:shadow-2xl hover:shadow-primary/20',
        plan.isPopular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
        isCurrentPlan && 'ring-2 ring-primary ring-offset-2',
        'group'
      )}>
        {/* Popular Badge */}
        {plan.isPopular && (
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <div className="bg-gradient-to-r from-primary via-purple-500 to-primary text-white text-xs font-semibold px-4 py-1 rounded-b-lg">
              Most Popular
            </div>
          </div>
        )}

        {/* Background Gradient */}
        <div 
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${plan.color}20, transparent 50%, ${plan.color}10)`,
          }}
        />

        <CardHeader className="text-center pb-8 pt-8 relative z-10">
          {/* Plan Icon */}
          <div className={cn(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto',
            'transition-all duration-300 group-hover:scale-110 group-hover:rotate-3'
          )} style={{ backgroundColor: `${plan.color}15` }}>
            <IconComponent 
              className="w-8 h-8" 
              style={{ color: plan.color }}
            />
          </div>

          {/* Plan Name */}
          <CardTitle className="text-2xl font-bold mb-2">
            {plan.name}
          </CardTitle>

          {/* Plan Description */}
          <CardDescription className="text-muted-foreground mb-6">
            {plan.description}
          </CardDescription>

          {/* Pricing */}
          <div className="mb-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">
                ${price}
              </span>
              {price > 0 && (
                <span className="text-muted-foreground">
                  /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                </span>
              )}
            </div>
            
            {/* Yearly Savings */}
            {billingPeriod === 'yearly' && savingsPercentage > 0 && (
              <div className="text-sm text-green-600 font-medium mt-1">
                Save {savingsPercentage}% annually
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {/* Features List */}
          <ul className="space-y-3">
            {plan.features.map((feature, featureIndex) => (
              <motion.li
                key={featureIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  delay: (index * 0.1) + (featureIndex * 0.05) + 0.3,
                  duration: 0.4 
                }}
                className="flex items-center gap-3"
              >
                <div className={cn(
                  'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center',
                )} style={{ backgroundColor: `${plan.color}20` }}>
                  <Check className="w-3 h-3" style={{ color: plan.color }} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {feature}
                </span>
              </motion.li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="px-6 pb-6">
          <Button
            onClick={() => onSelect?.(plan.id)}
            disabled={isCurrentPlan}
            className={cn(
              'w-full transition-all duration-300',
              isCurrentPlan
                ? 'bg-muted text-muted-foreground cursor-default'
                : plan.isPopular
                ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl'
                : 'bg-secondary hover:bg-secondary/80'
            )}
            style={!isCurrentPlan && !plan.isPopular ? {
              backgroundColor: `${plan.color}15`,
              color: plan.color,
            } : {}}
          >
            {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// =============================================================================
// MAIN PRICING CARDS COMPONENT
// =============================================================================

export const PricingCards: React.FC<PricingCardsProps> = ({
  className,
  billingPeriod = 'monthly',
  onPlanSelect,
}) => {
  const { plans, isLoading, error } = usePlansForDisplay();
  const { data: planConfig } = usePlanConfig();

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-8', className)}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-2xl mx-auto" />
              <div className="h-6 bg-muted rounded w-24 mx-auto" />
              <div className="h-4 bg-muted rounded w-32 mx-auto" />
              <div className="h-8 bg-muted rounded w-20 mx-auto" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-muted rounded-full" />
                  <div className="h-4 bg-muted rounded flex-1" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-muted rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-muted-foreground mb-4">
          Failed to load pricing plans. Please try again later.
        </div>
        <Button onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty State
  if (!plans || plans.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-muted-foreground">
          No pricing plans available at this time.
        </div>
      </div>
    );
  }

  // ✅ Get current user plan from database - NO conditional logic
  const currentPlanKey = planConfig?.planKey || 'free';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('grid grid-cols-1 md:grid-cols-3 gap-8', className)}
    >
      {plans.map((plan, index) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          billingPeriod={billingPeriod}
          isCurrentPlan={plan.id === currentPlanKey}
          onSelect={onPlanSelect}
          index={index}
        />
      ))}
    </motion.div>
  );
};

export default PricingCards;