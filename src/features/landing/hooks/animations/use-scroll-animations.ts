'use client';

import { useCallback } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGsapAnimation, useScrollAnimation } from './use-gsap-animations';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface PinAnimationOptions {
  start?: string;
  end?: string | number;
  scrub?: boolean | number;
  pin?: boolean;
  pinSpacing?: boolean;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface ParallaxOptions {
  speed?: number;
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

/**
 * Hook for scroll-triggered animations with refs
 */
export function useScrollAnimations() {
  const { animateRef, setRef } = useGsapAnimation();
  const { createScrollTrigger } = useScrollAnimation();

  /**
   * Create a pinned scroll animation
   */
  const createPinnedAnimation = useCallback(
    <T extends HTMLElement>(
      containerRef: RefObject<T>,
      options: PinAnimationOptions = {}
    ) => {
      if (!containerRef.current) return null;

      const {
        start = 'top top',
        end = `+=${window.innerHeight * 4}px`,
        scrub = 1,
        pin = true,
        pinSpacing = true,
        onUpdate,
        onComplete,
      } = options;

      const scrollTriggerVars: ScrollTrigger.Vars = {
        trigger: containerRef.current,
        start,
        end,
        scrub,
        pin,
        pinSpacing,
        onUpdate: (self) => {
          if (onUpdate) {
            onUpdate(self.progress);
          }
        },
      };

      // Add onComplete if provided
      if (onComplete) {
        scrollTriggerVars.onToggle = (self) => {
          if (self.progress === 1 && self.isActive) {
            onComplete();
          }
        };
      }

      return createScrollTrigger(scrollTriggerVars);
    },
    [createScrollTrigger]
  );

  /**
   * Create a parallax effect
   */
  const createParallaxEffect = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: ParallaxOptions = {}
    ) => {
      if (!elementRef.current) return null;

      const {
        speed = 0.5,
        start = 'top bottom',
        end = 'bottom top',
        scrub = true,
      } = options;

      const moveDistance = 100 * speed;

      setRef(elementRef, { y: -moveDistance });

      return animateRef(elementRef, {
        y: moveDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: elementRef.current,
          start,
          end,
          scrub,
        },
      });
    },
    [animateRef, setRef]
  );

  /**
   * Create a fade-in animation on scroll
   */
  const createScrollFadeIn = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: {
        start?: string;
        duration?: number;
        delay?: number;
        y?: number;
      } = {}
    ) => {
      if (!elementRef.current) return null;

      const {
        start = 'top 80%',
        duration = 1,
        delay = 0,
        y = 50,
      } = options;

      setRef(elementRef, { opacity: 0, y });

      return animateRef(elementRef, {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: elementRef.current,
          start,
          toggleActions: 'play none none reverse',
        },
      });
    },
    [animateRef, setRef]
  );

  /**
   * Create a scale animation on scroll
   */
  const createScrollScale = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: {
        start?: string;
        end?: string;
        startScale?: number;
        endScale?: number;
        scrub?: boolean | number;
      } = {}
    ) => {
      if (!elementRef.current) return null;

      const {
        start = 'top bottom',
        end = 'bottom top',
        startScale = 0.8,
        endScale = 1.2,
        scrub = true,
      } = options;

      setRef(elementRef, { scale: startScale });

      return animateRef(elementRef, {
        scale: endScale,
        ease: 'none',
        scrollTrigger: {
          trigger: elementRef.current,
          start,
          end,
          scrub,
        },
      });
    },
    [animateRef, setRef]
  );

  /**
   * Create a custom scroll-triggered animation
   */
  const createCustomScrollAnimation = useCallback(
    <T extends HTMLElement>(
      triggerRef: RefObject<T>,
      animationCallback: (progress: number) => void,
      options: {
        start?: string;
        end?: string;
        scrub?: boolean | number;
        pin?: boolean;
        pinSpacing?: boolean;
      } = {}
    ) => {
      if (!triggerRef.current) return null;

      const {
        start = 'top top',
        end = 'bottom top',
        scrub = 1,
        pin = false,
        pinSpacing = true,
      } = options;

      return createScrollTrigger({
        trigger: triggerRef.current,
        start,
        end,
        scrub,
        pin,
        pinSpacing,
        onUpdate: (self) => {
          animationCallback(self.progress);
        },
      });
    },
    [createScrollTrigger]
  );

  return {
    createPinnedAnimation,
    createParallaxEffect,
    createScrollFadeIn,
    createScrollScale,
    createCustomScrollAnimation,
  };
}