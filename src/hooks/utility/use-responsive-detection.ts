'use client';

import { useState, useEffect } from 'react';

/**
 * Responsive state interface
 */
export interface ResponsiveState {
  /** True if viewport width < 1024px */
  isMobile: boolean;
  /** True if viewport width >= 1024px */
  isDesktop: boolean;
  /** True if device supports touch events */
  isTouch: boolean;
}

/**
 * Mobile breakpoint (matches existing UserWorkspace/FolderBreadcrumb pattern)
 * Using 1024px to align with current implementation
 */
const MOBILE_BREAKPOINT = 1024;

/**
 * Hook for detecting responsive breakpoints and touch capability
 *
 * Extracts and centralizes screen detection logic from UserWorkspace and FolderBreadcrumb
 * to eliminate duplication and provide reusable platform detection.
 *
 * Features:
 * - Mobile vs desktop detection (1024px breakpoint)
 * - Touch capability detection
 * - Debounced resize listener for performance
 * - Proper cleanup on unmount
 *
 * @returns Responsive state object
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isMobile, isDesktop, isTouch } = useResponsiveDetection();
 *
 *   return (
 *     <div>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *       {isTouch && <TouchOptimizedUI />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useResponsiveDetection(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isDesktop: true,
    isTouch: false,
  });

  useEffect(() => {
    // Update responsive state
    const updateState = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const isMobile = width < MOBILE_BREAKPOINT;

      setState({
        isMobile,
        isDesktop: !isMobile,
        isTouch: typeof window !== 'undefined' && 'ontouchstart' in window,
      });
    };

    // Initial check
    updateState();

    // Debounce resize events for performance
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150);
    };

    window.addEventListener('resize', debouncedUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedUpdate);
    };
  }, []);

  return state;
}
