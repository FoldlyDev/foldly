'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface AboutSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  cardRefs: React.RefObject<HTMLDivElement | null>[];
}

interface UseAboutSectionAnimationProps {
  refs: AboutSectionRefs;
  isEnabled: boolean;
}

export function useAboutSectionAnimation({
  refs,
  isEnabled,
}: UseAboutSectionAnimationProps) {
  useGSAP(() => {
    if (!isEnabled || !refs || !refs.sectionRef) return;

    // Ensure ScrollTrigger is registered
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    } else {
      console.warn('[AboutAnimation] GSAP or ScrollTrigger not available');
      return;
    }

    const section = refs.sectionRef.current;
    const header = refs.headerRef?.current;
    if (!section) return;

    // Simple reveal animation without pinning (matching template)
    const cards = refs.cardRefs?.map(ref => ref.current).filter(Boolean) || [];
    
    // Set initial state
    cards.forEach((card) => {
      if (card) {
        gsap.set(card, {
          opacity: 0,
          y: 30,
        });
      }
    });

    // Animate cards on enter
    cards.forEach((card, index) => {
      if (!card) return;

      ScrollTrigger.create({
        trigger: card,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1,
            ease: 'power2.out',
          });
        },
      });
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (cards.includes(trigger.vars.trigger as HTMLDivElement)) {
          trigger.kill();
        }
      });
    };
  }, [isEnabled, refs]);
}