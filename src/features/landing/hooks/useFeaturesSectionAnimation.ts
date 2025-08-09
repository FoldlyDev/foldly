'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { smoothStep } from './useLenisScroll';

interface FeaturesAnimationRefs {
  featuresRef: React.RefObject<HTMLElement | null>;
  featuresHeaderRef: React.RefObject<HTMLDivElement | null>;
  card1Ref: React.RefObject<HTMLDivElement | null>;
  card2Ref: React.RefObject<HTMLDivElement | null>;
  card3Ref: React.RefObject<HTMLDivElement | null>;
  flipCard1InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard2InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard3InnerRef: React.RefObject<HTMLDivElement | null>;
  isEnabled?: boolean; // Control when animation should start
}

/**
 * Hook for managing Features section GSAP animations
 * Handles section pinning, header animation, and flip card animations
 */
export function useFeaturesSectionAnimation(refs: FeaturesAnimationRefs) {
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    if (typeof window === 'undefined') return;
    
    // Wait for animation to be enabled by orchestrator
    if (!refs.isEnabled) return;

    // Check if all required refs are available (excluding isEnabled)
    const requiredRefs = Object.values(refs).filter(ref => ref !== refs.isEnabled);
    const allRefsReady = requiredRefs.every(ref => ref && ref.current !== null);

    if (!allRefsReady) return;

    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Desktop animations only
    if (window.innerWidth > 1000) {
      // Create a context for better cleanup
      const ctx = gsap.context(() => {
        // Features section pinning
        const featuresPinTrigger = ScrollTrigger.create({
          trigger: refs.featuresRef.current,
          start: 'top top',
          end: `+=${window.innerHeight * 4}px`,
          pin: refs.featuresRef.current,
          pinSpacing: true,
          anticipatePin: 1,
          id: 'features-pin',
        });

        scrollTriggersRef.current.push(featuresPinTrigger);

        // Cards and header animation - delayed to avoid conflicts
        const cardsScrollTrigger = ScrollTrigger.create({
          trigger: refs.featuresRef.current,
          start: 'top center', // Start when section is more centered
          end: 'bottom top+=400px',
          scrub: 1,
          id: 'features-cards',
          invalidateOnRefresh: true,
          onUpdate: self => {
            const progress = self.progress;

          // Header animation - matching Juno Watts
          const headerProgress = gsap.utils.clamp(0, 1, progress / 0.9);
          const headerY = gsap.utils.interpolate(
            '300%',
            '0%',
            smoothStep(headerProgress)
          );

          if (refs.featuresHeaderRef.current) {
            gsap.set(refs.featuresHeaderRef.current, {
              y: headerY,
            });
          }

          // Card references
          const cardRefs = [refs.card1Ref, refs.card2Ref, refs.card3Ref];
          const flipCardInnerRefs = [
            refs.flipCard1InnerRef,
            refs.flipCard2InnerRef,
            refs.flipCard3InnerRef,
          ];

          // Animate each card
          cardRefs.forEach((cardRef, index) => {
            if (!cardRef.current) return;

            const delay = index * 0.5;
            const cardProgress = gsap.utils.clamp(
              0,
              1,
              (progress - delay * 0.1) / (0.9 - delay * 0.1)
            );

            const innerCard = flipCardInnerRefs[index]?.current;

            // Y position animation with multiple phases
            let y: string;
            if (cardProgress < 0.4) {
              const normalizedProgress = cardProgress / 0.4;
              y = gsap.utils.interpolate(
                '-100%',
                '50%',
                smoothStep(normalizedProgress)
              );
            } else if (cardProgress < 0.6) {
              const normalizedProgress = (cardProgress - 0.4) / 0.2;
              y = gsap.utils.interpolate(
                '50%',
                '0%',
                smoothStep(normalizedProgress)
              );
            } else {
              y = '0%';
            }

            // Scale animation
            let scale: number;
            if (cardProgress < 0.4) {
              const normalizedProgress = cardProgress / 0.4;
              scale = gsap.utils.interpolate(
                0.25,
                0.75,
                smoothStep(normalizedProgress)
              );
            } else if (cardProgress < 0.6) {
              const normalizedProgress = (cardProgress - 0.4) / 0.2;
              scale = gsap.utils.interpolate(
                0.75,
                1,
                smoothStep(normalizedProgress)
              );
            } else {
              scale = 1;
            }

            // Opacity animation
            let opacity: number;
            if (cardProgress < 0.2) {
              const normalizedProgress = cardProgress / 0.2;
              opacity = smoothStep(normalizedProgress);
            } else {
              opacity = 1;
            }

            // X position and rotation animation
            let x: string, rotate: number, rotationY: number;
            if (cardProgress < 0.6) {
              // Cards start spread out
              x = index === 0 ? '100%' : index === 1 ? '0%' : '-100%';
              rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
              rotationY = 0;
            } else if (cardProgress < 1) {
              // Cards move to center and flip
              const normalizedProgress = (cardProgress - 0.6) / 0.4;
              x = gsap.utils.interpolate(
                index === 0 ? '100%' : index === 1 ? '0%' : '-100%',
                '0%',
                smoothStep(normalizedProgress)
              );
              rotate = gsap.utils.interpolate(
                index === 0 ? -5 : index === 1 ? 0 : 5,
                0,
                smoothStep(normalizedProgress)
              );
              rotationY = smoothStep(normalizedProgress) * 180;
            } else {
              // Final position
              x = '0%';
              rotate = 0;
              rotationY = 180;
            }

            // Apply transforms to card
            gsap.set(cardRef.current, {
              opacity: opacity,
              y: y,
              x: x,
              rotate: rotate,
              scale: scale,
            });

            // Apply flip to inner card
            if (innerCard) {
              gsap.set(innerCard, {
                rotationY: rotationY,
              });
            }
          });
        },
      });

          scrollTriggersRef.current.push(cardsScrollTrigger);
      });

      // Store context for cleanup
      isInitialized.current = true;
      
      return () => {
        ctx.revert();
        scrollTriggersRef.current.forEach(trigger => trigger.kill());
        scrollTriggersRef.current = [];
        isInitialized.current = false;
      };
    }
  }, [refs.isEnabled]); // Re-run when isEnabled changes

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      scrollTriggersRef.current.forEach(trigger => trigger.kill());
    };
  }, []);
}