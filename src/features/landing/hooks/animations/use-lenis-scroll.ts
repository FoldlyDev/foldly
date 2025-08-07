'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface LenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  direction?: 'vertical' | 'horizontal';
  gestureDirection?: 'vertical' | 'horizontal' | 'both';
  smooth?: boolean;
  smoothTouch?: boolean;
  touchMultiplier?: number;
  infinite?: boolean;
  autoResize?: boolean;
}

/**
 * Hook to integrate Lenis smooth scrolling with GSAP ScrollTrigger
 * Provides buttery smooth scrolling with proper performance optimization
 */
export function useLenisScroll(options?: LenisOptions) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Allow disabling Lenis via URL parameter for debugging
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('noLenis') === 'true') {
      console.log('Lenis disabled via URL parameter');
      return;
    }

    // Skip Lenis on mobile for better performance
    const isMobile = window.innerWidth <= 900;
    if (isMobile) return;

    // Ensure body has proper touch settings
    document.body.style.touchAction = 'auto';
    document.documentElement.style.touchAction = 'auto';

    // Initialize Lenis with exact template settings
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.1, // Linear interpolation - critical for smooth scrolling
      wheelMultiplier: 1,
      orientation: 'vertical', // Explicit orientation
      smoothWheel: true, // Enable smooth wheel scrolling
      syncTouch: true, // Synchronize touch events
      autoResize: true,
      ...options,
    });

    // Sync Lenis with GSAP ScrollTrigger
    lenisRef.current.on('scroll', ScrollTrigger.update);

    // Add Lenis to GSAP ticker (single RAF loop)
    const lenisUpdate = (time: number) => {
      if (lenisRef.current) {
        lenisRef.current.raf(time * 1000);
      }
    };
    
    gsap.ticker.add(lenisUpdate);

    // Disable lag smoothing for better performance
    gsap.ticker.lagSmoothing(0);

    // Update ScrollTrigger on resize
    const handleResize = () => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
      ScrollTrigger.refresh();
    };

    window.addEventListener('resize', handleResize);

    // Handle anchor links
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement;
      
      if (anchor && lenisRef.current) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        if (targetId && targetId !== '#') {
          const targetElement = document.querySelector(targetId) as HTMLElement;
          if (targetElement) {
            lenisRef.current.scrollTo(targetElement, {
              offset: -100,
              duration: 1.5,
              easing: (t) => 1 - Math.pow(1 - t, 4),
            });
          }
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);

    return () => {
      // Cleanup
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      gsap.ticker.remove(lenisUpdate);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [options]);

  return lenisRef.current;
}

/**
 * Utility to scroll to a specific element or position
 */
export function scrollTo(
  target: string | number | HTMLElement,
  options?: {
    offset?: number;
    duration?: number;
    easing?: (t: number) => number;
    immediate?: boolean;
  }
) {
  const lenis = (window as any).lenis as Lenis | undefined;
  if (!lenis) return;

  lenis.scrollTo(target, {
    offset: options?.offset ?? 0,
    duration: options?.duration ?? 1.2,
    easing: options?.easing ?? ((t) => 1 - Math.pow(1 - t, 4)),
    immediate: options?.immediate ?? false,
  });
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).scrollTo = scrollTo;
}