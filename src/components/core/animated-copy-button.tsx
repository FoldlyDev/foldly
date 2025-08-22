'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import { ActionButton } from './action-button';

interface AnimatedCopyButtonProps {
  onCopy: () => Promise<void> | void;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  className?: string;
  iconSize?: string;
}

export function AnimatedCopyButton({
  onCopy,
  variant = 'ghost',
  size = 'sm',
  title = 'Copy link',
  className = '',
  iconSize = 'w-4 h-4',
}: AnimatedCopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCopied || isLoading) return;

    setIsLoading(true);

    try {
      await onCopy();
      setIsCopied(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <ActionButton
        onClick={handleCopy}
        variant={variant}
        size={size}
        title={isCopied ? 'Copied!' : title}
        className={`${className} transition-all duration-200 ${
          isCopied
            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }`}
        disabled={isLoading}
      >
        <AnimatePresence mode='wait'>
          {isCopied ? (
            <motion.div
              key='check'
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: 1,
                rotate: [0, 10, 0],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                times: [0, 0.6, 1],
              }}
            >
              <Check className={iconSize} />
            </motion.div>
          ) : (
            <motion.div
              key='copy'
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: 1,
                opacity: 1,
                rotate: isLoading ? [0, -10, 10, -10, 0] : 0,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                duration: isLoading ? 0.4 : 0.2,
                ease: 'easeInOut',
              }}
            >
              <Copy className={iconSize} />
            </motion.div>
          )}
        </AnimatePresence>
      </ActionButton>
    </motion.div>
  );
}
