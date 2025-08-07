'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

interface AnimationOptions {
  delay?: number;
  onScroll?: boolean;
}

export function useScrambleAnimation() {
  const splitInstancesRef = useRef<SplitText[]>([]);

  const scrambleText = (elements: Element[], duration = 0.4) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    elements.forEach((char) => {
      const originalText = char.textContent || '';
      let iterations = 0;
      const maxIterations = Math.floor(Math.random() * 6) + 3;

      gsap.set(char, { opacity: 1 });

      const scrambleInterval = setInterval(() => {
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        iterations++;

        if (iterations >= maxIterations) {
          clearInterval(scrambleInterval);
          char.textContent = originalText;
        }
      }, 50);

      setTimeout(() => {
        clearInterval(scrambleInterval);
        char.textContent = originalText;
      }, duration * 1000);
    });
  };

  const scrambleAnimation = (element: HTMLElement, delay = 0) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1200) return;

    const textContent = element.textContent || element.innerText || '';
    if (!textContent.trim()) return;

    const split = new SplitText(element, {
      type: 'chars',
    });

    splitInstancesRef.current.push(split);

    gsap.set(split.chars, {
      opacity: 0,
    });

    setTimeout(() => {
      const chars = Array.from(split.chars);
      chars.forEach((char, index) => {
        setTimeout(() => {
          scrambleText([char], 0.4);
        }, index * 30);
      });
    }, delay * 1000);
  };

  const cleanup = () => {
    splitInstancesRef.current.forEach((split) => {
      split.revert();
    });
    splitInstancesRef.current = [];
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return { scrambleAnimation, cleanup };
}

export function useRevealAnimation() {
  const splitInstancesRef = useRef<SplitText[]>([]);

  const revealAnimation = (element: HTMLElement, delay = 0) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1200) return;

    const textContent = element.textContent || element.innerText || '';
    if (!textContent.trim()) return;

    const split = new SplitText(element, {
      type: 'words',
      linesClass: 'split-line',
    });

    splitInstancesRef.current.push(split);

    gsap.set(split.words, {
      yPercent: 120,
    });

    gsap.to(split.words, {
      duration: 0.75,
      yPercent: 0,
      stagger: 0.1,
      ease: 'power4.out',
      delay: delay,
    });
  };

  const cleanup = () => {
    splitInstancesRef.current.forEach((split) => {
      split.revert();
    });
    splitInstancesRef.current = [];
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return { revealAnimation, cleanup };
}

export function useLineRevealAnimation() {
  const splitInstancesRef = useRef<SplitText[]>([]);

  const lineRevealAnimation = (element: HTMLElement, delay = 0) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1200) return;

    const textContent = element.textContent || element.innerText || '';
    if (!textContent.trim()) return;

    const split = new SplitText(element, {
      type: 'lines',
      linesClass: 'split-line',
    });

    splitInstancesRef.current.push(split);

    gsap.set(split.lines, {
      yPercent: 120,
    });

    gsap.to(split.lines, {
      duration: 0.8,
      yPercent: 0,
      stagger: 0.1,
      ease: 'power4.out',
      delay: delay,
    });
  };

  const cleanup = () => {
    splitInstancesRef.current.forEach((split) => {
      split.revert();
    });
    splitInstancesRef.current = [];
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return { lineRevealAnimation, cleanup };
}

export function useAnimatedElement() {
  const { scrambleAnimation } = useScrambleAnimation();
  const { revealAnimation } = useRevealAnimation();
  const { lineRevealAnimation } = useLineRevealAnimation();
  const observersRef = useRef<Map<Element, IntersectionObserver>>(new Map());
  const initializedRef = useRef(false);

  const initAnimations = () => {
    // Prevent double initialization
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (typeof window !== 'undefined' && window.innerWidth < 1200) {
      return;
    }

    const animatedElements = document.querySelectorAll('[data-animate-type]');
    const sectionsWithScrollElements = new Set<Element>();

    animatedElements.forEach((element) => {
      const animationType = element.getAttribute('data-animate-type');
      const delay = parseFloat(element.getAttribute('data-animate-delay') || '') || 0;
      const animateOnScroll = element.getAttribute('data-animate-on-scroll') === 'true';

      if (animateOnScroll) {
        gsap.set(element, { opacity: 0 });

        const parentSection = element.closest('section');
        if (!parentSection) {
          console.warn('No parent section found for scroll animation:', element);
          return;
        }

        if (!sectionsWithScrollElements.has(parentSection)) {
          sectionsWithScrollElements.add(parentSection);

          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                  const sectionElements = entry.target.querySelectorAll(
                    '[data-animate-on-scroll="true"]'
                  );

                  sectionElements.forEach((el) => {
                    const elAnimationType = el.getAttribute('data-animate-type');
                    const elDelay =
                      parseFloat(el.getAttribute('data-animate-delay') || '') || 0;

                    gsap.set(el, { opacity: 1 });

                    switch (elAnimationType) {
                      case 'scramble':
                        scrambleAnimation(el as HTMLElement, elDelay);
                        break;
                      case 'reveal':
                        revealAnimation(el as HTMLElement, elDelay);
                        break;
                      case 'line-reveal':
                        lineRevealAnimation(el as HTMLElement, elDelay);
                        break;
                    }
                  });

                  observer.unobserve(entry.target);
                }
              });
            },
            {
              threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
              rootMargin: '0px 0px -20% 0px',
            }
          );

          observer.observe(parentSection);
          observersRef.current.set(parentSection, observer);
        }
      } else {
        switch (animationType) {
          case 'scramble':
            scrambleAnimation(element as HTMLElement, delay);
            break;
          case 'reveal':
            revealAnimation(element as HTMLElement, delay);
            break;
          case 'line-reveal':
            lineRevealAnimation(element as HTMLElement, delay);
            break;
          default:
            console.warn(`Unknown animation type: ${animationType}`);
        }
      }
    });
  };

  const cleanup = () => {
    observersRef.current.forEach((observer) => {
      observer.disconnect();
    });
    observersRef.current.clear();
    initializedRef.current = false;
  };

  useEffect(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
      // Wait for fonts to load
      document.fonts.ready.then(initAnimations);
    }

    return () => {
      cleanup();
    };
  }, []);

  return { initAnimations };
}