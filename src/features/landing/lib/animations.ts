'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

/**
 * Legacy animation functions for backward compatibility
 * These functions now work with refs instead of DOM queries
 */

let splitInstances: SplitText[] = [];

function getTextContent(element: Element | HTMLElement): string {
  return element.textContent || '';
}

/**
 * Create scramble animation for a ref
 */
export function scrambleAnimation<T extends HTMLElement>(
  elementRef: RefObject<T> | T,
  delay = 0
): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const element = 'current' in elementRef ? elementRef.current : elementRef;
  if (!element) return;

  const textContent = getTextContent(element);
  if (!textContent.trim()) return;

  const split = new SplitText(element, {
    type: 'chars',
  });

  splitInstances.push(split);

  gsap.set(split.chars, {
    opacity: 0,
  });

  setTimeout(() => {
    scrambleTextStaggered(split.chars, 0.4);
  }, delay * 1000);
}

/**
 * Create reveal animation for a ref
 */
export function revealAnimation<T extends HTMLElement>(
  elementRef: RefObject<T> | T,
  delay = 0
): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const element = 'current' in elementRef ? elementRef.current : elementRef;
  if (!element) return;

  const textContent = getTextContent(element);
  if (!textContent.trim()) return;

  const split = new SplitText(element, {
    type: 'words',
    linesClass: 'mask-line',
  });

  splitInstances.push(split);

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
}

/**
 * Create line reveal animation for a ref
 */
export function lineRevealAnimation<T extends HTMLElement>(
  elementRef: RefObject<T> | T,
  delay = 0
): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const element = 'current' in elementRef ? elementRef.current : elementRef;
  if (!element) return;

  const textContent = getTextContent(element);
  if (!textContent.trim()) return;

  const split = new SplitText(element, {
    type: 'lines',
    linesClass: 'mask-line',
  });

  splitInstances.push(split);

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
}

function scrambleTextStaggered(elements: Element[], duration = 0.4): void {
  elements.forEach((char, index) => {
    setTimeout(() => {
      scrambleText([char], duration);
    }, index * 30);
  });
}

function scrambleText(elements: Element[], duration = 0.4): void {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

  elements.forEach((char) => {
    const originalText = char.textContent || '';
    let iterations = 0;
    const maxIterations = Math.floor(Math.random() * 6) + 3;

    gsap.set(char, { opacity: 1 });

    const scrambleInterval = setInterval(() => {
      if (char instanceof HTMLElement) {
        char.textContent = chars[Math.floor(Math.random() * chars.length)] || '';
        iterations++;

        if (iterations >= maxIterations) {
          clearInterval(scrambleInterval);
          char.textContent = originalText;
        }
      }
    }, 50);

    setTimeout(() => {
      clearInterval(scrambleInterval);
      if (char instanceof HTMLElement) {
        char.textContent = originalText;
      }
    }, duration * 1000);
  });
}

/**
 * Initialize animations for elements with data-animate attributes
 * This function now uses an observer-based approach and works with refs
 */
export function initAnimations(): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) {
    return;
  }

  // Wait for fonts to be ready
  document.fonts.ready.then(() => {
    const animatedElements = document.querySelectorAll('[data-animate-type]');
    const sectionsWithScrollElements = new Set<Element>();
    const sectionObservers = new Map<Element, IntersectionObserver>();

    animatedElements.forEach((element) => {
      const animationType = element.getAttribute('data-animate-type');
      const delay = parseFloat(element.getAttribute('data-animate-delay') || '0') || 0;
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
                    const elDelay = parseFloat(el.getAttribute('data-animate-delay') || '0') || 0;

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
          sectionObservers.set(parentSection, observer);
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
  });
}

/**
 * Clean up all animations
 */
export function cleanupAnimations(): void {
  splitInstances.forEach((split) => {
    split.revert();
  });
  splitInstances = [];
}

/**
 * Animate a single element by ref
 */
export function animateElement<T extends HTMLElement>(
  elementRef: RefObject<T>,
  type: string,
  delay = 0
): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const element = elementRef.current;
  if (!element) {
    console.warn(`Element ref not found`);
    return;
  }

  switch (type) {
    case 'scramble':
      scrambleAnimation(element, delay);
      break;
    case 'reveal':
      revealAnimation(element, delay);
      break;
    case 'line-reveal':
      lineRevealAnimation(element, delay);
      break;
    default:
      console.warn(`Unknown animation type: ${type}`);
  }
}

/**
 * Animate multiple elements by refs
 */
export function animateElements<T extends HTMLElement>(
  elementRefs: RefObject<T>[],
  type: string,
  delay = 0,
  staggerDelay = 0.1
): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const elements = elementRefs
    .map(ref => ref.current)
    .filter((el): el is T => el !== null);

  if (!elements.length) {
    console.warn(`No elements found in refs`);
    return;
  }

  elements.forEach((element, index) => {
    const totalDelay = delay + index * staggerDelay;

    switch (type) {
      case 'scramble':
        scrambleAnimation(element, totalDelay);
        break;
      case 'reveal':
        revealAnimation(element, totalDelay);
        break;
      case 'line-reveal':
        lineRevealAnimation(element, totalDelay);
        break;
      default:
        console.warn(`Unknown animation type: ${type}`);
    }
  });
}