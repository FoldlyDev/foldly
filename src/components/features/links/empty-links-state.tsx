'use client';

import { motion } from 'framer-motion';
import { Link2, Plus, Sparkles } from 'lucide-react';

interface EmptyLinksStateProps {
  onCreateLink: () => void;
}

export function EmptyLinksState({ onCreateLink }: EmptyLinksStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className='text-center py-16 px-6'
    >
      {/* Illustration */}
      <div className='relative mb-8'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className='w-24 h-24 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] 
                   rounded-3xl flex items-center justify-center mx-auto mb-4'
        >
          <Link2 className='w-12 h-12 text-white' />
        </motion.div>

        {/* Floating sparkles */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className='absolute -top-2 -right-2'
        >
          <Sparkles className='w-6 h-6 text-[var(--tertiary)] opacity-60' />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className='absolute -bottom-2 -left-2'
        >
          <Sparkles className='w-4 h-4 text-[var(--primary)] opacity-40' />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className='text-2xl font-bold text-[var(--quaternary)] mb-3'>
          Create Your First Upload Link
        </h2>

        <p className='text-[var(--neutral-600)] text-lg leading-relaxed mb-8 max-w-md mx-auto'>
          Start collecting files from clients with beautiful, branded upload
          links. No setup required from your clients.
        </p>

        {/* Features */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto'>
          {[
            {
              icon: '🎨',
              title: 'Branded Experience',
              description: 'Custom URLs with your branding',
            },
            {
              icon: '⚡',
              title: 'Zero Friction',
              description: 'No signups required for clients',
            },
            {
              icon: '📊',
              title: 'Smart Organization',
              description: 'Auto-organize and track uploads',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className='p-4 bg-white rounded-xl border border-[var(--neutral-200)]'
            >
              <div className='text-2xl mb-2'>{feature.icon}</div>
              <h3 className='font-semibold text-[var(--quaternary)] text-sm mb-1'>
                {feature.title}
              </h3>
              <p className='text-[var(--neutral-500)] text-xs'>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreateLink}
          className='inline-flex items-center gap-3 px-8 py-4 bg-[var(--primary)] text-white 
                   rounded-2xl hover:bg-[var(--primary)]/90 transition-all duration-300 
                   font-semibold text-lg shadow-lg hover:shadow-xl'
        >
          <Plus className='w-6 h-6' />
          Create My First Link
        </motion.button>

        <p className='text-[var(--neutral-500)] text-sm mt-4'>
          Takes less than 30 seconds to set up
        </p>
      </motion.div>
    </motion.div>
  );
}
