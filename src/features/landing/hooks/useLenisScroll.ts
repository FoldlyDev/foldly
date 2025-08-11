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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

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

    // Update ScrollTrigger on scroll
    lenis.on('scroll', ScrollTrigger.update);

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
