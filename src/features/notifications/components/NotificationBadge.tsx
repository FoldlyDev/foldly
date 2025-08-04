/**
 * NotificationBadge - Animated badge component for unread notifications
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  pulse?: boolean;
  onClick?: () => void;
}

export function NotificationBadge({
  count,
  className,
  pulse = true,
  onClick,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={cn('relative', className)}
      >
        {/* Pulse animation */}
        {pulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-600"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Badge */}
        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative flex items-center justify-center',
            'min-w-[20px] h-5 px-1.5',
            'bg-blue-600 text-white',
            'rounded-full text-xs font-bold',
            'shadow-sm',
            onClick && 'cursor-pointer hover:bg-blue-700',
            'transition-colors'
          )}
        >
          {count > 99 ? '99+' : count}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * NotificationDot - Simple dot indicator for notifications
 */
export function NotificationDot({
  className,
  pulse = true,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      {pulse && (
        <motion.div
          className="absolute inset-0 w-2 h-2 rounded-full bg-blue-600"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      <div className="relative w-2 h-2 rounded-full bg-blue-600" />
    </div>
  );
}