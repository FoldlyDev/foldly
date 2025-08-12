'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

interface DemoSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  topBarRef: React.RefObject<HTMLDivElement | null>;
  bottomBarRef: React.RefObject<HTMLDivElement | null>;
  introHeaderRef: React.RefObject<HTMLDivElement | null>;
  imagesRef: React.RefObject<HTMLDivElement | null>;
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
    const spotlightImages = refs.imagesRef.current;
    const maskContainer = refs.maskContainerRef.current;
    const maskImage = refs.maskImageRef.current;
    const spotlightHeader = refs.maskHeaderRef.current?.querySelector('h3');

    if (!section || !spotlightImages || !maskContainer || !maskImage) return;

    // Calculate initial values - matching template exactly
    const containerHeight = spotlightImages.offsetHeight;
    const viewportHeight = window.innerHeight;
    const initialOffset = containerHeight * 0.05;
    const totalMovement = containerHeight + initialOffset + viewportHeight;

    // Split text for mask header animation
    let headerSplit: any = null;
    if (spotlightHeader) {
      headerSplit = SplitText.create(spotlightHeader, {
        type: 'words',
        wordsClass: 'spotlight-word',
      });
      gsap.set(headerSplit.words, { opacity: 0 });
    }

    // Create the main ScrollTrigger animation - matching template exactly
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: `+=${window.innerHeight * 3.5}px`, // Reduced from 7x to 3.5x
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        // Image scrolling animation (0% to 50% of scroll)
        if (progress <= 0.5) {
          const animationProgress = progress / 0.5;
          const startY = 5;
          const endY = -(totalMovement / containerHeight) * 100;
          const currentY = startY + (endY - startY) * animationProgress;
          
          gsap.set(spotlightImages, {
            y: `${currentY}%`,
          });
        }

        // Mask reveal animation (25% to 75% of scroll)
        if (progress >= 0.25 && progress <= 0.75) {
          const maskProgress = (progress - 0.25) / 0.5;
          const maskSize = `${maskProgress * 475}%`;
          const imageScale = 1.25 - maskProgress * 0.25;

          maskContainer.style.setProperty('-webkit-mask-size', maskSize);
          maskContainer.style.setProperty('mask-size', maskSize);

          gsap.set(maskImage, {
            scale: imageScale,
          });
        } else if (progress < 0.25) {
          maskContainer.style.setProperty('-webkit-mask-size', '0%');
          maskContainer.style.setProperty('mask-size', '0%');
          gsap.set(maskImage, {
            scale: 1.25,
          });
        } else if (progress > 0.75) {
          maskContainer.style.setProperty('-webkit-mask-size', '475%');
          maskContainer.style.setProperty('mask-size', '475%');
          gsap.set(maskImage, {
            scale: 1,
          });
        }

        // Text reveal animation (75% to 95% of scroll)
        if (headerSplit && headerSplit.words.length > 0) {
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
        }
      },
    });

    // Cleanup
    return () => {
      if (headerSplit) {
        headerSplit.revert();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isEnabled, refs]);
}