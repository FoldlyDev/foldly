'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { BillingHeader } from '../sections/BillingHeader';
import { PricingTable } from '@clerk/nextjs';
import { BillingSkeleton } from '../loaders/BillingSkeleton';

export function BillingContainer() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (userLoaded) {
      setIsLoaded(true);
    }
  }, [userLoaded]);

  if (!isLoaded) {
    return <BillingSkeleton />;
  }

  return (
    <motion.div 
      className='dashboard-container'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header Section */}
      <motion.div 
        className='workspace-header'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <BillingHeader />
      </motion.div>

      {/* Pricing Section */}
      <motion.div 
        className='space-y-6 mt-6'
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className='text-xl font-semibold text-[var(--quaternary)] mb-2'>
            Choose Your Plan
          </h3>
          <p className='text-[var(--neutral-600)]'>
            Upgrade or downgrade your subscription at any time. Changes take
            effect immediately.
          </p>
        </motion.div>

        {/* Clerk Pricing Table */}
        <motion.div 
          className='max-w-6xl mx-auto'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
        >
          <PricingTable newSubscriptionRedirectUrl='/dashboard/billing' />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
