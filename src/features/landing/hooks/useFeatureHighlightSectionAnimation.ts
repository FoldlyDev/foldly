'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

interface FeatureHighlightSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLHeadingElement | null>;
  stripRefs: React.RefObject<HTMLDivElement | null>[];
}

interface UseFeatureHighlightSectionAnimationProps {
  refs: FeatureHighlightSectionRefs;
  isEnabled: boolean;
  isMobile?: boolean;
}

export function useFeatureHighlightSectionAnimation({
  refs,
  isEnabled,
  isMobile: isMobileProp,
}: UseFeatureHighlightSectionAnimationProps) {
  useGSAP(() => {
    if (!isEnabled || !refs || !refs.sectionRef) return;

    // Ensure ScrollTrigger and SplitText are registered
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof SplitText !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger, SplitText);
    } else {
      console.warn('[FeatureHighlightAnimation] GSAP plugins not available');
      return;
    }

    const section = refs.sectionRef.current;
    const header = refs.headerRef?.current;
    const strips = refs.stripRefs?.map(ref => ref.current).filter(Boolean) || [];

    if (!section || !header || strips.length === 0) return;

    // Split text for header animation (matching template)
    let headerSplit: any = null;
    if (header) {
      headerSplit = SplitText.create(header, {
        type: 'words',
        wordsClass: 'highlight-word',
      });
      gsap.set(headerSplit.words, { opacity: 0 });
    }

    // Use passed isMobile or fallback to standard breakpoint
    const isMobile = isMobileProp !== undefined ? isMobileProp : window.innerWidth < 768;

    // Strip movement speeds (matching template)
    const stripSpeeds = [0.3, 0.4, 0.25, 0.35, 0.2, 0.25];

    // Calculate responsive scroll distance
    const textRevealDistance = isMobile 
      ? window.innerHeight * 0.5  // Much shorter on mobile
      : window.innerHeight * 1;    // Desktop distance

    // Create pinned scroll animation for text reveal (matching template exactly)
    const textRevealTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${textRevealDistance}px`,
      pin: true,
      pinSpacing: true,
      scrub: isMobile ? 0.5 : 1,
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Text reveal animation (25% to 75% of scroll) - matching template
        if (headerSplit && headerSplit.words.length > 0) {
          if (progress >= 0.25 && progress <= 0.75) {
            const textProgress = (progress - 0.25) / 0.5;
            const totalWords = headerSplit.words.length;
            
            headerSplit.words.forEach((word: HTMLElement, index: number) => {
              const wordRevealProgress = index / totalWords;
              if (textProgress >= wordRevealProgress) {
                gsap.set(word, { opacity: 1 });
              } else {
                gsap.set(word, { opacity: 0 });
              }
            });
          } else if (progress < 0.25) {
            gsap.set(headerSplit.words, { opacity: 0 });
          } else if (progress > 0.75) {
            gsap.set(headerSplit.words, { opacity: 1 });
          }
        }
      },
    });

    // Calculate responsive scroll distance for strips
    const stripMovementDistance = isMobile 
      ? window.innerHeight * 1    // Much shorter on mobile
      : window.innerHeight * 2;   // Desktop distance

    // Create strip movement animation (separate trigger - matching template)
    const stripMovementTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: `+=${stripMovementDistance}px`,
      scrub: isMobile ? 0.5 : 1,
      onUpdate: (self) => {
        const progress = self.progress;
        
        strips.forEach((strip, index) => {
          if (strip && stripSpeeds[index] !== undefined) {
            const speed = stripSpeeds[index];
            const movement = progress * 100 * speed;
            
            gsap.set(strip, {
              x: `${movement}%`,
            });
          }
        });
      },
    });

    // Cleanup
    return () => {
      if (headerSplit) {
        headerSplit.revert();
      }
      textRevealTrigger.kill();
      stripMovementTrigger.kill();
    };
  }, {
    dependencies: [isEnabled, refs],
    scope: refs.sectionRef?.current,
    revertOnUpdate: true
  } as any);
}