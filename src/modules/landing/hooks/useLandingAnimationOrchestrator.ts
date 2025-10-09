"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";
import { useGSAP } from "@gsap/react";

// Extend Navigator interface for Network Information API
declare global {
  interface Navigator {
    deviceMemory?: number;
    connection?: {
      effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
  }
}

export interface AnimationState {
  isHydrated: boolean;
  introReady: boolean;
  aboutReady: boolean;
  featureHighlightReady: boolean;
  demoReady: boolean;
  isAnimating: boolean;
  hasError: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  isLowEndDevice: boolean;
}

export interface AnimationOrchestratorProps {
  isReady: boolean;
  onHydrationComplete?: () => void;
  onIntroReady?: () => void;
  onAboutReady?: () => void;
  onFeatureHighlightReady?: () => void;
  onDemoReady?: () => void;
  onAnimationError?: (error: Error) => void;
}

/**
 * Centralized animation orchestrator for the landing page
 * Single source of truth for all animation states and timing
 */
export function useLandingAnimationOrchestrator(
  props: AnimationOrchestratorProps
) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isHydrated: false,
    introReady: false,
    aboutReady: false,
    featureHighlightReady: false,
    demoReady: false,
    isAnimating: false,
    hasError: false,
    prefersReducedMotion: false,
    isMobile: false,
    isLowEndDevice: false,
  });

  const propsRef = useRef(props);
  const gsapInitialized = useRef(false);
  const activeScrollTriggers = useRef<Set<any>>(new Set()); // ScrollTrigger type issues with Set
  const cleanupFunctions = useRef<(() => void)[]>([]);

  // Update props ref when they change
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  // Initialize GSAP plugins once and handle reduced motion
  useEffect(() => {
    if (gsapInitialized.current) return;

    try {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // Check if mobile device
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth < 768;

      // Check for low-end device indicators
      const isLowEndDevice =
        (typeof navigator !== "undefined" && navigator.hardwareConcurrency
          ? navigator.hardwareConcurrency <= 4
          : false) || // Low CPU cores
        (typeof navigator !== "undefined" && navigator.deviceMemory
          ? navigator.deviceMemory <= 4
          : false) || // Low RAM (in GB)
        (typeof navigator !== "undefined" && navigator.connection
          ? navigator.connection.effectiveType === "slow-2g" ||
            navigator.connection.effectiveType === "2g" ||
            navigator.connection.effectiveType === "3g"
          : false);

      setAnimationState((prev) => ({
        ...prev,
        prefersReducedMotion,
        isMobile,
        isLowEndDevice,
      }));

      if (!prefersReducedMotion && !isLowEndDevice) {
        // Ensure GSAP is properly initialized before registering plugins
        if (typeof gsap !== "undefined" && gsap.registerPlugin) {
          try {
            // Register all required plugins once
            gsap.registerPlugin(ScrollTrigger, SplitText, TextPlugin, useGSAP);

            // Configure GSAP for optimal performance
            gsap.config({
              nullTargetWarn: false,
              force3D: true,
              autoSleep: 60, // Auto-sleep after 60 ticks of inactivity
            });

            // Set consistent FPS for all devices
            gsap.ticker.fps(120); // Allow up to 120 FPS for devices that support it
            // Note: lagSmoothing is set to 0 in useLenisScroll hook to prevent scrollbar jumping
          } catch (pluginError) {
            console.error(
              "[Orchestrator] Failed to register GSAP plugins:",
              pluginError
            );
            // Continue without animations if plugin registration fails
          }
        }
      }

      gsapInitialized.current = true;
    } catch (error) {
      console.error("[Orchestrator] Failed to initialize GSAP:", error);
      setAnimationState((prev) => ({ ...prev, hasError: true }));
      propsRef.current?.onAnimationError?.(error as Error);
    }
  }, []);

  // Stage 1: Handle hydration - wait for parent component's isReady
  useEffect(() => {
    if (!props.isReady) return;

    // Ensure we're at a stable scroll position before starting animations
    const checkScrollStability = () => {
      const currentScroll = window.pageYOffset || window.scrollY;

      // Small delay to ensure scroll position is stable
      setTimeout(() => {
        const newScroll = window.pageYOffset || window.scrollY;
        if (Math.abs(currentScroll - newScroll) < 1) {
          // Scroll is stable, proceed with hydration
          setAnimationState((prev) => ({ ...prev, isHydrated: true }));
          propsRef.current?.onHydrationComplete?.();
          console.log(
            "[Orchestrator] Hydration complete at stable scroll position:",
            newScroll
          );
        } else {
          // Scroll is still changing, check again
          checkScrollStability();
        }
      }, 50);
    };

    checkScrollStability();
  }, [props.isReady]);

  // Stage 2: Enable intro animation after hydration
  useEffect(() => {
    if (!animationState.isHydrated) return;

    let introTimer: NodeJS.Timeout;

    // Wait for DOM to be fully ready
    requestAnimationFrame(() => {
      // Give intro animation time to initialize
      introTimer = setTimeout(() => {
        setAnimationState((prev) => ({ ...prev, introReady: true }));
        propsRef.current?.onIntroReady?.();
        console.log("[Orchestrator] Intro animation ready");
      }, 200);
    });

    return () => {
      if (introTimer) clearTimeout(introTimer);
    };
  }, [animationState.isHydrated]);

  // Stage 3: Enable about animation after intro is ready
  useEffect(() => {
    if (!animationState.introReady) return;

    // About can start immediately after intro
    setAnimationState((prev) => ({ ...prev, aboutReady: true }));
    propsRef.current?.onAboutReady?.();
    console.log("[Orchestrator] About animation ready");
  }, [animationState.introReady]);

  // Stage 4: Enable feature highlight animation after about is ready
  useEffect(() => {
    if (!animationState.aboutReady) return;

    // Feature highlight section can start immediately after about
    setAnimationState((prev) => ({ ...prev, featureHighlightReady: true }));
    propsRef.current?.onFeatureHighlightReady?.();
    console.log("[Orchestrator] Feature Highlight animation ready");
  }, [animationState.aboutReady]);

  // Stage 5: Enable demo animation after feature highlight is ready
  useEffect(() => {
    if (!animationState.featureHighlightReady) return;

    // Demo section can start immediately after feature highlight
    setAnimationState((prev) => ({ ...prev, demoReady: true }));
    propsRef.current?.onDemoReady?.();
    console.log("[Orchestrator] Demo animation ready");
  }, [animationState.featureHighlightReady]);

  // Refresh ScrollTrigger when all animations are ready
  useEffect(() => {
    if (!animationState.demoReady) return;

    // Give animations time to initialize, then refresh ScrollTrigger
    const refreshTimer = setTimeout(() => {
      // Save current scroll position
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;

      // Refresh ScrollTrigger
      ScrollTrigger.refresh();

      // Ensure scroll position is maintained
      if (window.lenis) {
        window.lenis.scrollTo(currentScroll, { immediate: true });
      } else {
        window.scrollTo(0, currentScroll);
      }

      console.log(
        "[Orchestrator] ScrollTrigger refreshed after all animations ready - position preserved"
      );
    }, 100);

    return () => clearTimeout(refreshTimer);
  }, [animationState.demoReady]);

  // Handle window resize with debounced ScrollTrigger refresh
  useEffect(() => {
    if (!animationState.isHydrated) return;

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Refresh ScrollTrigger
        ScrollTrigger.refresh();

        console.log(
          "[Orchestrator] ScrollTrigger refreshed after resize with progress preserved"
        );
      }, 250);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [animationState.isHydrated]);

  // Handle tab visibility changes to prevent scroll jumping
  useEffect(() => {
    if (!animationState.isHydrated) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab is now visible - preserve scroll position
        const currentScroll =
          window.pageYOffset || document.documentElement.scrollTop;

        // Update Lenis if it exists
        if (window.lenis) {
          window.lenis.scrollTo(currentScroll, { immediate: true });
        }

        // Refresh ScrollTrigger
        ScrollTrigger.refresh();

        // Ensure scroll position is maintained
        window.scrollTo(0, currentScroll);

        console.log(
          "[Orchestrator] Tab visibility restored - scroll position preserved"
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [animationState.isHydrated]);

  // Emergency fallback - force everything ready after 3 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setAnimationState((prev) => {
        const needsFallback =
          !prev.isHydrated ||
          !prev.introReady ||
          !prev.aboutReady ||
          !prev.featureHighlightReady ||
          !prev.demoReady;

        if (needsFallback) {
          console.warn(
            "[Orchestrator] Fallback activated - forcing all animations ready"
          );
          propsRef.current?.onAnimationError?.(
            new Error("Animation initialization timeout")
          );

          return {
            isHydrated: true,
            introReady: true,
            aboutReady: true,
            featureHighlightReady: true,
            demoReady: true,
            isAnimating: false,
            hasError: false,
            prefersReducedMotion: prev.prefersReducedMotion,
            isMobile: prev.isMobile,
            isLowEndDevice: prev.isLowEndDevice,
          };
        }

        return prev;
      });
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Provide manual control methods
  const forceReady = () => {
    setAnimationState((prev) => ({
      ...prev,
      isHydrated: true,
      introReady: true,
      aboutReady: true,
      featureHighlightReady: true,
      demoReady: true,
      isAnimating: false,
      hasError: false,
    }));
    console.log("[Orchestrator] Manually forced all animations ready");
  };

  const reset = () => {
    setAnimationState((prev) => ({
      ...prev,
      isHydrated: false,
      introReady: false,
      aboutReady: false,
      featureHighlightReady: false,
      demoReady: false,
      isAnimating: false,
      hasError: false,
    }));
    console.log("[Orchestrator] Reset animation states");
  };

  // Centralized cleanup function
  const cleanup = () => {
    try {
      // Kill all ScrollTriggers
      ScrollTrigger.getAll().forEach((st) => st.kill());
      activeScrollTriggers.current.clear();

      // Run all registered cleanup functions
      cleanupFunctions.current.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error("[Orchestrator] Cleanup error:", error);
        }
      });
      cleanupFunctions.current = [];

      // Kill all GSAP animations
      gsap.killTweensOf("*");
    } catch (error) {
      console.error("[Orchestrator] Failed to cleanup:", error);
    }
  };

  // Register a ScrollTrigger for tracking
  const registerScrollTrigger = (st: any) => {
    // ScrollTrigger type from GSAP
    activeScrollTriggers.current.add(st);
  };

  // Register a cleanup function
  const registerCleanup = (fn: () => void) => {
    cleanupFunctions.current.push(fn);
  };

  // Handle component unmount
  useEffect(() => {
    return () => {
      try {
        // Kill all ScrollTriggers
        ScrollTrigger.getAll().forEach((st) => st.kill());
        activeScrollTriggers.current.clear();

        // Run all registered cleanup functions
        cleanupFunctions.current.forEach((fn) => {
          try {
            fn();
          } catch (error) {
            console.error("[Orchestrator] Cleanup error:", error);
          }
        });
        cleanupFunctions.current = [];

        // Kill all GSAP animations
        gsap.killTweensOf("*");
      } catch (error) {
        console.error("[Orchestrator] Failed to cleanup on unmount:", error);
      }
    };
  }, []);

  return {
    animationState,
    forceReady,
    reset,
    cleanup,
    registerScrollTrigger,
    registerCleanup,
  };
}
