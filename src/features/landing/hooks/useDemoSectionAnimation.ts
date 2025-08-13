'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

interface DemoSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  topBarRef: React.RefObject<HTMLDivElement | null>;
  bottomBarRef: React.RefObject<HTMLDivElement | null>;
  stickyCardsHeaderRef: React.RefObject<HTMLDivElement | null>;
  galleryCardsRef: React.RefObject<HTMLDivElement[]>;
  maskContainerRef: React.RefObject<HTMLDivElement | null>;
  maskImageRef: React.RefObject<HTMLDivElement | null>;
  maskHeaderRef: React.RefObject<HTMLDivElement | null>;
}

interface UseDemoSectionAnimationProps {
  refs: DemoSectionRefs;
  isEnabled: boolean;
}

export function useDemoSectionAnimation({
  refs,
  isEnabled,
}: UseDemoSectionAnimationProps) {
  useEffect(() => {
    if (!isEnabled || !refs) return;

    // GSAP plugins are registered by the orchestrator

    const section = refs.sectionRef.current;
    const galleryCards = refs.galleryCardsRef.current;
    const maskContainer = refs.maskContainerRef.current;
    const maskImage = refs.maskImageRef.current;
    const spotlightHeader = refs.maskHeaderRef.current?.querySelector('h3');

    if (!section || galleryCards.length === 0) return;

    // Mobile optimizations
    const isMobile = window.innerWidth < 1200;
    const scrollMultiplier = isMobile ? 0.6 : 1; // Shorter scroll distance on mobile

    // Setup gallery cards initial positions and rotations
    const rotations = isMobile ? [0, 0, 0, 0, 0, 0] : [-12, 10, -5, 5, -5, -2]; // No rotation on mobile
    
    galleryCards.forEach((galleryCard, index) => {
      gsap.set(galleryCard, {
        y: window.innerHeight,
        rotate: rotations[index] || 0,
        willChange: 'transform', // Optimize for animation
      });
    });

    // Split text for mask header animation (skip on mobile)
    let headerSplit: any = null;
    if (spotlightHeader && !isMobile) {
      headerSplit = SplitText.create(spotlightHeader, {
        type: 'words',
        wordsClass: 'spotlight-word',
      });
      gsap.set(headerSplit.words, { opacity: 0 });
    }

    // Create the unified animation - optimized for mobile
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${window.innerHeight * 7 * scrollMultiplier}px`, // Shorter on mobile
      pin: true,
      pinSpacing: true,
      scrub: isMobile ? 0.5 : 1, // Smoother scrub on mobile
      onUpdate: (self) => {
        const progress = self.progress;
        
        // Gallery cards animation (0% to 60% of scroll)
        if (progress <= 0.6) {
          const galleryProgress = progress / 0.6;
          const totalCards = galleryCards.length;
          const progressPerCard = 1 / totalCards;

          galleryCards.forEach((galleryCard, index) => {
            const galleryCardStart = index * progressPerCard;
            let galleryCardProgress =
              (galleryProgress - galleryCardStart) / progressPerCard;
            galleryCardProgress = Math.min(Math.max(galleryCardProgress, 0), 1);

            let yPos = window.innerHeight * (1 - galleryCardProgress);
            let xPos = 0;

            if (galleryCardProgress === 1 && index < totalCards - 1) {
              const remainingProgress =
                (galleryProgress - (galleryCardStart + progressPerCard)) /
                (1 - (galleryCardStart + progressPerCard));
              if (remainingProgress > 0) {
                const distanceMultiplier = 1 - index * 0.15;
                xPos =
                  -window.innerWidth * 0.3 * distanceMultiplier * remainingProgress;
                yPos =
                  -window.innerHeight *
                  0.3 *
                  distanceMultiplier *
                  remainingProgress;
              }
            }

            gsap.to(galleryCard, {
              y: yPos,
              x: isMobile ? 0 : xPos, // No horizontal movement on mobile
              duration: 0,
              ease: 'none',
              force3D: true, // Force hardware acceleration
            });
          });
        }

        // Mask reveal animation (50% to 85% of scroll) - starts later for better transition
        if (maskContainer && maskImage) {
          if (progress >= 0.5 && progress <= 0.85) {
            const maskProgress = (progress - 0.5) / 0.35;
            const maskSize = `${maskProgress * 475}%`;
            const imageScale = 1.25 - maskProgress * 0.25;

            maskContainer.style.setProperty('-webkit-mask-size', maskSize);
            maskContainer.style.setProperty('mask-size', maskSize);

            gsap.set(maskImage, {
              scale: imageScale,
            });
          } else if (progress < 0.5) {
            maskContainer.style.setProperty('-webkit-mask-size', '0%');
            maskContainer.style.setProperty('mask-size', '0%');
            gsap.set(maskImage, {
              scale: 1.25,
            });
          } else if (progress > 0.85) {
            maskContainer.style.setProperty('-webkit-mask-size', '475%');
            maskContainer.style.setProperty('mask-size', '475%');
            gsap.set(maskImage, {
              scale: 1,
            });
          }
        }

        // Text reveal animation (75% to 95% of scroll) - skip on mobile
        if (!isMobile && headerSplit && headerSplit.words.length > 0) {
          if (progress >= 0.75 && progress <= 0.95) {
            const textProgress = (progress - 0.75) / 0.2;
            const totalWords = headerSplit.words.length;

            headerSplit.words.forEach((word: HTMLElement, index: number) => {
              const wordRevealProgress = index / totalWords;
              
              if (textProgress >= wordRevealProgress) {
                gsap.set(word, { opacity: 1 });
              } else {
                gsap.set(word, { opacity: 0 });
              }
            });
          } else if (progress < 0.75) {
            gsap.set(headerSplit.words, { opacity: 0 });
          } else if (progress > 0.95) {
            gsap.set(headerSplit.words, { opacity: 1 });
          }
        } else if (isMobile && spotlightHeader) {
          // Simple fade in for mobile
          if (progress >= 0.75) {
            gsap.set(spotlightHeader, { opacity: 1 });
          } else {
            gsap.set(spotlightHeader, { opacity: 0 });
          }
        }
      },
    });


    // Cleanup
    return () => {
      // Reset will-change to auto
      galleryCards.forEach((card) => {
        gsap.set(card, { willChange: 'auto' });
      });
      
      if (headerSplit) {
        headerSplit.revert();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isEnabled, refs]);
}