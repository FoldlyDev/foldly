'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
import { smoothStep } from './useLenisScroll';

interface HeroAnimationRefs {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCardsRef: React.RefObject<HTMLDivElement | null>;
  heroCard1Ref: React.RefObject<HTMLDivElement | null>;
  heroCard2Ref: React.RefObject<HTMLDivElement | null>;
  heroCard3Ref: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for managing Hero section GSAP animations
 * Handles initial card animations and scroll-triggered parallax effects
 */
export function useHeroSectionAnimation(refs: HeroAnimationRefs) {
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    if (typeof window === 'undefined') return;

    // Check if all required refs are available
    const requiredRefs = Object.values(refs);
    const allRefsReady = requiredRefs.every(ref => ref.current !== null);

    if (!allRefsReady) return;

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, CustomEase);

    // Create custom ease
    CustomEase.create('hop', '.8, 0, .3, 1');

    // Initial hero cards scale animation (from 0 to 1)
    const heroCardRefs = [
      refs.heroCard1Ref,
      refs.heroCard2Ref,
      refs.heroCard3Ref,
    ];

    // Set transform origin for cards
    heroCardRefs.forEach(ref => {
      if (ref.current) {
        gsap.set(ref.current, { transformOrigin: "center center", scale: 0 });
      }
    });
    
    // Initial scale animation matching Juno Watts
    gsap.to(heroCardRefs.map(ref => ref.current).filter(Boolean), {
      scale: 1,
      duration: 0.75,
      delay: 0.25,
      stagger: 0.1,
      ease: "power4.out",
      onComplete: () => {
        if (refs.heroCard1Ref.current) gsap.set(refs.heroCard1Ref.current, { transformOrigin: "top right" });
        if (refs.heroCard3Ref.current) gsap.set(refs.heroCard3Ref.current, { transformOrigin: "top left" });
      }
    });

    // Desktop animations only
    if (window.innerWidth > 1000) {
      // Hero cards scroll animation
      const heroScrollTrigger = ScrollTrigger.create({
        trigger: refs.heroRef.current,
        start: 'top top',
        end: '75% top',
        scrub: 1,
        onUpdate: self => {
          const progress = self.progress;

          // Container opacity animation
          const heroCardsContainerOpacity = gsap.utils.interpolate(
            1,
            0.5,
            smoothStep(progress)
          );

          if (refs.heroCardsRef.current) {
            gsap.set(refs.heroCardsRef.current, {
              opacity: heroCardsContainerOpacity,
            });
          }

          // Individual card animations
          const heroCardRefs = [
            refs.heroCard1Ref,
            refs.heroCard2Ref,
            refs.heroCard3Ref,
          ];

          heroCardRefs.forEach((cardRef, index) => {
            if (!cardRef.current) return;

            const delay = index * 0.9;
            const cardProgress = gsap.utils.clamp(
              0,
              1,
              (progress - delay * 0.1) / (1 - delay * 0.1)
            );

            const y = gsap.utils.interpolate(
              '0%',
              '400%',
              smoothStep(cardProgress)
            );
            const scale = gsap.utils.interpolate(
              1,
              0.75,
              smoothStep(cardProgress)
            );

            let x = '0%';
            let rotation = 0;
            
            // Side cards move and rotate
            if (index === 0) {
              x = gsap.utils.interpolate('0%', '90%', smoothStep(cardProgress));
              rotation = gsap.utils.interpolate(
                0,
                -15,
                smoothStep(cardProgress)
              );
            } else if (index === 2) {
              x = gsap.utils.interpolate(
                '0%',
                '-90%',
                smoothStep(cardProgress)
              );
              rotation = gsap.utils.interpolate(
                0,
                15,
                smoothStep(cardProgress)
              );
            }

            gsap.set(cardRef.current, {
              y: y,
              x: x,
              rotation: rotation,
              scale: scale,
            });
          });
        },
      });

      scrollTriggersRef.current.push(heroScrollTrigger);
    }

    isInitialized.current = true;

    // Cleanup function
    return () => {
      scrollTriggersRef.current.forEach(trigger => trigger.kill());
      scrollTriggersRef.current = [];
      isInitialized.current = false;
    };
  }, [refs]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      scrollTriggersRef.current.forEach(trigger => trigger.kill());
    };
  }, []);
}