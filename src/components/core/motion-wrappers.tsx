'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';

// Motion Div wrapper
type MotionDivProps = HTMLMotionProps<'div'>;

export const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(
  function MotionDiv({ children, ...props }, ref) {
    return (
      <motion.div ref={ref} {...props}>
        {children}
      </motion.div>
    );
  }
);

// Motion P wrapper
type MotionPProps = HTMLMotionProps<'p'>;

export const MotionP = React.forwardRef<HTMLParagraphElement, MotionPProps>(
  function MotionP({ children, ...props }, ref) {
    return (
      <motion.p ref={ref} {...props}>
        {children}
      </motion.p>
    );
  }
);

// AnimatePresence wrapper
interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}

export function AnimatePresenceWrapper({
  children,
  mode = 'wait',
}: AnimatePresenceWrapperProps) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>;
}

// Animated Container - combines motion.div with common animation patterns
interface AnimatedContainerProps extends HTMLMotionProps<'div'> {
  animationType?: 'fadeIn' | 'slideUp' | 'fadeInBounce' | 'stagger';
  staggerChildren?: number;
  delayChildren?: number;
}

export const AnimatedContainer = React.forwardRef<
  HTMLDivElement,
  AnimatedContainerProps
>(function AnimatedContainer(
  {
    children,
    animationType = 'fadeIn',
    staggerChildren = 0.1,
    delayChildren = 0.2,
    ...props
  },
  ref
) {
  const getVariants = (): Variants => {
    switch (animationType) {
      case 'fadeIn':
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
          },
          exit: {
            opacity: 0,
            transition: { duration: 0.3, ease: 'easeInOut' },
          },
        };
      case 'slideUp':
        return {
          initial: { opacity: 0, y: 60 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.7,
              type: 'spring',
              stiffness: 80,
              damping: 20,
            },
          },
          exit: {
            opacity: 0,
            y: 30,
            transition: { duration: 0.3, ease: 'easeInOut' },
          },
        };
      case 'fadeInBounce':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
              damping: 15,
              mass: 1,
            },
          },
          exit: {
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.3, ease: 'easeInOut' },
          },
        };
      case 'stagger':
        return {
          initial: {},
          animate: {
            transition: {
              staggerChildren,
              delayChildren,
            },
          },
          exit: {
            transition: {
              staggerChildren: staggerChildren * 0.5,
              staggerDirection: -1,
            },
          },
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={getVariants()}
      initial='initial'
      animate='animate'
      exit='exit'
      {...props}
    >
      {children}
    </motion.div>
  );
});

// Stagger Item - for use with stagger containers
interface StaggerItemProps extends HTMLMotionProps<'div'> {}

export const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  function StaggerItem({ children, ...props }, ref) {
    const staggerItemVariants: Variants = {
      initial: { opacity: 0, y: 30 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          type: 'spring',
          stiffness: 80,
          damping: 20,
        },
      },
      exit: {
        opacity: 0,
        y: 15,
        transition: { duration: 0.3, ease: 'easeInOut' },
      },
    };

    return (
      <motion.div ref={ref} variants={staggerItemVariants} {...props}>
        {children}
      </motion.div>
    );
  }
);
