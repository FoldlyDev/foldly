'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  ArrowRight,
  Upload,
  TrendingUp,
  Download,
  Eye,
  Users,
  Calendar,
  FileText,
  Link2,
} from 'lucide-react';
import { GradientButton, ContentLoader } from '@/components/ui';
import type { DashboardOverview } from '../../types';

// Simple interface that works without complex type extensions
interface AnalyticsContainerProps {
  readonly data?: {
    readonly totalLinks: number;
    readonly totalFiles: number;
    readonly totalUploads: number;
    readonly conversionRate?: number;
    readonly topPerformingLinks?: Array<{
      readonly name: string;
      readonly views: number;
      readonly uploads: number;
      readonly url: string;
    }>;
    readonly monthlyStats?: Array<{
      readonly month: string;
      readonly views: number;
      readonly uploads: number;
    }>;
    readonly recentActivity?: Array<{
      readonly description: string;
      readonly timestamp: Date;
    }>;
  };
  readonly isLoading?: boolean;
  readonly error?: string | null;
}

export function AnalyticsContainer({
  data,
  isLoading = false,
  error = null,
}: AnalyticsContainerProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  const mockData: AnalyticsContainerProps['data'] = {
    totalLinks: 0,
    totalFiles: 0,
    totalUploads: 0,
    conversionRate: 0,
    topPerformingLinks: [],
    monthlyStats: [],
    recentActivity: [],
  };

  const analyticsData = data || mockData;
  const hasData = analyticsData?.totalUploads > 0;

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleCreateLink = () => {
    router.push('/dashboard/links?action=create&type=base');
  };

  const handleViewLinks = () => {
    router.push('/dashboard/links');
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)]'>
        <div className='home-container w-full mx-auto'>
          <div className='loading-container'>
            <ContentLoader />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-[var(--neutral-50)] flex items-center justify-center'>
        <div className='error-container'>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='analytics-card w-full max-w-md mx-auto text-center'
          >
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4'>
              <BarChart3 className='w-6 h-6 sm:w-8 sm:h-8 text-red-500' />
            </div>
            <h2 className='text-lg sm:text-xl font-semibold text-[var(--quaternary)] mb-2'>
              Analytics Unavailable
            </h2>
            <p className='text-sm sm:text-base text-[var(--neutral-600)] mb-4 px-2'>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className='w-full sm:w-auto px-6 py-2.5 bg-[var(--primary)] text-[var(--quaternary)] rounded-lg font-medium hover:bg-[var(--primary-dark)] transition-colors text-sm sm:text-base'
            >
              Retry
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[var(--neutral-50)]'>
      <div className='home-container w-full mx-auto'>
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className='space-y-8'
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
                  <div>
                    <h1 className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                      Analytics & Insights
                    </h1>
                    <p className='text-[var(--neutral-600)]'>
                      Track your file collection performance and growth
                    </p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleViewLinks}
                      className='px-4 py-2 border border-[var(--neutral-200)] rounded-lg hover:border-[var(--neutral-300)] transition-colors text-[var(--neutral-600)] hover:text-[var(--quaternary)]'
                    >
                      Manage Links
                    </motion.button>

                    <GradientButton
                      variant='primary'
                      size='md'
                      onClick={handleCreateLink}
                      className='shadow-brand'
                    >
                      <Upload className='w-4 h-4 mr-2' />
                      Create Link
                    </GradientButton>
                  </div>
                </div>
              </motion.div>

              {hasData ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className='space-y-8'
                >
                  {/* Analytics Cards */}
                  <div className='analytics-grid'>
                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Total Views</h3>
                        <div className='card-icon bg-blue-50 rounded-lg flex items-center justify-center'>
                          <Eye className='w-6 h-6 text-blue-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {analyticsData?.totalUploads?.toLocaleString() || '0'}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Link page visits
                      </p>
                    </div>

                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>File Uploads</h3>
                        <div className='card-icon bg-green-50 rounded-lg flex items-center justify-center'>
                          <Upload className='w-6 h-6 text-green-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {analyticsData?.totalFiles?.toLocaleString() || '0'}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Successful uploads
                      </p>
                    </div>

                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Conversion Rate</h3>
                        <div className='card-icon bg-purple-50 rounded-lg flex items-center justify-center'>
                          <TrendingUp className='w-6 h-6 text-purple-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {((analyticsData?.conversionRate || 0) * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Views to uploads
                      </p>
                    </div>

                    <div className='analytics-card'>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='card-title'>Total Files</h3>
                        <div className='card-icon bg-orange-50 rounded-lg flex items-center justify-center'>
                          <FileText className='w-6 h-6 text-orange-600' />
                        </div>
                      </div>
                      <div className='text-3xl font-bold text-[var(--quaternary)] mb-2'>
                        {analyticsData?.totalLinks?.toLocaleString() || '0'}
                      </div>
                      <p className='text-[var(--neutral-500)] text-sm'>
                        Files collected
                      </p>
                    </div>
                  </div>

                  {/* Additional Analytics Content */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                    {/* Top Performing Links */}
                    <div className='analytics-card'>
                      <h3 className='card-title mb-6'>Top Performing Links</h3>
                      <div className='space-y-4'>
                        {(analyticsData?.topPerformingLinks?.length || 0) >
                        0 ? (
                          analyticsData?.topPerformingLinks?.map(
                            (link, index) => (
                              <div
                                key={index}
                                className='flex items-center justify-between p-3 bg-[var(--neutral-50)] rounded-lg'
                              >
                                <div>
                                  <h4 className='font-medium text-[var(--quaternary)]'>
                                    {link.name}
                                  </h4>
                                  <p className='text-sm text-[var(--neutral-500)]'>
                                    {link.url}
                                  </p>
                                </div>
                                <div className='text-right'>
                                  <div className='text-sm font-medium text-[var(--quaternary)]'>
                                    {link.uploads} uploads
                                  </div>
                                  <div className='text-xs text-[var(--neutral-500)]'>
                                    {link.views} views
                                  </div>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <div className='text-center py-8 text-[var(--neutral-500)]'>
                            <p>No performance data available yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className='analytics-card'>
                      <h3 className='card-title mb-6'>Recent Activity</h3>
                      <div className='space-y-4'>
                        {(analyticsData?.recentActivity?.length || 0) > 0 ? (
                          analyticsData?.recentActivity?.map(
                            (activity, index) => (
                              <div
                                key={index}
                                className='flex items-center gap-3 p-3 bg-[var(--neutral-50)] rounded-lg'
                              >
                                <div className='w-8 h-8 bg-[var(--primary-subtle)] rounded-full flex items-center justify-center'>
                                  <Upload className='w-4 h-4 text-[var(--primary)]' />
                                </div>
                                <div className='flex-1'>
                                  <p className='text-sm font-medium text-[var(--quaternary)]'>
                                    {activity.description}
                                  </p>
                                  <p className='text-xs text-[var(--neutral-500)]'>
                                    {activity.timestamp.toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          <div className='text-center py-8 text-[var(--neutral-500)]'>
                            <p>No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <div className='text-center py-16'>
                    <div className='w-24 h-24 bg-gradient-to-br from-[var(--primary-subtle)] to-white rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[var(--neutral-200)] shadow-lg'>
                      <BarChart3 className='w-12 h-12 text-[var(--primary)]' />
                    </div>

                    <h2 className='text-2xl font-bold text-[var(--quaternary)] mb-3'>
                      Analytics Coming Soon
                    </h2>

                    <p className='text-[var(--neutral-600)] mb-8 leading-relaxed max-w-md mx-auto'>
                      Analytics will be available once you start collecting
                      files through your upload links. Let's get your first link
                      created!
                    </p>

                    <div className='flex flex-col sm:flex-row gap-4 items-center justify-center'>
                      <GradientButton
                        variant='primary'
                        size='lg'
                        onClick={handleCreateLink}
                        className='shadow-brand'
                      >
                        <Upload className='w-5 h-5 mr-2' />
                        Create Upload Link
                        <ArrowRight className='w-5 h-5 ml-2' />
                      </GradientButton>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleViewLinks}
                        className='px-6 py-3 text-[var(--neutral-600)] hover:text-[var(--quaternary)] font-medium transition-colors duration-200'
                      >
                        View All Links
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
