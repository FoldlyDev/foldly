'use client';

import { motion } from 'framer-motion';

export function FilesHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='files-header-content'
    >
      <div className='files-header-text'>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Shared Files
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className='text-muted-foreground text-base sm:text-lg'
        >
          Drag files from your links to your personal space to keep what matters most 🎯
        </motion.p>
      </div>
    </motion.div>
  );
}