/**
 * Performance Monitoring Configuration
 * Complementary to Vercel Speed Insights for comprehensive performance tracking
 */

import React from "react";

// Core Web Vitals metrics configuration
export const PERFORMANCE_METRICS = {
  // Largest Contentful Paint - Good: < 2.5s
  LCP_THRESHOLD: 2500,
  // First Input Delay - Good: < 100ms
  FID_THRESHOLD: 100,
  // Cumulative Layout Shift - Good: < 0.1
  CLS_THRESHOLD: 0.1,
  // First Contentful Paint - Good: < 1.8s
  FCP_THRESHOLD: 1800,
  // Time to Interactive - Good: < 3.8s
  TTI_THRESHOLD: 3800,
} as const;

// Performance observer for Core Web Vitals
export function initializePerformanceMonitoring() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "production") {
    return;
  }

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const lcp = entry.startTime;
      console.log(
        "🎯 LCP:",
        lcp,
        "ms",
        lcp < PERFORMANCE_METRICS.LCP_THRESHOLD ? "✅" : "⚠️"
      );
    }
  });
  lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

  // First Input Delay
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as any;
      const fid = fidEntry.processingStart - fidEntry.startTime;
      console.log(
        "🎯 FID:",
        fid,
        "ms",
        fid < PERFORMANCE_METRICS.FID_THRESHOLD ? "✅" : "⚠️"
      );
    }
  });
  fidObserver.observe({ type: "first-input", buffered: true });

  // Cumulative Layout Shift
  const clsObserver = new PerformanceObserver((list) => {
    let cls = 0;
    for (const entry of list.getEntries()) {
      const clsEntry = entry as any;
      if (!clsEntry.hadRecentInput) {
        cls += clsEntry.value;
      }
    }
    console.log(
      "🎯 CLS:",
      cls,
      cls < PERFORMANCE_METRICS.CLS_THRESHOLD ? "✅" : "⚠️"
    );
  });
  clsObserver.observe({ type: "layout-shift", buffered: true });

  // First Contentful Paint
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === "first-contentful-paint") {
        const fcp = entry.startTime;
        console.log(
          "🎯 FCP:",
          fcp,
          "ms",
          fcp < PERFORMANCE_METRICS.FCP_THRESHOLD ? "✅" : "⚠️"
        );
      }
    }
  });
  fcpObserver.observe({ type: "paint", buffered: true });
}

// Performance utility functions
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName: string) => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production"
    ) {
      return { start: () => {}, end: () => {} };
    }

    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    const measureName = `${componentName}-render-time`;

    return {
      start: () => performance.mark(startMark),
      end: () => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        const measure = performance.getEntriesByName(measureName)[0];
        if (measure) {
          console.log(
            `🎯 ${componentName} render time:`,
            measure.duration,
            "ms"
          );
        }

        // Clean up marks
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(measureName);
      },
    };
  },

  // Measure API call performance
  measureApiCall: async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production"
    ) {
      return apiCall();
    }

    const startTime = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      console.log(`🎯 API ${apiName}:`, duration, "ms");
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.log(`🎯 API ${apiName} (failed):`, duration, "ms");
      throw error;
    }
  },

  // Log navigation timing
  logNavigationTiming: () => {
    if (
      typeof window === "undefined" ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    window.addEventListener("load", () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      console.log("🎯 Navigation Timing:", {
        "DNS Lookup": navigation.domainLookupEnd - navigation.domainLookupStart,
        "TCP Connect": navigation.connectEnd - navigation.connectStart,
        "TLS Setup": navigation.connectEnd - navigation.secureConnectionStart,
        Request: navigation.responseStart - navigation.requestStart,
        Response: navigation.responseEnd - navigation.responseStart,
        "DOM Processing":
          navigation.domComplete - navigation.domContentLoadedEventStart,
        "Total Load Time": navigation.loadEventEnd - navigation.fetchStart,
      });
    });
  },

  // Memory usage monitoring
  logMemoryUsage: () => {
    if (
      typeof window === "undefined" ||
      !("memory" in performance) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }

    const memory = (performance as any).memory;
    console.log("🎯 Memory Usage:", {
      "Used JS Heap": `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      "Total JS Heap": `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      "JS Heap Limit": `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
    });
  },
};

// React component performance wrapper
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    if (process.env.NODE_ENV === "production") {
      const measure = performanceUtils.measureRender(componentName);
      measure.start();

      React.useEffect(() => {
        measure.end();
      });
    }

    return React.createElement(WrappedComponent, props);
  };
}
