'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FolderIcon } from 'lucide-react';

export function EmptyTreeState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className='flex h-full items-center justify-center py-12'
    >
      <div className="text-center">
        <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          No files uploaded yet
        </h3>
      </div>
    </motion.div>
  );
}