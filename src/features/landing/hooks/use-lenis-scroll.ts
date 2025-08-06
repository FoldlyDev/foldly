'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useLenisScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMobile = window.innerWidth <= 900;

    const scrollSettings = isMobile
      ? {
          duration: 0.8,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

    lenisRef.current = new Lenis(scrollSettings);

    lenisRef.current.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenisRef.current?.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    const handleResize = () => {
      const wasMobile = isMobile;
      isMobile = window.innerWidth <= 900;

      if (wasMobile !== isMobile && lenisRef.current) {
        lenisRef.current.destroy();

        const newScrollSettings = isMobile
          ? {
              duration: 1,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

        lenisRef.current = new Lenis(newScrollSettings);
        lenisRef.current.on('scroll', ScrollTrigger.update);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      lenisRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
      gsap.ticker.remove((time) => {
        lenisRef.current?.raf(time * 1000);
      });
    };
  }, []);

  return lenisRef.current;
}