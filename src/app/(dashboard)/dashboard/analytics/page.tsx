'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BarChart3, ArrowRight, Upload } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='text-center max-w-md'
      >
        <div className='w-16 h-16 bg-[var(--neutral-100)] rounded-xl flex items-center justify-center mx-auto mb-6'>
          <BarChart3 className='w-8 h-8 text-[var(--neutral-400)]' />
        </div>

        <h1 className='text-2xl font-bold text-[var(--quaternary)] mb-3'>
          Analytics Coming Soon
        </h1>

        <p className='text-[var(--neutral-600)] mb-8 leading-relaxed'>
          Analytics will be available once you start collecting files through
          your upload links. Let's get your first link created!
        </p>

        <Link href='/dashboard/links'>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className='flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white 
                     rounded-xl hover:bg-[var(--primary)]/90 transition-colors font-medium mx-auto'
          >
            <Upload className='w-4 h-4' />
            Create Upload Link
            <ArrowRight className='w-4 h-4' />
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
