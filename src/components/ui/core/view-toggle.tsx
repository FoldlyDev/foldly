'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

type ViewType = 'grid' | 'list';

interface ViewToggleProps {
  value: ViewType;
  onChange: (view: ViewType) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ViewToggle({
  value,
  onChange,
  className,
  size = 'md',
}: ViewToggleProps) {
  const sizeClasses = {
    sm: 'p-0.5',
    md: 'p-1',
    lg: 'p-1.5',
  };

  const buttonSizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const views = [
    { key: 'grid' as const, label: 'Grid', icon: Grid3X3 },
    { key: 'list' as const, label: 'List', icon: List },
  ];

  return (
    <div
      className={cn(
        'flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg relative border border-gray-200 dark:border-gray-700',
        sizeClasses[size],
        className
      )}
    >
      {views.map(view => {
        const IconComponent = view.icon;
        const isActive = value === view.key;

        return (
          <motion.button
            key={view.key}
            onClick={() => onChange(view.key)}
            className={cn(
              'relative rounded-md transition-all duration-300 font-medium flex items-center justify-center gap-2 cursor-pointer border-0 bg-transparent flex-1',
              buttonSizeClasses[size],
              isActive
                ? 'text-gray-900 dark:text-gray-100 z-10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-20'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Background for active state */}
            {isActive && (
              <motion.div
                layoutId='activeBackground'
                className='absolute inset-0 bg-white dark:bg-gray-700 shadow-sm rounded-md border border-gray-200 dark:border-gray-600'
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                  duration: 0.2,
                }}
              />
            )}

            {/* Content */}
            <div className='relative flex items-center justify-center gap-1.5 w-full'>
              <IconComponent
                className={cn(
                  iconSizeClasses[size],
                  'transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span className='hidden sm:inline transition-opacity duration-200'>
                {view.label}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export type { ViewType, ViewToggleProps };
