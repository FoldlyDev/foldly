'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Hook for managing Lenis smooth scrolling integration with GSAP ScrollTrigger
 * This hook provides a shared Lenis instance that can be used across different animations
 */
export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidScrollRef = useRef<number>(0);
  const scrollValidationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // GSAP plugins are registered by the orchestrator

    // Initialize Lenis with balanced settings
    const lenis = new Lenis({
      duration: 1.2, // Balanced duration
      easing: t => 1 - Math.pow(1 - t, 3), // Cubic ease-out for smooth deceleration
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1, // Back to default for normal scroll speed
      touchMultiplier: 2, // Back to default for responsive touch
      infinite: false,
      lerp: 0.12, // Slightly increased for more responsive interpolation
    });

    lenisRef.current = lenis;

    // Make Lenis globally accessible for debugging
    (window as any).lenis = lenis;

    // Throttled ScrollTrigger update to prevent excessive recalculations
    const throttledUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        ScrollTrigger.update();
      }, 16); // ~60fps throttle
    };

    // Scroll validation to detect and fix unexpected jumps
    const validateScroll = (e: any) => {
      const currentScroll = e.scroll || window.pageYOffset;
      const scrollDiff = Math.abs(currentScroll - lastValidScrollRef.current);
      
      // Detect unexpected large jumps (more than 1000px in a single frame)
      if (scrollDiff > 1000 && lastValidScrollRef.current > 0) {
        console.warn('[Lenis] Detected unexpected scroll jump:', {
          from: lastValidScrollRef.current,
          to: currentScroll,
          diff: scrollDiff
        });
        
        // Schedule a recovery check
        if (scrollValidationRef.current) {
          clearTimeout(scrollValidationRef.current);
        }
        scrollValidationRef.current = setTimeout(() => {
          // If still in an invalid position, smoothly return to last valid position
          const recoveryScroll = window.pageYOffset;
          if (Math.abs(recoveryScroll - lastValidScrollRef.current) > 1000) {
            lenis.scrollTo(lastValidScrollRef.current, {
              duration: 0.5,
              easing: t => t,
            });
          }
        }, 100);
      } else {
        // Update last valid scroll position
        lastValidScrollRef.current = currentScroll;
      }
      
      // Call the throttled update
      throttledUpdate();
    };

    // Update ScrollTrigger on scroll with validation and throttling
    lenis.on('scroll', validateScroll);

    // GSAP ticker integration for smooth animation
    gsap.ticker.add(time => {
      lenis.raf(time * 1000);
    });

    // Disable lag smoothing for consistent performance
    gsap.ticker.lagSmoothing(0);

    // No need to refresh ScrollTrigger - the template doesn't do this

    // Start Lenis
    lenis.start();

    // Cleanup function
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (scrollValidationRef.current) {
        clearTimeout(scrollValidationRef.current);
      }
      lenis.destroy();
      gsap.ticker.remove(time => {
        lenis.raf(time * 1000);
      });
      lenisRef.current = null;
    };
  }, []);

  return lenisRef.current;
}

/**
 * Utility function for creating smooth step easing
 * Commonly used in scroll-based animations
 */
export const smoothStep = (p: number) => p * p * (3 - 2 * p);
