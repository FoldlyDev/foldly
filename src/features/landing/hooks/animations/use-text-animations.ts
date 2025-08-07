'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useGsapAnimation } from './use-gsap-animations';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

export interface TextAnimationOptions {
  delay?: number;
  duration?: number;
  stagger?: number | object;
  ease?: string;
  onComplete?: () => void;
}

export interface ScrambleOptions extends TextAnimationOptions {
  scrambleDuration?: number;
  maxIterations?: number;
  interval?: number;
  specialChars?: boolean;
}

/**
 * Hook for text-based animations with refs
 */
export function useTextAnimations() {
  const { setRef } = useGsapAnimation();
  const splitInstancesRef = useRef<Map<HTMLElement, SplitText>>(new Map());

  /**
   * Create a SplitText instance for an element
   */
  const createSplitText = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      type: 'chars' | 'words' | 'lines' = 'words',
      options?: {
        linesClass?: string;
        wordsClass?: string;
        charsClass?: string;
      }
    ): SplitText | null => {
      if (!elementRef.current) return null;

      // Clean up existing split if any
      const existingSplit = splitInstancesRef.current.get(elementRef.current);
      if (existingSplit) {
        existingSplit.revert();
        splitInstancesRef.current.delete(elementRef.current);
      }

      const split = new SplitText(elementRef.current, {
        type,
        ...options,
      });

      splitInstancesRef.current.set(elementRef.current, split);
      return split;
    },
    []
  );

  /**
   * Enhanced scramble text animation with juno_watts style
   */
  const scrambleText = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: ScrambleOptions = {}
    ) => {
      if (!elementRef.current || window.innerWidth < 1200) return null;

      const {
        delay = 0,
        scrambleDuration = 0.4,
        maxIterations = 8,
        interval = 25,
        specialChars = true,
        onComplete,
      } = options;

      const split = createSplitText(elementRef, 'chars');
      if (!split) return null;

      setRef(elementRef, { opacity: 1 });
      gsap.set(split.chars, { opacity: 0 });

      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:<>?,./';
      const specialCharSet = '▶▷◀◁▲▼◆◇○●□■';

      const scrambleChar = (char: Element, originalText: string, index: number) => {
        const startTime = Date.now();
        const charDuration = scrambleDuration * 1000;
        const maxIter = Math.floor(Math.random() * (maxIterations - 3)) + 5;

        gsap.set(char, { opacity: 1 });

        const scrambleInterval = setInterval(() => {
          if (char instanceof HTMLElement) {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / charDuration, 1);
            
            if (progress >= 0.8) {
              clearInterval(scrambleInterval);
              char.textContent = originalText;
              
              // Micro animation on complete
              gsap.to(char, {
                scale: 1.1,
                duration: 0.1,
                ease: 'power2.out',
                onComplete: () => {
                  gsap.to(char, {
                    scale: 1,
                    duration: 0.1,
                  });
                },
              });
            } else {
              // Mix regular and special characters
              const useSpecial = specialChars && Math.random() < 0.2;
              const charSet = useSpecial ? specialCharSet : chars;
              char.textContent = charSet[Math.floor(Math.random() * charSet.length)] || '';
            }
          }
        }, 25) as unknown as NodeJS.Timeout;

        setTimeout(() => {
          clearInterval(scrambleInterval);
          if (char instanceof HTMLElement) {
            char.textContent = originalText;
          }
        }, charDuration);
      };

      setTimeout(() => {
        split.chars.forEach((char, index) => {
          const originalText = char.textContent || '';
          const charDelay = index * interval;
          setTimeout(() => {
            scrambleChar(char, originalText, index);
          }, charDelay);
        });

        if (onComplete) {
          const totalDuration = delay + scrambleDuration + (split.chars.length * interval) / 1000;
          setTimeout(onComplete, totalDuration * 1000);
        }
      }, delay * 1000);

      return split;
    },
    [createSplitText, setRef]
  );

  /**
   * Reveal text animation (words)
   */
  const revealText = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: TextAnimationOptions = {}
    ) => {
      if (!elementRef.current || window.innerWidth < 1200) return null;

      const {
        delay = 0,
        duration = 0.75,
        stagger = 0.1,
        ease = 'power4.out',
        onComplete,
      } = options;

      const split = createSplitText(elementRef, 'words', {
        wordsClass: 'word-mask',
      });
      if (!split) return null;

      setRef(elementRef, { opacity: 1 });
      gsap.set(split.words, { yPercent: 120 });

      const tweenVars: gsap.TweenVars = {
        yPercent: 0,
        duration,
        stagger,
        ease,
        delay,
      };
      
      if (onComplete) {
        tweenVars.onComplete = onComplete;
      }
      
      return gsap.to(split.words, tweenVars);
    },
    [createSplitText, setRef]
  );

  /**
   * Enhanced line reveal animation with masking effect
   */
  const lineRevealText = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: TextAnimationOptions = {}
    ) => {
      if (!elementRef.current || window.innerWidth < 1200) return null;

      const {
        delay = 0,
        duration = 0.8,
        stagger = 0.08,
        ease = 'power4.out',
        onComplete,
      } = options;

      // Add overflow hidden to parent for masking effect
      const parent = elementRef.current.parentElement;
      if (parent) {
        parent.style.overflow = 'hidden';
      }

      const split = createSplitText(elementRef, 'lines', {
        linesClass: 'reveal-line',
      });
      if (!split) return null;

      // Wrap each line in a mask container
      split.lines.forEach((line: Element) => {
        const wrapper = document.createElement('div');
        wrapper.style.overflow = 'hidden';
        wrapper.style.display = 'block';
        line.parentNode?.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });

      setRef(elementRef, { opacity: 1 });
      gsap.set(split.lines, { 
        yPercent: 120,
        opacity: 0,
        rotationX: -10,
        transformOrigin: 'center bottom',
      });

      const tweenVars: gsap.TweenVars = {
        yPercent: 0,
        opacity: 1,
        rotationX: 0,
        duration,
        stagger,
        ease,
        delay,
        onComplete: () => {
          // Clean up wrapper elements
          split.lines.forEach((line: Element) => {
            const wrapper = line.parentElement;
            if (wrapper && wrapper.parentElement) {
              wrapper.parentElement.insertBefore(line, wrapper);
              wrapper.remove();
            }
          });
          if (parent) {
            parent.style.overflow = '';
          }
          if (onComplete) {
            onComplete();
          }
        },
      };
      
      return gsap.to(split.lines, tweenVars);
    },
    [createSplitText, setRef]
  );

  /**
   * Type writer effect
   */
  const typewriterText = useCallback(
    <T extends HTMLElement>(
      elementRef: RefObject<T>,
      options: TextAnimationOptions = {}
    ) => {
      if (!elementRef.current) return null;

      const {
        delay = 0,
        duration = 2,
        ease = 'none',
        onComplete,
      } = options;

      const split = createSplitText(elementRef, 'chars');
      if (!split) return null;

      setRef(elementRef, { opacity: 1 });
      gsap.set(split.chars, { opacity: 0 });

      const tweenVars: gsap.TweenVars = {
        opacity: 1,
        duration: duration / split.chars.length,
        stagger: duration / split.chars.length,
        ease,
        delay,
      };
      
      if (onComplete) {
        tweenVars.onComplete = onComplete;
      }
      
      return gsap.to(split.chars, tweenVars);
    },
    [createSplitText, setRef]
  );

  /**
   * Clean up all split text instances
   */
  const cleanupSplitTexts = useCallback(() => {
    splitInstancesRef.current.forEach(split => split.revert());
    splitInstancesRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSplitTexts();
    };
  }, [cleanupSplitTexts]);

  return {
    scrambleText,
    revealText,
    lineRevealText,
    typewriterText,
    createSplitText,
    cleanupSplitTexts,
  };
}