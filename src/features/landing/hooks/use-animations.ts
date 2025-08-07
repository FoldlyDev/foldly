'use client';

import { useEffect } from 'react';
import { initAnimations } from '../lib/animations';

// Re-export all animation hooks from the centralized system
export * from './animations';

/**
 * Hook to initialize data-attribute based animations
 * Uses the new centralized animation system
 */
export function useAnimatedElement() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize animations when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
      // Wait for fonts to load
      document.fonts.ready.then(initAnimations);
    }

    return () => {
      // Cleanup handled by individual animation hooks
    };
  }, []);

  return { initAnimations };
}