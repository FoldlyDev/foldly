'use client';

import { motion } from 'framer-motion';
import {
  Link2,
  FileText,
  HardDrive,
  TrendingUp,
  Users,
  Clock,
  Download,
  Zap,
} from 'lucide-react';

interface AnalyticsCardData {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color: 'primary' | 'secondary' | 'tertiary' | 'success';
  highlight?: boolean;
}

interface AnalyticsCardsProps {
  data?: {
    totalLinks: number;
    totalFiles: number;
    storageUsed: string;
    activeLinks: number;
    totalViews: number;
    avgFilesPerLink: number;
    recentUploads: number;
  };
}

export function AnalyticsCards({ data }: AnalyticsCardsProps) {
  // Default data for when Supabase isn't set up yet
  const defaultData = {
    totalLinks: 0,
    totalFiles: 0,
    storageUsed: '0 MB',
    activeLinks: 0,
    totalViews: 0,
    avgFilesPerLink: 0,
    recentUploads: 0,
  };

  const analyticsData = data || defaultData;

  const cards: AnalyticsCardData[] = [
    {
      title: 'Upload Links',
      value: analyticsData.totalLinks,
      subtitle: 'Base + Custom Topic Links',
      icon: Link2,
      trend:
        analyticsData.totalLinks > 0
          ? {
              value: 12,
              isPositive: true,
              label: 'vs last month',
            }
          : undefined,
      color: 'primary',
      highlight: analyticsData.totalLinks === 0, // Highlight when empty to encourage action
    },
    {
      title: 'Files Collected',
      value: analyticsData.totalFiles,
      subtitle: 'Through your links',
      icon: FileText,
      trend:
        analyticsData.totalFiles > 0
          ? {
              value: 24,
              isPositive: true,
              label: 'this week',
            }
          : undefined,
      color: 'secondary',
    },
    {
      title: 'Storage Used',
      value: analyticsData.storageUsed,
      subtitle: 'Free plan: Unlimited',
      icon: HardDrive,
      color: 'tertiary',
    },
    {
      title: 'Active Collections',
      value: analyticsData.activeLinks,
      subtitle: 'Currently receiving files',
      icon: Zap,
      trend:
        analyticsData.activeLinks > 0
          ? {
              value: 5,
              isPositive: true,
              label: 'this week',
            }
          : undefined,
      color: 'success',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  const colorClasses = {
    primary: {
      icon: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
      trend: 'text-[var(--primary)]',
      accent: 'border-l-[var(--primary)]',
      highlight:
        'ring-2 ring-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary-subtle)] to-white',
    },
    secondary: {
      icon: 'text-[var(--secondary)] bg-[var(--secondary-subtle)]',
      trend: 'text-[var(--secondary)]',
      accent: 'border-l-[var(--secondary)]',
      highlight: 'ring-1 ring-[var(--secondary)]/10',
    },
    tertiary: {
      icon: 'text-[var(--tertiary)] bg-[var(--tertiary-subtle)]',
      trend: 'text-[var(--tertiary)]',
      accent: 'border-l-[var(--tertiary)]',
      highlight: 'ring-1 ring-[var(--tertiary)]/10',
    },
    success: {
      icon: 'text-[var(--success-green)] bg-green-50',
      trend: 'text-[var(--success-green)]',
      accent: 'border-l-[var(--success-green)]',
      highlight: 'ring-1 ring-green-200',
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='analytics-grid'
    >
      {cards.map((card, index) => {
        const colors = colorClasses[card.color];
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{
              y: -4,
              transition: { duration: 0.2 },
            }}
            className={`
              analytics-card group relative cursor-pointer
              ${card.highlight ? colors.highlight : ''}
            `}
          >
            {/* Enhanced background for highlighted cards */}
            {card.highlight && (
              <div
                className='absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--primary)]/10 
                            rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
              />
            )}

            <div className='relative z-10'>
              {/* Icon with enhanced styling */}
              <div
                className={`
                inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                ${colors.icon} transition-all duration-300 group-hover:scale-110
                ${card.highlight ? 'shadow-lg shadow-[var(--primary)]/20' : ''}
              `}
              >
                <IconComponent className='w-6 h-6' />
              </div>

              {/* Value with enhanced animation */}
              <div className='mb-3'>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className='text-3xl font-bold text-[var(--quaternary)] leading-none'
                >
                  {typeof card.value === 'number'
                    ? card.value.toLocaleString()
                    : card.value}
                </motion.div>
              </div>

              {/* Title and Subtitle with better hierarchy */}
              <div className='space-y-1 mb-3'>
                <h3 className='card-title font-semibold text-[var(--quaternary)]'>
                  {card.title}
                </h3>
                <p className='text-[var(--neutral-500)] text-xs leading-relaxed'>
                  {card.subtitle}
                </p>
              </div>

              {/* Enhanced Trend Indicator */}
              {card.trend && (
                <div
                  className={`
                  flex items-center gap-1.5 pt-3 border-t border-[var(--neutral-100)]
                  ${colors.trend}
                `}
                >
                  <TrendingUp className='w-3.5 h-3.5' />
                  <span className='text-xs font-medium'>
                    +{card.trend.value}% {card.trend.label}
                  </span>
                </div>
              )}

              {/* Call-to-action for empty state */}
              {card.highlight && card.value === 0 && (
                <div className='mt-3 pt-3 border-t border-[var(--primary)]/20'>
                  <div className='flex items-center gap-1 text-[var(--primary)] text-xs font-medium'>
                    <span>Create your first link</span>
                    <svg
                      className='w-3 h-3 transition-transform group-hover:translate-x-0.5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
