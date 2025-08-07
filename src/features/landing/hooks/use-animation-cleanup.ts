'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SplitText } from 'gsap/SplitText';

interface AnimationCleanup {
  timelines: gsap.core.Timeline[];
  tweens: gsap.core.Tween[];
  scrollTriggers: ScrollTrigger[];
  splitTexts: SplitText[];
  observers: IntersectionObserver[];
  timeouts: NodeJS.Timeout[];
  intervals: NodeJS.Timeout[];
}

export function useAnimationCleanup() {
  const cleanupRef = useRef<AnimationCleanup>({
    timelines: [],
    tweens: [],
    scrollTriggers: [],
    splitTexts: [],
    observers: [],
    timeouts: [],
    intervals: [],
  });

  // Register a timeline for cleanup
  const registerTimeline = (timeline: gsap.core.Timeline) => {
    cleanupRef.current.timelines.push(timeline);
    return timeline;
  };

  // Register a tween for cleanup
  const registerTween = (tween: gsap.core.Tween) => {
    cleanupRef.current.tweens.push(tween);
    return tween;
  };

  // Register a ScrollTrigger for cleanup
  const registerScrollTrigger = (scrollTrigger: ScrollTrigger) => {
    cleanupRef.current.scrollTriggers.push(scrollTrigger);
    return scrollTrigger;
  };

  // Register a SplitText instance for cleanup
  const registerSplitText = (splitText: SplitText) => {
    cleanupRef.current.splitTexts.push(splitText);
    return splitText;
  };

  // Register an IntersectionObserver for cleanup
  const registerObserver = (observer: IntersectionObserver) => {
    cleanupRef.current.observers.push(observer);
    return observer;
  };

  // Register a timeout for cleanup
  const registerTimeout = (timeout: NodeJS.Timeout) => {
    cleanupRef.current.timeouts.push(timeout);
    return timeout;
  };

  // Register an interval for cleanup
  const registerInterval = (interval: NodeJS.Timeout) => {
    cleanupRef.current.intervals.push(interval);
    return interval;
  };

  // Cleanup all registered animations and resources
  const cleanup = () => {
    const { timelines, tweens, scrollTriggers, splitTexts, observers, timeouts, intervals } = cleanupRef.current;

    // Kill all timelines
    timelines.forEach((timeline) => {
      if (timeline) {
        timeline.kill();
      }
    });

    // Kill all tweens
    tweens.forEach((tween) => {
      if (tween) {
        tween.kill();
      }
    });

    // Kill all ScrollTriggers
    scrollTriggers.forEach((trigger) => {
      if (trigger && 'kill' in trigger && typeof trigger.kill === 'function') {
        trigger.kill();
      }
    });

    // Revert all SplitText instances
    splitTexts.forEach((split) => {
      if (split) {
        split.revert();
      }
    });

    // Disconnect all observers
    observers.forEach((observer) => {
      if (observer) {
        observer.disconnect();
      }
    });

    // Clear all timeouts
    timeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });

    // Clear all intervals
    intervals.forEach((interval) => {
      clearInterval(interval);
    });

    // Reset the cleanup reference
    cleanupRef.current = {
      timelines: [],
      tweens: [],
      scrollTriggers: [],
      splitTexts: [],
      observers: [],
      timeouts: [],
      intervals: [],
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    registerTimeline,
    registerTween,
    registerScrollTrigger,
    registerSplitText,
    registerObserver,
    registerTimeout,
    registerInterval,
    cleanup,
  };
}

// Hook to ensure GSAP animations are properly cleaned up
export function useGSAPCleanup() {
  useEffect(() => {
    return () => {
      // Kill all active GSAP animations
      gsap.killTweensOf('*');
      
      // Clear all ScrollTriggers
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger && 'kill' in trigger && typeof trigger.kill === 'function') {
            trigger.kill();
          }
        });
      }
    };
  }, []);
}