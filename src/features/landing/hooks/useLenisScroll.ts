'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

/**
 * Hook for managing Lenis smooth scrolling integration with GSAP ScrollTrigger
 * Based on Juno Watts template implementation for optimal performance
 */
export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const isMobileRef = useRef(false);
  const rafIdRef = useRef<gsap.TickerCallback | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitializedRef.current) return; // Prevent re-initialization

    // GSAP plugins are registered by the orchestrator

    let isMobile = window.innerWidth <= 900;
    isMobileRef.current = isMobile;

    // Match template's easing function for better performance
    const easingFunction = (t: number) =>
      Math.min(1, 1.001 - Math.pow(2, -10 * t));

    // Device-specific settings matching the template
    const scrollSettings = isMobile
      ? {
          duration: 0.8,
          easing: easingFunction,
          direction: 'vertical' as const,
          gestureDirection: 'vertical' as const,
          smooth: true,
          smoothTouch: true,
          touchMultiplier: 1.5,
          infinite: false,
          lerp: 0.09,
          wheelMultiplier: 1,
          orientation: 'vertical' as const,
          smoothWheel: true,
          syncTouch: true,
        }
      : {
          duration: 1.2,
          easing: easingFunction,
          direction: 'vertical' as const,
          gestureDirection: 'vertical' as const,
          smooth: true,
          smoothTouch: false,
          touchMultiplier: 2,
          infinite: false,
          lerp: 0.1,
          wheelMultiplier: 1,
          orientation: 'vertical' as const,
          smoothWheel: true,
          syncTouch: true,
        };

    // Initialize Lenis with appropriate settings
    let lenis = new Lenis(scrollSettings);
    lenisRef.current = lenis;
    
    // Make Lenis available globally for other components
    (window as any).lenis = lenis;

    // Synchronize with ScrollTrigger (matching template pattern)
    lenis.on('scroll', ScrollTrigger.update);

    // Add to GSAP ticker
    const lenisRaf = (time: number) => {
      lenis.raf(time * 1000);
      ScrollTrigger.update();
    };
    rafIdRef.current = gsap.ticker.add(lenisRaf);

    // Match template's lag smoothing setting
    gsap.ticker.lagSmoothing(0);

    // Mark as initialized
    isInitializedRef.current = true;

    // Handle resize events to recreate Lenis with appropriate settings
    const handleResize = () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 900;
      isMobileRef.current = isMobile;

      if (wasMobile !== isMobile) {
        // Destroy current instance
        lenis.destroy();

        // Create new instance with updated settings
        const newScrollSettings = isMobile
          ? {
              duration: 1,
              easing: easingFunction,
              direction: 'vertical' as const,
              gestureDirection: 'vertical' as const,
              smooth: true,
              smoothTouch: true,
              touchMultiplier: 1.5,
              infinite: false,
              lerp: 0.05,
              wheelMultiplier: 1,
              orientation: 'vertical' as const,
              smoothWheel: true,
              syncTouch: true,
            }
          : {
              duration: 1.2,
              easing: easingFunction,
              direction: 'vertical' as const,
              gestureDirection: 'vertical' as const,
              smooth: true,
              smoothTouch: false,
              touchMultiplier: 2,
              infinite: false,
              lerp: 0.1,
              wheelMultiplier: 1,
              orientation: 'vertical' as const,
              smoothWheel: true,
              syncTouch: true,
            };

        lenis = new Lenis(newScrollSettings);
        lenisRef.current = lenis;
        (window as any).lenis = lenis;
        lenis.on('scroll', ScrollTrigger.update);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      gsap.ticker.remove(lenisRaf);
      lenis.destroy();
      lenisRef.current = null;
      (window as any).lenis = null;
      isInitializedRef.current = false;
    };
  }, []); // Empty dependency array ensures this only runs once

  return lenisRef.current;
}

/**
 * Utility function for creating smooth step easing
 * Commonly used in scroll-based animations
 */
export const smoothStep = (p: number) => p * p * (3 - 2 * p);
