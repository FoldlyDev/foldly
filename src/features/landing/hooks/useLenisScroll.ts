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

    // GSAP plugins are registered by the orchestrator

    // Configure ScrollTrigger for better Lenis integration
    ScrollTrigger.normalizeScroll(false); // Disable normalize scroll as Lenis handles it
    ScrollTrigger.config({
      ignoreMobileResize: true, // Prevent issues on mobile
    });

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
      lerp: 0.1, // Slightly reduced for more stability with pinned elements
      syncTouch: true, // Better touch device support
    });

    lenisRef.current = lenis;

    // Make Lenis globally accessible for debugging
    (window as any).lenis = lenis;

    // Simple ScrollTrigger update on scroll - more stable than ticker integration
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Use requestAnimationFrame for Lenis updates instead of GSAP ticker
    function raf(time: number) {
      lenis.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    }
    rafIdRef.current = requestAnimationFrame(raf);

    // No need to refresh ScrollTrigger - the template doesn't do this

    // Start Lenis
    lenis.start();

    // Cleanup function
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      lenis.destroy();
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
