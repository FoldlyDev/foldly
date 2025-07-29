'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/config/performance';

/**
 * Client-side Performance Monitor Component
 * Initializes performance tracking on the client side
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring when component mounts
    initializePerformanceMonitoring();
  }, []);

  // This component doesn't render anything
  return null;
}
