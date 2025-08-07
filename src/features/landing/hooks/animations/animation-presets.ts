'use client';

import gsap from 'gsap';

/**
 * Common easing functions
 */
export const EASINGS = {
  // Power easings
  power1Out: 'power1.out',
  power2Out: 'power2.out',
  power3Out: 'power3.out',
  power4Out: 'power4.out',
  power1In: 'power1.in',
  power2In: 'power2.in',
  power3In: 'power3.in',
  power4In: 'power4.in',
  power1InOut: 'power1.inOut',
  power2InOut: 'power2.inOut',
  power3InOut: 'power3.inOut',
  power4InOut: 'power4.inOut',
  // Expo easings
  expoOut: 'expo.out',
  expoIn: 'expo.in',
  expoInOut: 'expo.inOut',
  // Circ easings
  circOut: 'circ.out',
  circIn: 'circ.in',
  circInOut: 'circ.inOut',
  // Back easings
  backOut: 'back.out(1.7)',
  backIn: 'back.in(1.7)',
  backInOut: 'back.inOut(1.7)',
  // Elastic easings
  elasticOut: 'elastic.out(1, 0.3)',
  elasticIn: 'elastic.in(1, 0.3)',
  elasticInOut: 'elastic.inOut(1, 0.3)',
  // Custom step easing (juno_watts style)
  smoothStep: 'steps(12)',
  // Linear
  none: 'none',
} as const;

/**
 * Common animation durations
 */
export const DURATIONS = {
  instant: 0,
  fast: 0.3,
  normal: 0.5,
  medium: 0.75,
  slow: 1,
  verySlow: 1.5,
  extraSlow: 2,
} as const;

/**
 * Common stagger values
 */
export const STAGGERS = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
  verySlow: 0.2,
  // Stagger objects
  grid: {
    each: 0.1,
    from: 'center',
    grid: 'auto',
  },
  fromStart: {
    each: 0.1,
    from: 'start',
  },
  fromEnd: {
    each: 0.1,
    from: 'end',
  },
  fromCenter: {
    each: 0.1,
    from: 'center',
  },
  fromRandom: {
    each: 0.1,
    from: 'random',
  },
} as const;

/**
 * Smooth step function for custom progress calculations
 */
export const smoothStep = (progress: number): number => {
  return progress * progress * (3 - 2 * progress);
};

/**
 * Enhanced smooth step with custom curve
 */
export const smootherStep = (progress: number): number => {
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
};

/**
 * Exponential ease out function
 */
export const exponentialOut = (progress: number): number => {
  return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
};

/**
 * Animation presets for common patterns
 */
export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn: {
    opacity: 0,
    duration: DURATIONS.normal,
    ease: EASINGS.power2Out,
  },
  fadeOut: {
    opacity: 1,
    duration: DURATIONS.normal,
    ease: EASINGS.power2In,
  },
  
  // Slide animations
  slideInLeft: {
    x: '-100%',
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power3Out,
  },
  slideInRight: {
    x: '100%',
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power3Out,
  },
  slideInUp: {
    y: '100%',
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power3Out,
  },
  slideInDown: {
    y: '-100%',
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power3Out,
  },
  
  // Scale animations
  scaleIn: {
    scale: 0,
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.backOut,
  },
  scaleOut: {
    scale: 1.5,
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power2In,
  },
  
  // Rotate animations
  rotateIn: {
    rotation: -180,
    opacity: 0,
    duration: DURATIONS.medium,
    ease: EASINGS.power3Out,
  },
  flipIn: {
    rotationY: -180,
    opacity: 0,
    duration: DURATIONS.slow,
    ease: EASINGS.power3Out,
  },
  
  // Hero card animation
  heroCard: {
    scale: 0,
    transformOrigin: 'center center',
    duration: DURATIONS.medium,
    ease: EASINGS.power4Out,
  },
  
  // Menu overlay
  menuOverlay: {
    scaleY: 0,
    transformOrigin: 'top center',
    duration: DURATIONS.normal,
    ease: EASINGS.power3Out,
  },
  
  // Text animations
  textReveal: {
    yPercent: 120,
    duration: DURATIONS.medium,
    ease: EASINGS.power4Out,
  },
  
  // Card flip
  cardFlip: {
    rotationY: 0,
    duration: DURATIONS.slow,
    ease: EASINGS.power2InOut,
  },
} as const;

/**
 * ScrollTrigger presets
 */
export const SCROLL_TRIGGER_PRESETS = {
  fadeIn: {
    start: 'top 80%',
    toggleActions: 'play none none reverse',
  },
  parallax: {
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
  pin: {
    start: 'top top',
    pin: true,
    pinSpacing: true,
    scrub: 1,
  },
  reveal: {
    start: 'top 70%',
    end: 'bottom 30%',
    toggleActions: 'play none none reverse',
  },
} as const;

/**
 * Get interpolated value based on progress
 */
export const interpolate = (
  start: number | string,
  end: number | string,
  progress: number
): number | string => {
  return gsap.utils.interpolate(start, end, progress);
};

/**
 * Type-safe interpolation for strings
 */
export const interpolateString = (
  start: string,
  end: string,
  progress: number
): string => {
  return gsap.utils.interpolate(start, end, progress) as string;
};

/**
 * Type-safe interpolation for numbers
 */
export const interpolateNumber = (
  start: number,
  end: number,
  progress: number
): number => {
  return gsap.utils.interpolate(start, end, progress) as number;
};

/**
 * Clamp value between min and max
 */
export const clamp = (min: number, max: number, value: number): number => {
  return gsap.utils.clamp(min, max, value);
};

/**
 * Map range utility
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return gsap.utils.mapRange(inMin, inMax, outMin, outMax, value);
};

/**
 * Normalize value between 0 and 1
 */
export const normalize = (value: number, min: number, max: number): number => {
  return gsap.utils.normalize(min, max, value);
};