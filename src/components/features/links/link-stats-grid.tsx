'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Eye,
} from 'lucide-react';

interface LinkStatsGridProps {
  links: Array<{
    id: string;
    name: string;
    status: 'active' | 'paused' | 'expired';
    uploads: number;
    views: number;
    lastActivity: string;
    createdAt: string;
  }>;
}

export function LinkStatsGrid({ links }: LinkStatsGridProps) {
  // Calculate aggregate stats
  const totalViews = links.reduce((sum, link) => sum + link.views, 0);
  const totalUploads = links.reduce((sum, link) => sum + link.uploads, 0);
  const activeLinks = links.filter(link => link.status === 'active').length;
  const avgUploadsPerLink = totalUploads / links.length || 0;
  const avgViewsPerLink = totalViews / links.length || 0;
  const conversionRate = totalViews > 0 ? (totalUploads / totalViews) * 100 : 0;

  // Find most recent activity
  const mostRecentActivity = links.reduce((recent, link) => {
    return link.lastActivity < recent ? link.lastActivity : recent;
  }, links[0]?.lastActivity || 'No activity');

  const stats = [
    {
      title: 'Total Performance',
      value: `${totalUploads} uploads`,
      subtitle: `from ${totalViews} views`,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-50',
      trend: `${conversionRate.toFixed(1)}% conversion rate`,
    },
    {
      title: 'Average Performance',
      value: `${avgUploadsPerLink.toFixed(1)} uploads`,
      subtitle: 'per link',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50',
      trend: `${avgViewsPerLink.toFixed(1)} views per link`,
    },
    {
      title: 'Active Links',
      value: `${activeLinks}/${links.length}`,
      subtitle: 'currently collecting',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
      trend: `${Math.round((activeLinks / links.length) * 100)}% active`,
    },
    {
      title: 'Recent Activity',
      value: mostRecentActivity,
      subtitle: 'last upload',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50',
      trend: 'Real-time tracking',
    },
  ];

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
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-bold text-[var(--quaternary)]'>
          Quick Stats
        </h2>
        <div className='flex items-center gap-1 text-sm text-[var(--neutral-500)]'>
          <Calendar className='w-4 h-4' />
          Last 30 days
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        animate='visible'
        className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
      >
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;

          return (
            <motion.div
              key={stat.title}
              variants={cardVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className='group bg-white rounded-xl p-6 border border-[var(--neutral-200)] 
                       shadow-sm hover:shadow-md transition-all duration-300'
            >
              {/* Background Gradient */}
              <div
                className='absolute inset-0 bg-gradient-to-br from-white via-white to-[var(--neutral-50)] 
                            rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'
              />

              <div className='relative z-10'>
                {/* Icon */}
                <div
                  className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                  ${stat.color} transition-all duration-300 group-hover:scale-110
                `}
                >
                  <IconComponent className='w-6 h-6' />
                </div>

                {/* Value */}
                <div className='mb-3'>
                  <div className='text-2xl font-bold text-[var(--quaternary)] mb-1'>
                    {stat.value}
                  </div>
                  <div className='text-[var(--neutral-500)] text-sm'>
                    {stat.subtitle}
                  </div>
                </div>

                {/* Title */}
                <div className='mb-3'>
                  <h3 className='font-semibold text-[var(--quaternary)] text-sm'>
                    {stat.title}
                  </h3>
                </div>

                {/* Trend */}
                <div className='pt-3 border-t border-[var(--neutral-100)]'>
                  <div className='flex items-center gap-1 text-xs text-[var(--neutral-500)]'>
                    <TrendingUp className='w-3 h-3' />
                    {stat.trend}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='bg-gradient-to-r from-[var(--primary-subtle)] to-[var(--secondary-subtle)] 
                 rounded-xl p-6 border border-[var(--neutral-200)]'
      >
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='font-bold text-[var(--quaternary)] mb-2'>
              🎯 Performance Insights
            </h3>
            <p className='text-[var(--neutral-600)] text-sm leading-relaxed'>
              {conversionRate > 20
                ? 'Excellent conversion rate! Your links are performing very well.'
                : conversionRate > 10
                  ? 'Good conversion rate! Consider optimizing your link descriptions.'
                  : 'Room for improvement. Try adding clear instructions and reducing friction.'}
            </p>
          </div>

          <div className='text-right'>
            <div className='text-2xl font-bold text-[var(--primary)] mb-1'>
              {conversionRate.toFixed(1)}%
            </div>
            <div className='text-xs text-[var(--neutral-500)]'>
              Conversion Rate
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
