'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export interface AnimationOptions {
  delay?: number;
  duration?: number;
  ease?: string;
  stagger?: number | object;
  onComplete?: () => void;
  onStart?: () => void;
  scrollTrigger?: ScrollTrigger.Vars;
}

/**
 * Core GSAP animation hook that provides ref-based animations
 */
export function useGsapAnimation() {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const tweensRef = useRef<gsap.core.Tween[]>([]);

  /**
   * Animate a single ref or array of refs
   */
  const animateRef = useCallback(
    <T extends HTMLElement>(
      ref: RefObject<T> | RefObject<T>[],
      vars: gsap.TweenVars,
      options?: AnimationOptions
    ) => {
      if (!ref) return null;

      const refs = Array.isArray(ref) ? ref : [ref];
      const elements = refs
        .map(r => r.current)
        .filter((el): el is T => el !== null);

      if (elements.length === 0) return null;

      const tweenVars: gsap.TweenVars = {
        ...vars,
      };

      if (options?.delay !== undefined) tweenVars.delay = options.delay;
      if (options?.duration !== undefined) tweenVars.duration = options.duration;
      if (options?.ease !== undefined) tweenVars.ease = options.ease;
      if (options?.stagger !== undefined) tweenVars.stagger = options.stagger;
      if (options?.onComplete !== undefined) tweenVars.onComplete = options.onComplete;
      if (options?.onStart !== undefined) tweenVars.onStart = options.onStart;
      if (options?.scrollTrigger !== undefined) tweenVars.scrollTrigger = options.scrollTrigger;

      const tween = gsap.to(elements, tweenVars);

      tweensRef.current.push(tween);
      return tween;
    },
    []
  );

  /**
   * Set initial properties for refs
   */
  const setRef = useCallback(
    <T extends HTMLElement>(
      ref: RefObject<T> | RefObject<T>[],
      vars: gsap.TweenVars
    ) => {
      if (!ref) return;

      const refs = Array.isArray(ref) ? ref : [ref];
      const elements = refs
        .map(r => r.current)
        .filter((el): el is T => el !== null);

      if (elements.length > 0) {
        gsap.set(elements, vars);
      }
    },
    []
  );

  /**
   * Create a timeline for complex animations
   */
  const createTimeline = useCallback((vars?: gsap.TimelineVars) => {
    timelineRef.current = gsap.timeline(vars);
    return timelineRef.current;
  }, []);

  /**
   * Add animation to timeline
   */
  const addToTimeline = useCallback(
    <T extends HTMLElement>(
      ref: RefObject<T> | RefObject<T>[],
      vars: gsap.TweenVars,
      position?: gsap.Position
    ) => {
      if (!timelineRef.current || !ref) return;

      const refs = Array.isArray(ref) ? ref : [ref];
      const elements = refs
        .map(r => r.current)
        .filter((el): el is T => el !== null);

      if (elements.length > 0) {
        timelineRef.current.to(elements, vars, position);
      }
    },
    []
  );

  /**
   * Kill all animations and cleanup
   */
  const killAnimations = useCallback(() => {
    tweensRef.current.forEach(tween => tween.kill());
    tweensRef.current = [];
    
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      killAnimations();
    };
  }, [killAnimations]);

  return {
    animateRef,
    setRef,
    createTimeline,
    addToTimeline,
    killAnimations,
  };
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation() {
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  const createScrollTrigger = useCallback(
    (vars: ScrollTrigger.Vars): ScrollTrigger => {
      // Ensure trigger is defined and valid
      if (!vars.trigger) {
        throw new Error('ScrollTrigger requires a trigger element');
      }
      
      // Create a clean vars object to avoid type issues
      const cleanVars = {
        ...vars,
        trigger: vars.trigger as string | Element,
      };
      
      const trigger = ScrollTrigger.create(cleanVars as any);
      scrollTriggersRef.current.push(trigger);
      return trigger;
    },
    []
  );

  const killScrollTriggers = useCallback(() => {
    scrollTriggersRef.current.forEach(trigger => {
      if (trigger && 'kill' in trigger && typeof trigger.kill === 'function') {
        trigger.kill();
      }
    });
    scrollTriggersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      killScrollTriggers();
    };
  }, [killScrollTriggers]);

  return {
    createScrollTrigger,
    killScrollTriggers,
  };
}