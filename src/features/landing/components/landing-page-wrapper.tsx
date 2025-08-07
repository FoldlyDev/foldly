'use client';

import { useEffect } from 'react';
import { useSmoothScroll } from '../hooks/use-smooth-scroll';

interface LandingPageWrapperProps {
  children: React.ReactNode;
}

export function LandingPageWrapper({ children }: LandingPageWrapperProps) {
  // Check for low-end devices to conditionally apply smooth scroll
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPerformance = () => {
      const isLowEnd = 
        window.innerWidth <= 1200 || 
        navigator.hardwareConcurrency <= 4 ||
        (navigator as any).deviceMemory <= 4;

      if (isLowEnd) {
        document.documentElement.classList.add('reduce-motion');
      }
    };

    checkPerformance();
  }, []);

  // Apply buttery smooth scrolling only on higher-end devices
  const isLowEnd = typeof window !== 'undefined' && (
    window.innerWidth <= 1200 || 
    navigator.hardwareConcurrency <= 4 ||
    (navigator as any).deviceMemory <= 4
  );

  // Initialize buttery smooth scrolling with custom settings
  useSmoothScroll({
    lerp: isLowEnd ? 0.1 : 0.08, // More aggressive smoothing for high-end devices
    wheelMultiplier: 0.8, // Reduce sensitivity for buttery feel
    touchMultiplier: 1.2, // Good touch sensitivity
    minSpeed: 0.1, // Very smooth stopping
  });

  return (
    <div className="landing-page" style={{ touchAction: 'auto' }}>
      {children}
    </div>
  );
}