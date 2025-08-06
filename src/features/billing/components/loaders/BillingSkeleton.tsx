// =============================================================================
// BILLING SKELETON - Animated Loading State Component
// =============================================================================
// 🎯 Clean skeleton loader for billing page with smooth animations

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/core/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/core/shadcn/card';

export function BillingSkeleton() {
  return (
    <motion.div 
      className='dashboard-container min-h-screen overflow-hidden'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Skeleton */}
      <motion.div 
        className='workspace-header'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className='workspace-header-content'>
          <div className='workspace-header-text'>
            <Skeleton className='h-8 w-64 mb-2' />
          </div>
        </div>
      </motion.div>

      {/* Pricing Section Skeleton */}
      <motion.div 
        className='space-y-6 mt-6'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Description Skeleton */}
        <motion.div 
          className='space-y-2'
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-80' />
        </motion.div>

        {/* Pricing Cards Skeleton */}
        <motion.div 
          className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
            >
              <Card className='relative'>
                <CardContent className='p-6 space-y-4'>
                  {/* Plan Name */}
                  <div className='text-center space-y-2'>
                    <Skeleton className='h-6 w-20 mx-auto' />
                    <Skeleton className='h-4 w-24 mx-auto' />
                  </div>
                  
                  {/* Price */}
                  <div className='text-center space-y-1'>
                    <Skeleton className='h-10 w-16 mx-auto' />
                    <Skeleton className='h-3 w-12 mx-auto' />
                  </div>
                  
                  {/* Features List */}
                  <div className='space-y-3 py-4'>
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className='flex items-center gap-3'>
                        <Skeleton className='h-4 w-4 rounded-full' />
                        <Skeleton className='h-4 flex-1' />
                      </div>
                    ))}
                  </div>
                  
                  {/* Button */}
                  <Skeleton className='h-10 w-full' />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default BillingSkeleton;