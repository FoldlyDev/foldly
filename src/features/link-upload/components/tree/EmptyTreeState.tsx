'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UploadHighlight } from '@/components/ui/feedback/upload-highlight';

export function EmptyTreeState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className='flex h-[50vh] items-center justify-center p-8'
    >
      <UploadHighlight />
    </motion.div>
  );
}
