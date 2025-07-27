'use client';

import { motion } from 'framer-motion';
import { CreditCard, Shield, Zap, TrendingUp, Files, Link } from 'lucide-react';
import { usePlanConfig, useUserStorageStatusQuery } from '../../hooks/react-query/use-billing-data-query';
import type { PlanUIMetadata } from '@/lib/database/schemas';
import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';

interface BillingOverviewCardsProps {
  data?: {
    currentPlan: string;
    storageUsed: number;
    storageLimit: string;
    featuresActive: number;
    daysRemaining?: number | null;
    monthlySpend?: number;
    highlightFeatures?: string[];
    featureDescriptions?: Record<string, string>;
  } | null;
}

type ColorType = 'primary' | 'secondary' | 'tertiary' | 'success';

export function BillingOverviewCards({ data }: BillingOverviewCardsProps) {
  const { user } = useUser();
  
  // ✅ Clean database-driven hooks - NO conditional logic
  const { data: planConfig, isLoading: planLoading } = usePlanConfig();
  const { data: storageData, isLoading: storageLoading } = useUserStorageStatusQuery();

  // ✅ Calculate actual values directly from database - NO conditional logic
  const safeData = useMemo(() => {
    // Use direct database data with new JSON schema
    if (planConfig && data) {
      // Count features from new JSON schema: highlight_features + feature_descriptions
      const highlightFeatures = (planConfig.highlightFeatures as string[]) || [];
      const featureDescriptions = (planConfig.featureDescriptions as Record<string, string>) || {};
      const activeFeatures = Math.max(highlightFeatures.length, Object.keys(featureDescriptions).length);

      // Use the correct field name from the schema
      const parsedPrice = parseFloat(planConfig.monthlyPrice || '0.00');

      return {
        currentPlan: planConfig.planName, // Direct from database: "Free", "Pro", "Business"
        storageUsed: data.storageUsed,
        storageLimit: planConfig.storageLimitGb === -1 ? 'Unlimited' : `${planConfig.storageLimitGb}GB`,
        featuresActive: activeFeatures, // Count from JSON arrays
        daysRemaining: null,
        monthlySpend: parsedPrice, // Fixed: Use correct field and parsing
        planData: planConfig,
      };
    }
    
    // Fallback data while loading
    if (!planConfig || !data) {
      return {
        currentPlan: 'Loading...',
        storageUsed: 0,
        storageLimit: 'Loading...',
        featuresActive: 0,
        daysRemaining: null,
        monthlySpend: 0,
        planData: null,
      };
    }

    return data;
  }, [planConfig, data]);

  // Show loading state if data is being fetched
  if ((planLoading || storageLoading) && !data) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 bg-white/90 animate-pulse"
          >
            <div className="w-11 h-11 md:w-14 md:h-14 bg-gray-200 rounded-xl md:rounded-2xl mb-4 md:mb-5" />
            <div className="h-8 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded mb-1" />
            <div className="h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Current Plan',
      value: safeData.currentPlan,
      subtitle: 'Active subscription tier',
      icon: CreditCard,
      color: 'primary' as ColorType,
      trend: planConfig?.planKey !== 'business' ? { 
        value: 'Upgrade', 
        isPositive: true, 
        label: 'available' 
      } : null,
    },
    {
      title: 'Storage Used',
      value: `${Math.round((safeData.storageUsed / (1024 ** 3)))}GB`,
      subtitle: `of ${safeData.storageLimit} available`,
      icon: Shield,
      color: 'success' as ColorType,
      trend: storageData ? { 
        value: storageData.percentage, 
        isPositive: !storageData.isOverLimit, 
        label: storageData.isNearLimit ? 'near limit' : 'used' 
      } : null,
    },
    {
      title: 'Plan Features',
      value: safeData.featuresActive,
      subtitle: 'Features included in your plan',
      icon: Zap,
      color: 'secondary' as ColorType,
      trend: { 
        value: 'All', 
        isPositive: true, 
        label: 'included' 
      },
    },
    {
      title: 'Plan Price',
      value: safeData.monthlySpend === 0 ? 'Free' : `$${(safeData.monthlySpend || 0).toFixed(2)}/mo`,
      subtitle: 'Current subscription cost',
      icon: CreditCard,
      color: 'tertiary' as ColorType,
      trend: planConfig?.planKey === 'free' ? { 
        value: 'Free', 
        isPositive: true, 
        label: 'forever' 
      } : { 
        value: `$${((safeData.monthlySpend || 0) * 12).toFixed(0)}`, 
        isPositive: true, 
        label: 'yearly' 
      },
    },
  ];

  const colorClasses = {
    primary: {
      icon: 'text-white bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] shadow-[var(--primary)]/25',
      trend: 'text-[var(--primary)] group-hover:text-[var(--primary-dark)]',
      accent: 'border-l-[var(--primary)] group-hover:border-l-[var(--primary-dark)]',
    },
    secondary: {
      icon: 'text-white bg-gradient-to-br from-[var(--secondary)] to-[var(--secondary-dark)] shadow-[var(--secondary)]/25',
      trend: 'text-[var(--secondary)] group-hover:text-[var(--secondary-dark)]',
      accent: 'border-l-[var(--secondary)] group-hover:border-l-[var(--secondary-dark)]',
    },
    tertiary: {
      icon: 'text-white bg-gradient-to-br from-[var(--tertiary)] to-[var(--tertiary-dark)] shadow-[var(--tertiary)]/25',
      trend: 'text-[var(--tertiary)] group-hover:text-[var(--tertiary-dark)]',
      accent: 'border-l-[var(--tertiary)] group-hover:border-l-[var(--tertiary-dark)]',
    },
    success: {
      icon: 'text-white bg-gradient-to-br from-[var(--success-green)] to-emerald-600 shadow-emerald-500/25',
      trend: 'text-[var(--success-green)] group-hover:text-emerald-600',
      accent: 'border-l-[var(--success-green)] group-hover:border-l-emerald-600',
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30, 
      scale: 0.92,
      rotateX: -15,
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8'
    >
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ 
              y: -6, 
              scale: 1.02,
              rotateY: 2,
              transition: { 
                duration: 0.4, 
                ease: [0.22, 1, 0.36, 1] 
              } 
            }}
            whileTap={{ scale: 0.98 }}
            className={`
              group relative overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-6 
              border border-white/20 shadow-lg hover:shadow-2xl
              transition-all duration-500 ease-out
              backdrop-blur-sm bg-gradient-to-br from-white/95 via-white/85 to-white/95
              hover:from-white/98 hover:via-white/90 hover:to-white/98
              hover:border-white/30 transform hover:scale-[1.02]
              before:absolute before:inset-0 before:bg-gradient-to-br 
              before:from-[var(--primary)]/5 before:via-transparent before:to-[var(--secondary)]/5
              before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
              border-l-4 ${colors.accent} hover:shadow-[var(--primary)]/10
            `}
          >
            {/* Premium Glass Morphism Background */}
            <div className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/3 via-transparent to-[var(--secondary)]/3 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500' />
            
            {/* Subtle shine effect */}
            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60' />
            
            {/* Premium decorative elements */}
            <div className='absolute top-2 right-2 w-16 h-16 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--secondary)]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700' />

            <div className='relative z-10'>
              {/* Icon */}
              <div
                className={`
                inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl mb-4 md:mb-5
                ${colors.icon} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3
                shadow-lg group-hover:shadow-xl backdrop-blur-sm
                relative overflow-hidden
                before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent
                before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300
              `}
              >
                <IconComponent className='w-5 h-5 md:w-6 md:h-6' />
              </div>

              {/* Value */}
              <div className='mb-2'>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className='text-2xl md:text-3xl font-bold bg-gradient-to-br from-[var(--quaternary)] via-[var(--tertiary)] to-[var(--quaternary)] bg-clip-text text-transparent leading-none group-hover:from-[var(--tertiary)] group-hover:to-[var(--quaternary)] transition-all duration-500'
                >
                  {typeof card.value === 'string' ? card.value : card.value.toLocaleString()}
                </motion.div>
              </div>

              {/* Title and Subtitle */}
              <div className='space-y-0.5 md:space-y-1'>
                <h3 className='font-semibold bg-gradient-to-r from-[var(--quaternary)] to-[var(--tertiary)] bg-clip-text text-transparent text-xs md:text-sm leading-tight group-hover:from-[var(--tertiary)] group-hover:to-[var(--secondary)] transition-all duration-500'>
                  {card.title}
                </h3>
                <p className='text-[var(--neutral-500)] group-hover:text-[var(--neutral-600)] text-xs leading-tight hidden md:block transition-colors duration-300'>
                  {card.subtitle}
                </p>
              </div>

              {/* Trend Indicator - Desktop only */}
              {card.trend && (
                <div
                  className={`
                  hidden md:flex items-center gap-1.5 mt-3 md:mt-4 pt-3 md:pt-4 
                  border-t border-gradient-to-r from-transparent via-[var(--neutral-200)] to-transparent
                  border-t border-[var(--neutral-150)] group-hover:border-[var(--primary)]/20
                  ${colors.trend} transition-all duration-300
                `}
                >
                  <TrendingUp className='w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-300' />
                  <span className='text-xs font-medium'>
                    {typeof card.trend.value === 'number' && card.trend.value > 0 ? '+' : ''}
                    {card.trend.value}{typeof card.trend.value === 'number' ? '%' : ''} {card.trend.label}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}