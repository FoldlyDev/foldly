'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface AnimationState {
  introComplete: boolean;
  heroComplete: boolean;
  featuresReady: boolean;
  isAnimating: boolean;
}

export interface AnimationCallbacks {
  onIntroComplete?: () => void;
  onHeroComplete?: () => void;
  onFeaturesReady?: () => void;
  onAnimationError?: (error: Error) => void;
}

/**
 * Centralized animation orchestrator for the landing page
 * Coordinates all section animations to prevent conflicts and race conditions
 */
export function useLandingAnimationOrchestrator(callbacks?: AnimationCallbacks) {
  const [animationState, setAnimationState] = useState<AnimationState>({
    introComplete: false,
    heroComplete: false,
    featuresReady: false,
    isAnimating: false,
  });

  const contextRef = useRef<gsap.Context | null>(null);
  const masterTimelineRef = useRef<GSAPTimeline | null>(null);
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef(callbacks);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Initialize GSAP plugins
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  // Main orchestration logic
  useEffect(() => {
    // Wait longer before marking features as ready
    // This ensures intro animation has time to properly initialize
    const timer = setTimeout(() => {
      setAnimationState(prev => ({ 
        ...prev, 
        introComplete: true,
        heroComplete: true,
        featuresReady: true 
      }));
      callbacksRef.current?.onFeaturesReady?.();
      console.log('[Orchestrator] Features section ready for animation');
    }, 1500); // Wait 1.5 seconds to ensure intro is fully initialized

    // Disable recovery mechanism for now - it might be interfering
    // Emergency recovery mechanism
    /*recoveryTimeoutRef.current = setTimeout(() => {
      console.log('[Orchestrator] Running recovery check...');
      
      // Check for invisible sections
      const sections = document.querySelectorAll('.intro-hero, .hero-section, .features-section');
      let recoveryNeeded = false;

      sections.forEach((section) => {
        const computed = window.getComputedStyle(section);
        const opacity = parseFloat(computed.opacity);
        const visibility = computed.visibility;
        const display = computed.display;

        if (opacity === 0 || visibility === 'hidden' || display === 'none') {
          console.warn(`[Orchestrator] Found invisible section: ${section.className}`, {
            opacity,
            visibility,
            display
          });
          
          // Force visibility
          gsap.set(section, {
            opacity: 1,
            visibility: 'visible',
            display: 'block',
            clearProps: 'opacity,visibility,display'
          });
          
          recoveryNeeded = true;
        }
      });

      if (recoveryNeeded) {
        // Force animation state to complete
        setAnimationState({
          introComplete: true,
          heroComplete: true,
          featuresReady: true,
          isAnimating: false,
        });
        
        // Refresh ScrollTrigger after recovery
        ScrollTrigger.refresh(true);
        
        callbacksRef.current?.onAnimationError?.(new Error('Animation recovery was needed'));
      }
    }, 2000); // Run after 2 seconds to catch any stuck animations*/

    // Cleanup
    return () => {
      clearTimeout(timer);
      /*if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }*/
    };
  }, []); // Remove callbacks dependency to prevent re-runs

  // Provide manual control methods
  const forceComplete = () => {
    setAnimationState({
      introComplete: true,
      heroComplete: true,
      featuresReady: true,
      isAnimating: false,
    });
    ScrollTrigger.refresh(true);
  };

  const reset = () => {
    setAnimationState({
      introComplete: false,
      heroComplete: false,
      featuresReady: false,
      isAnimating: false,
    });
    
    if (masterTimelineRef.current) {
      masterTimelineRef.current.restart();
    }
  };

  return {
    animationState,
    forceComplete,
    reset,
  };
}