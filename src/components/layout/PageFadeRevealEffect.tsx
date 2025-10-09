"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface FadeTransitionWrapperProps {
  isLoading: boolean;
  loadingComponent: React.ReactNode;
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

/**
 * FadeTransitionWrapper handles smooth fade-out transitions when content loads.
 * It ensures skeleton loaders fade out gracefully instead of disappearing abruptly.
 */
export function FadeTransitionWrapper({
  isLoading,
  loadingComponent,
  children,
  duration = 300,
  className,
}: FadeTransitionWrapperProps) {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Immediately show skeleton when loading starts
      setShowSkeleton(true);
      setIsTransitioning(false);
    } else if (showSkeleton) {
      // Start transition when loading completes
      setIsTransitioning(true);

      // Remove skeleton after transition completes
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setIsTransitioning(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, showSkeleton, duration]);

  return (
    <div className={cn("relative", className)}>
      {/* Skeleton Layer */}
      {showSkeleton && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: "ease-out",
          }}
        >
          {loadingComponent}
        </div>
      )}

      {/* Content Layer */}
      {!isLoading && (
        <div
          className={cn(
            "transition-opacity",
            showSkeleton ? "opacity-0" : "opacity-100"
          )}
          style={{
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: "ease-in",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing fade transition state
 */
export function useFadeTransition(isLoading: boolean, duration = 300) {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowSkeleton(true);
      setIsTransitioning(false);
    } else if (showSkeleton) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setIsTransitioning(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isLoading, showSkeleton, duration]);

  return {
    showSkeleton,
    isTransitioning,
    fadeStyles: {
      opacity: isTransitioning ? 0 : 1,
      transition: `opacity ${duration}ms ease-out`,
    },
  };
}
