'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface AnimationState {
  isHydrated: boolean;
  introReady: boolean;
  aboutReady: boolean;
  featureHighlightReady: boolean;
  demoReady: boolean;
  isAnimating: boolean;
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
export function useLandingAnimationOrchestrator(props: AnimationOrchestratorProps) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isHydrated: false,
    introReady: false,
    aboutReady: false,
    featureHighlightReady: false,
    demoReady: false,
    isAnimating: false,
  });

  const propsRef = useRef(props);

  // Update props ref when they change
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  // Initialize GSAP plugins once
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  // Stage 1: Handle hydration - wait for parent component's isReady
  useEffect(() => {
    if (!props.isReady) return;

    setAnimationState(prev => ({ ...prev, isHydrated: true }));
    propsRef.current?.onHydrationComplete?.();
    console.log('[Orchestrator] Hydration complete');
  }, [props.isReady]);

  // Stage 2: Enable intro animation after hydration
  useEffect(() => {
    if (!animationState.isHydrated) return;

    // Give intro animation time to initialize
    const introTimer = setTimeout(() => {
      setAnimationState(prev => ({ ...prev, introReady: true }));
      propsRef.current?.onIntroReady?.();
      console.log('[Orchestrator] Intro animation ready');
    }, 200);

    return () => clearTimeout(introTimer);
  }, [animationState.isHydrated]);

  // Stage 3: Enable about animation after intro is ready
  useEffect(() => {
    if (!animationState.introReady) return;

    // About can start immediately after intro
    setAnimationState(prev => ({ ...prev, aboutReady: true }));
    propsRef.current?.onAboutReady?.();
    console.log('[Orchestrator] About animation ready');
  }, [animationState.introReady]);

  // Stage 4: Enable feature highlight animation after about is ready
  useEffect(() => {
    if (!animationState.aboutReady) return;

    // Feature highlight section can start immediately after about
    setAnimationState(prev => ({ ...prev, featureHighlightReady: true }));
    propsRef.current?.onFeatureHighlightReady?.();
    console.log('[Orchestrator] Feature Highlight animation ready');
  }, [animationState.aboutReady]);

  // Stage 5: Enable demo animation after feature highlight is ready
  useEffect(() => {
    if (!animationState.featureHighlightReady) return;

    // Demo section can start immediately after feature highlight
    setAnimationState(prev => ({ ...prev, demoReady: true }));
    propsRef.current?.onDemoReady?.();
    console.log('[Orchestrator] Demo animation ready');
  }, [animationState.featureHighlightReady]);

  // Emergency fallback - force everything ready after 3 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setAnimationState(prev => {
        const needsFallback = !prev.isHydrated || !prev.introReady || !prev.aboutReady || !prev.featureHighlightReady || !prev.demoReady;
        
        if (needsFallback) {
          console.warn('[Orchestrator] Fallback activated - forcing all animations ready');
          propsRef.current?.onAnimationError?.(new Error('Animation initialization timeout'));
          
          return {
            isHydrated: true,
            introReady: true,
            aboutReady: true,
            featureHighlightReady: true,
            demoReady: true,
            isAnimating: false,
          };
        }
        
        return prev;
      });
    }, 3000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Provide manual control methods
  const forceReady = () => {
    setAnimationState({
      isHydrated: true,
      introReady: true,
      aboutReady: true,
      featureHighlightReady: true,
      demoReady: true,
      isAnimating: false,
    });
    // No need to refresh ScrollTrigger - the template doesn't do this
    console.log('[Orchestrator] Manually forced all animations ready');
  };

  const reset = () => {
    setAnimationState({
      isHydrated: false,
      introReady: false,
      aboutReady: false,
      featureHighlightReady: false,
      demoReady: false,
      isAnimating: false,
    });
    console.log('[Orchestrator] Reset animation states');
  };

  return {
    animationState,
    forceReady,
    reset,
  };
}