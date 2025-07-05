'use client';

import { motion } from 'framer-motion';
import { Link2, Eye, FileText, TrendingUp } from 'lucide-react';
import { METRICS_LABELS } from '../../constants';

interface LinksOverviewCardsProps {
  data?: {
    totalLinks: number;
    activeLinks: number;
    totalUploads: number;
    totalViews: number;
  };
}

type ColorType = 'primary' | 'secondary' | 'tertiary' | 'success';

export function LinksOverviewCards({ data }: LinksOverviewCardsProps) {
  // Provide default values when data is undefined - minimal fix for crash
  const safeData = data || {
    totalLinks: 0,
    activeLinks: 0,
    totalUploads: 0,
    totalViews: 0,
  };
  const cards = [
    {
      title: METRICS_LABELS.totalLinks,
      value: safeData.totalLinks,
      subtitle: METRICS_LABELS.uploadLinksCreated,
      icon: Link2,
      color: 'primary' as ColorType,
      trend: { value: 12, isPositive: true, label: 'vs last month' },
    },
    {
      title: METRICS_LABELS.activeLinks,
      value: safeData.activeLinks,
      subtitle: METRICS_LABELS.currentlyAcceptingFiles,
      icon: TrendingUp,
      color: 'success' as ColorType,
      trend: { value: 8, isPositive: true, label: 'this week' },
    },
    {
      title: METRICS_LABELS.totalUploads,
      value: safeData.totalUploads,
      subtitle: METRICS_LABELS.filesCollected,
      icon: FileText,
      color: 'secondary' as ColorType,
      trend: { value: 15, isPositive: true, label: 'vs last month' },
    },
    {
      title: METRICS_LABELS.totalViews,
      value: safeData.totalViews,
      subtitle: METRICS_LABELS.linkPageVisits,
      icon: Eye,
      color: 'tertiary' as ColorType,
      trend: { value: 23, isPositive: true, label: 'vs last month' },
    },
  ];

  const colorClasses = {
    primary: {
      icon: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
      trend: 'text-[var(--primary)]',
      accent: 'border-l-[var(--primary)]',
    },
    secondary: {
      icon: 'text-[var(--secondary)] bg-[var(--secondary-subtle)]',
      trend: 'text-[var(--secondary)]',
      accent: 'border-l-[var(--secondary)]',
    },
    tertiary: {
      icon: 'text-[var(--tertiary)] bg-[var(--tertiary-subtle)]',
      trend: 'text-[var(--tertiary)]',
      accent: 'border-l-[var(--tertiary)]',
    },
    success: {
      icon: 'text-[var(--success-green)] bg-green-50',
      trend: 'text-[var(--success-green)]',
      accent: 'border-l-[var(--success-green)]',
    },
  };

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

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'
    >
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`
              group relative bg-white rounded-2xl p-6 
              border border-[var(--neutral-200)] shadow-sm hover:shadow-lg
              transition-all duration-300
              border-l-4 ${colors.accent}
            `}
          >
            {/* Background Gradient Overlay */}
            <div
              className='absolute inset-0 bg-gradient-to-br from-white via-white to-[var(--neutral-50)] 
                          rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
            />

            <div className='relative z-10'>
              {/* Icon */}
              <div
                className={`
                inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                ${colors.icon} transition-all duration-300 group-hover:scale-110
              `}
              >
                <IconComponent className='w-6 h-6' />
              </div>

              {/* Value */}
              <div className='mb-2'>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                  className='text-3xl font-bold text-[var(--quaternary)] leading-none'
                >
                  {(isNaN(card.value) ? 0 : card.value).toLocaleString()}
                </motion.div>
              </div>

              {/* Title and Subtitle */}
              <div className='space-y-1'>
                <h3 className='font-semibold text-[var(--quaternary)] text-sm'>
                  {card.title}
                </h3>
                <p className='text-[var(--neutral-500)] text-xs'>
                  {card.subtitle}
                </p>
              </div>

              {/* Trend Indicator */}
              {card.trend && (
                <div
                  className={`
                  flex items-center gap-1 mt-3 pt-3 border-t border-[var(--neutral-100)]
                  ${colors.trend}
                `}
                >
                  <TrendingUp className='w-3 h-3' />
                  <span className='text-xs font-medium'>
                    +{card.trend.value}% {card.trend.label}
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
