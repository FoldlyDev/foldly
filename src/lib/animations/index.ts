/**
 * Reusable Framer Motion Animations Library
 * Using latest Motion for React API with variants and modern patterns
 */

import { Variants, Transition } from 'framer-motion';

// =============================================================================
// FADE ANIMATIONS
// =============================================================================

export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for gentle feel
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const fadeInWithBounce: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
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
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const fadeOut: Variants = {
  initial: {
    opacity: 1,
  },
  animate: {
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// SLIDE ANIMATIONS
// =============================================================================

export const slideInFromLeft: Variants = {
  initial: {
    opacity: 0,
    x: -60,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const slideInFromRight: Variants = {
  initial: {
    opacity: 0,
    x: 60,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      type: 'spring',
      stiffness: 80,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const slideInFromTop: Variants = {
  initial: {
    opacity: 0,
    y: -60,
  },
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
    y: -30,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const slideInFromBottom: Variants = {
  initial: {
    opacity: 0,
    y: 60,
  },
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
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// SCALE ANIMATIONS
// =============================================================================

export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const scaleInGentle: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      type: 'spring',
      stiffness: 120,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// SPECIAL ANIMATIONS
// =============================================================================

export const floatIn: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 60,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: 15,
    scale: 0.98,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

export const gentleBounce: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.9,
      type: 'spring',
      stiffness: 80,
      damping: 12,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

export const rippleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    rotate: -5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.7,
      type: 'spring',
      stiffness: 90,
      damping: 18,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotate: 2,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// STAGGER ANIMATIONS (for lists and multiple elements)
// =============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
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
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

// =============================================================================
// HOVER ANIMATIONS
// =============================================================================

export const gentleHover: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.3,
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const liftHover: Variants = {
  initial: {
    y: 0,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -2,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: 0.3,
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// =============================================================================
// MODAL/OVERLAY ANIMATIONS
// =============================================================================

export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 50,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      type: 'spring',
      stiffness: 120,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 25,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

// =============================================================================
// TRANSITION PRESETS
// =============================================================================

export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 80,
  damping: 20,
  mass: 1,
};

export const quickSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const slowSpring: Transition = {
  type: 'spring',
  stiffness: 50,
  damping: 25,
  mass: 1.2,
};

export const easeInOut: Transition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
};

export const gentleEase: Transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a custom stagger animation with configurable delay
 */
export const createStagger = (
  staggerDelay: number = 0.1,
  delayChildren: number = 0.2
): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    transition: {
      staggerChildren: staggerDelay * 0.5,
      staggerDirection: -1,
    },
  },
});

/**
 * Create a custom fade animation with configurable duration
 */
export const createFade = (
  duration: number = 0.6,
  easing: any = 'easeInOut'
): Variants => ({
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration,
      ease: easing,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: duration * 0.5,
      ease: easing,
    },
  },
});

/**
 * Create a custom slide animation from any direction
 */
export const createSlide = (
  direction: 'left' | 'right' | 'top' | 'bottom',
  distance: number = 60,
  duration: number = 0.7
): Variants => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
      case 'top':
        return { x: 0, y: -distance };
      case 'bottom':
        return { x: 0, y: distance };
    }
  };

  const getExitPosition = () => {
    const initial = getInitialPosition();
    return { x: initial.x * 0.5, y: initial.y * 0.5 };
  };

  return {
    initial: {
      opacity: 0,
      ...getInitialPosition(),
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        type: 'spring',
        stiffness: 80,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      ...getExitPosition(),
      transition: {
        duration: duration * 0.4,
        ease: 'easeInOut',
      },
    },
  };
};
