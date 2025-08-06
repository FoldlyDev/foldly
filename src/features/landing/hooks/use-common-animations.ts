'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAnimationCleanup } from './use-animation-cleanup';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FadeInOptions {
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;
  y?: number;
}

// Hook for fade-in animations
export function useFadeIn(options: FadeInOptions = {}) {
  const {
    duration = 0.8,
    delay = 0,
    ease = 'power2.out',
    stagger = 0.1,
    y = 20,
  } = options;

  const { registerTween } = useAnimationCleanup();

  const animateElements = useCallback((elements: Element | Element[]) => {
    const tween = gsap.fromTo(
      elements,
      {
        opacity: 0,
        y,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease,
        stagger,
      }
    );

    registerTween(tween);
    return tween;
  }, [duration, delay, ease, stagger, y, registerTween]);

  return { animateElements };
}

interface ParallaxOptions {
  speed?: number;
  offset?: number;
}

// Hook for parallax scrolling effects
export function useParallax(elementRef: React.RefObject<HTMLElement>, options: ParallaxOptions = {}) {
  const { speed = 0.5, offset = 0 } = options;
  const { registerScrollTrigger } = useAnimationCleanup();

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const yPos = -(progress * 100 * speed) + offset;
        gsap.set(element, { y: `${yPos}%` });
      },
    });

    registerScrollTrigger(trigger);
  }, [elementRef, speed, offset, registerScrollTrigger]);
}

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  animationOptions?: FadeInOptions;
}

// Hook for scroll-triggered reveal animations
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    animationOptions = {},
  } = options;

  const { registerObserver } = useAnimationCleanup();
  const { animateElements } = useFadeIn(animationOptions);
  const observedElements = useRef<Set<Element>>(new Set());

  const observe = useCallback((elements: Element | Element[]) => {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !observedElements.current.has(entry.target)) {
            observedElements.current.add(entry.target);
            animateElements(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    elementsArray.forEach((element) => {
      observer.observe(element);
    });

    registerObserver(observer);
    return observer;
  }, [threshold, rootMargin, animateElements, registerObserver]);

  return { observe };
}

interface HoverEffectOptions {
  scale?: number;
  duration?: number;
  ease?: string;
}

// Hook for hover animations
export function useHoverEffect(elementRef: React.RefObject<HTMLElement>, options: HoverEffectOptions = {}) {
  const {
    scale = 1.05,
    duration = 0.3,
    ease = 'power2.out',
  } = options;

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale,
        duration,
        ease,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration,
        ease,
      });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, scale, duration, ease]);
}

interface MagneticEffectOptions {
  strength?: number;
  duration?: number;
}

// Hook for magnetic cursor effect
export function useMagneticEffect(elementRef: React.RefObject<HTMLElement>, options: MagneticEffectOptions = {}) {
  const {
    strength = 0.5,
    duration = 0.3,
  } = options;

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    let bounds: DOMRect;

    const handleMouseMove = (e: MouseEvent) => {
      bounds = element.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration,
        ease: 'power2.out',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration,
        ease: 'elastic.out(1, 0.3)',
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, strength, duration]);
}

// Hook for staggered animations
export function useStaggerAnimation() {
  const { registerTimeline } = useAnimationCleanup();

  const animateStagger = useCallback((
    elements: Element[],
    fromVars: gsap.TweenVars,
    toVars: gsap.TweenVars,
    stagger: number | gsap.StaggerVars = 0.1
  ) => {
    const timeline = gsap.timeline();
    timeline.fromTo(elements, fromVars, {
      ...toVars,
      stagger,
    });

    registerTimeline(timeline);
    return timeline;
  }, [registerTimeline]);

  return { animateStagger };
}