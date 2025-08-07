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

    console.log('🚀 Lenis initialization started');
    let isMobile = window.innerWidth <= 900;
    console.log('📱 Is mobile:', isMobile, 'Window width:', window.innerWidth);

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
          syncTouch: false, // Disable syncTouch for better trackpad compatibility
          autoRaf: true, // Ensure RAF is handled automatically
        }
      : {
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          direction: 'vertical' as const,
          gestureDirection: 'vertical' as const,
          smooth: true,
          smoothTouch: true, // Enable for trackpad support
          touchMultiplier: 1, // Reduce for better trackpad feel
          infinite: false,
          lerp: 0.1,
          wheelMultiplier: 1,
          orientation: 'vertical' as const,
          smoothWheel: true,
          syncTouch: false, // Disable syncTouch for Mac trackpad compatibility
          autoRaf: true, // Ensure RAF is handled automatically
        };

    lenisRef.current = new Lenis(scrollSettings);
    console.log('✅ Lenis instance created:', lenisRef.current);
    console.log('🔧 Settings applied:', scrollSettings);

    lenisRef.current.on('scroll', ScrollTrigger.update);
    
    lenisRef.current.on('scroll', (e: any) => {
      console.log('📜 Scroll event:', e.scroll, 'velocity:', e.velocity);
    });

    // RAF is handled automatically with autoRaf: true
    // No manual ticker needed

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
              syncTouch: false, // Disable syncTouch for better trackpad compatibility
              autoRaf: true,
            }
          : {
              duration: 1.2,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
              direction: 'vertical' as const,
              gestureDirection: 'vertical' as const,
              smooth: true,
              smoothTouch: true, // Enable for trackpad support
              touchMultiplier: 1, // Reduce for better trackpad feel
              infinite: false,
              lerp: 0.1,
              wheelMultiplier: 1,
              orientation: 'vertical' as const,
              smoothWheel: true,
              syncTouch: false, // Disable syncTouch for Mac trackpad compatibility
              autoRaf: true,
            };

        lenisRef.current = new Lenis(newScrollSettings);
        lenisRef.current.on('scroll', ScrollTrigger.update);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      lenisRef.current?.destroy();
      window.removeEventListener('resize', handleResize);
      // No manual ticker cleanup needed with autoRaf
    };
  }, []);

  return lenisRef.current;
}