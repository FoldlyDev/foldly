'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseScrollPositionOptions {
  threshold?: number;
  throttleMs?: number;
}

/**
 * Custom hook that tracks scroll position and returns whether user has scrolled past a threshold
 * Optimized for performance with requestAnimationFrame and throttling
 */
export function useScrollPosition({
  threshold = 10,
  throttleMs = 16,
}: UseScrollPositionOptions = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const updateScrollPosition = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsScrolled(currentScrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    let ticking = false;
    let lastTime = 0;

    const handleScroll = () => {
      const now = Date.now();

      // Throttle for performance
      if (now - lastTime < throttleMs) {
        return;
      }

      lastTime = now;

      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Set initial position
    updateScrollPosition();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [updateScrollPosition, throttleMs]);

  return {
    isScrolled,
    scrollY,
  };
}
