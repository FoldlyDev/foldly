'use client';

import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

let splitInstances: SplitText[] = [];

function getTextContent(element: HTMLElement): string {
  return element.textContent || element.innerText || '';
}

export function scrambleAnimation(element: HTMLElement, delay = 0): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

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
    scrambleTextStaggered(split.chars as HTMLElement[], 0.4);
  }, delay * 1000);
}

export function lineRevealAnimation(element: HTMLElement, delay = 0): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  const textContent = getTextContent(element);
  if (!textContent.trim()) return;

  const split = new SplitText(element, {
    type: 'lines',
    linesClass: 'line-mask',
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

function scrambleTextStaggered(elements: HTMLElement[], duration = 0.4): void {
  elements.forEach((char, index) => {
    setTimeout(() => {
      scrambleText([char], duration);
    }, index * 30);
  });
}

function scrambleText(elements: HTMLElement[], duration = 0.4): void {
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
}

export function initTextAnimations(): void {
  if (typeof window === 'undefined' || window.innerWidth < 1200) return;

  // Wait for fonts to load
  if (document.fonts) {
    document.fonts.ready.then(() => {
      processAnimations();
    });
  } else {
    // Fallback for browsers that don't support document.fonts
    setTimeout(processAnimations, 100);
  }
}

function processAnimations(): void {
  const animatedElements = document.querySelectorAll('[data-animate-type]');
  const sectionsWithScrollElements = new Set<Element>();
  const sectionObservers = new Map<Element, IntersectionObserver>();

  animatedElements.forEach((element) => {
    const animationType = element.getAttribute('data-animate-type');
    const delay = parseFloat(element.getAttribute('data-animate-delay') || '0');
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
                  const elDelay = parseFloat(el.getAttribute('data-animate-delay') || '0');

                  gsap.set(el, { opacity: 1 });

                  switch (elAnimationType) {
                    case 'scramble':
                      scrambleAnimation(el as HTMLElement, elDelay);
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
      // Immediate animations
      switch (animationType) {
        case 'scramble':
          scrambleAnimation(element as HTMLElement, delay);
          break;
        case 'line-reveal':
          lineRevealAnimation(element as HTMLElement, delay);
          break;
      }
    }
  });
}

export function cleanupTextAnimations(): void {
  splitInstances.forEach((split) => {
    split.revert();
  });
  splitInstances = [];
}

// CSS for line-reveal mask
export const lineRevealStyles = `
  .line-mask {
    overflow: hidden;
  }
`;