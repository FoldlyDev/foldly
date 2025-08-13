'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface IntroAnimationRefs {
  introRef: React.RefObject<HTMLElement | null>;
  heroHeaderRef: React.RefObject<HTMLDivElement | null>;
  animatedIconsRef: React.RefObject<HTMLDivElement | null>;
  iconRefs: React.RefObject<HTMLDivElement | null>[];
  textSegmentRefs: React.RefObject<HTMLSpanElement | null>[];
  placeholderIconRefs: React.RefObject<HTMLDivElement | null>[];
  duplicateIconsContainerRef: React.RefObject<HTMLDivElement | null>;
  isEnabled?: boolean;
  registerScrollTrigger?: (st: ScrollTrigger) => void;
  registerCleanup?: (fn: () => void) => void;
  prefersReducedMotion?: boolean;
}

export function useIntroSectionAnimation(refs: IntroAnimationRefs) {
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const duplicateIconsRef = useRef<HTMLDivElement[]>([]);

  useGSAP(() => {
    if (typeof window === 'undefined') return;
    if (!refs.isEnabled) return;
    if (refs.prefersReducedMotion) return; // Skip animations if reduced motion is preferred
    
    // Check if all required refs are available
    const allRefsReady =
      refs.introRef?.current &&
      refs.heroHeaderRef?.current &&
      refs.animatedIconsRef?.current &&
      refs.iconRefs?.every(ref => ref.current) &&
      refs.textSegmentRefs?.every(ref => ref.current) &&
      refs.placeholderIconRefs?.every(ref => ref.current) &&
      refs.duplicateIconsContainerRef?.current;

    if (!allRefsReady) return;

    // GSAP should already be registered by the orchestrator

    const animatedIcons = refs.animatedIconsRef.current;
    const iconElements = refs.iconRefs.map(ref => ref.current!);
    const textSegments = refs.textSegmentRefs.map(ref => ref.current!);
    const placeholders = refs.placeholderIconRefs.map(ref => ref.current!);
    const heroHeader = refs.heroHeaderRef.current;
    const heroSection = refs.introRef.current;
    const duplicateContainer = refs.duplicateIconsContainerRef.current!;

    // Initialize background color to dark (initial state) - using our custom color
    if (heroSection) {
      heroSection.style.backgroundColor = '#020618';
    }

    // Text segments should start invisible as per original design
    textSegments.forEach(segment => {
      gsap.set(segment, { opacity: 0 });
    });

    // Create randomized text animation order (exact same logic as template)
    const textAnimationOrder: {
      segment: HTMLSpanElement;
      originalIndex: number;
    }[] = [];
    textSegments.forEach((segment, index) => {
      textAnimationOrder.push({ segment, originalIndex: index });
    });

    // Fisher-Yates shuffle
    for (let i = textAnimationOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = textAnimationOrder[i]!;
      const tempJ = textAnimationOrder[j]!;
      textAnimationOrder[i] = tempJ;
      textAnimationOrder[j] = temp;
    }

    // Calculate icon sizing
    const isMobile = window.innerWidth <= 1000;
    const headerIconSize = isMobile ? 30 : 60;
    const currentIconSize =
      iconElements[0]?.getBoundingClientRect().width || 60;
    const exactScale = headerIconSize / currentIconSize;

    try {
      // Create the main scroll trigger animation
      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: `+=${window.innerHeight * 2.5}px`, // Reduced from 4x to 2.5x for faster animation
        pin: true,
        pinSpacing: true,
        anticipatePin: 1, // Helps prevent jumping with smooth scroll
        scrub: 1, // Match reference template timing
        onUpdate: self => {
          const progress = self.progress;

          // Always reset text segments opacity (matching template behavior)
          textSegments.forEach(segment => {
            gsap.set(segment, { opacity: 0 });
          });

          if (progress <= 0.3) {
            // Phase 1: Move icons up from bottom
            const moveProgress = progress / 0.3;
            const containerMoveY = -window.innerHeight * 0.3 * moveProgress;

            // Clean up duplicate icons if scrolling back
            if (duplicateIconsRef.current.length > 0) {
              duplicateIconsRef.current.forEach(duplicate => {
                if (duplicate.parentNode) {
                  duplicate.parentNode.removeChild(duplicate);
                }
              });
              duplicateIconsRef.current = [];
            }

            // Hero header fade out
            if (progress <= 0.15) {
              const headerProgress = progress / 0.15;
              const headerMoveY = -50 * headerProgress;
              const headerOpacity = 1 - headerProgress;

              gsap.set(heroHeader, {
                transform: `translate(-50%, calc(-50% + ${headerMoveY}px))`,
                opacity: headerOpacity,
              });
            } else {
              gsap.set(heroHeader, {
                transform: `translate(-50%, calc(-50% + -50px))`,
                opacity: 0,
              });
            }

            gsap.set(animatedIcons, {
              x: 0,
              y: containerMoveY,
              scale: 1,
              opacity: 1,
            });

            // Individual icon staggered animation
            iconElements.forEach((icon, index) => {
              const staggerDelay = index * 0.1;
              const iconStart = staggerDelay;
              const iconEnd = staggerDelay + 0.5;

              const iconProgress = gsap.utils.mapRange(
                iconStart,
                iconEnd,
                0,
                1,
                moveProgress
              );
              const clampedProgress = Math.max(0, Math.min(1, iconProgress));

              const startOffset = -containerMoveY;
              const individualY = startOffset * (1 - clampedProgress);

              gsap.set(icon, {
                x: 0,
                y: individualY,
              });
            });
          } else if (progress <= 0.6) {
            // Phase 2: Scale and center icons
            const scaleProgress = (progress - 0.3) / 0.3;

            gsap.set(heroHeader, {
              transform: `translate(-50%, calc(-50% + -50px))`,
              opacity: 0,
            });

            // Background color transition
            if (scaleProgress >= 0.5) {
              if (heroSection) heroSection.style.backgroundColor = '#5a6169';
            } else {
              if (heroSection) heroSection.style.backgroundColor = '#020618';
            }

            // Clean up duplicate icons if they exist
            if (duplicateIconsRef.current.length > 0) {
              duplicateIconsRef.current.forEach(duplicate => {
                if (duplicate.parentNode) {
                  duplicate.parentNode.removeChild(duplicate);
                }
              });
              duplicateIconsRef.current = [];
            }

            // Calculate centering
            const targetCenterY = window.innerHeight / 2;
            const targetCenterX = window.innerWidth / 2;
            const containerRect = animatedIcons!.getBoundingClientRect();
            const currentCenterX = containerRect.left + containerRect.width / 2;
            const currentCenterY = containerRect.top + containerRect.height / 2;
            const deltaX = (targetCenterX - currentCenterX) * scaleProgress;
            const deltaY = (targetCenterY - currentCenterY) * scaleProgress;
            const baseY = -window.innerHeight * 0.3;
            const currentScale = 1 + (exactScale - 1) * scaleProgress;

            gsap.set(animatedIcons, {
              x: deltaX,
              y: baseY + deltaY,
              scale: currentScale,
              opacity: 1,
            });

            iconElements.forEach(icon => {
              gsap.set(icon, { x: 0, y: 0 });
            });
          } else if (progress <= 0.75) {
            // Phase 3: Move icons to placeholders (with cloning)
            const moveProgress = (progress - 0.6) / 0.15;
            const fadeOutProgress = 1 - moveProgress; // For reverse scrolling

            gsap.set(heroHeader, {
              transform: `translate(-50%, calc(-50% + -50px))`,
              opacity: 0,
            });

            if (heroSection) heroSection.style.backgroundColor = '#e3e3db';

            // Hide original icons container
            const targetCenterY = window.innerHeight / 2;
            const targetCenterX = window.innerWidth / 2;
            const containerRect = animatedIcons!.getBoundingClientRect();
            const currentCenterX = containerRect.left + containerRect.width / 2;
            const currentCenterY = containerRect.top + containerRect.height / 2;
            const deltaX = targetCenterX - currentCenterX;
            const deltaY = targetCenterY - currentCenterY;
            const baseY = -window.innerHeight * 0.3;

            gsap.set(animatedIcons, {
              x: deltaX,
              y: baseY + deltaY,
              scale: exactScale,
              opacity: 0,
            });

            iconElements.forEach(icon => {
              gsap.set(icon, { x: 0, y: 0 });
            });

            // Create duplicate icons if not already created
            if (duplicateIconsRef.current.length === 0 && duplicateContainer) {
              iconElements.forEach((icon, index) => {
                if (index < placeholders.length) {
                  const duplicate = icon.cloneNode(true) as HTMLDivElement;
                  duplicate.className = 'intro-duplicate-icon';
                  duplicate.style.position = 'absolute';
                  duplicate.style.width = headerIconSize + 'px';
                  duplicate.style.height = headerIconSize + 'px';
                  duplicate.style.zIndex = '10';
                  duplicate.style.opacity = '0'; // Start with hidden
                  duplicate.style.display = 'none'; // Initially hidden

                  // Apply dark gradient to duplicate icons
                  const svg = duplicate.querySelector('svg');
                  if (svg) {
                    svg.style.stroke = 'url(#icon-gradient-dark)';
                    svg.style.fill = 'none'; // Ensure no fill
                  }

                  // Append to the container instead of document.body
                  duplicateContainer.appendChild(duplicate);
                  duplicateIconsRef.current.push(duplicate);
                }
              });
            }

            // Animate duplicate icons to placeholders
            duplicateIconsRef.current.forEach((duplicate, index) => {
              if (index < placeholders.length) {
                const iconRect = iconElements[index]?.getBoundingClientRect();
                if (!iconRect) return;
                const startCenterX = iconRect.left + iconRect.width / 2;
                const startCenterY = iconRect.top + iconRect.height / 2;
                // Since container is fixed positioned, we use viewport coordinates
                const startPageX = startCenterX;
                const startPageY = startCenterY;

                const targetRect = placeholders[index]?.getBoundingClientRect();
                if (!targetRect) return;
                const targetCenterX = targetRect.left + targetRect.width / 2;
                const targetCenterY = targetRect.top + targetRect.height / 2;
                // Since container is fixed positioned, we use viewport coordinates
                const targetPageX = targetCenterX;
                const targetPageY = targetCenterY;

                const moveX = targetPageX - startPageX;
                const moveY = targetPageY - startPageY;

                let currentX = 0;
                let currentY = 0;

                if (moveProgress <= 0.5) {
                  const verticalProgress = moveProgress / 0.5;
                  currentY = moveY * verticalProgress;
                } else {
                  const horizontalProgress = (moveProgress - 0.5) / 0.5;
                  currentY = moveY;
                  currentX = moveX * horizontalProgress;
                }

                const finalPageX = startPageX + currentX;
                const finalPageY = startPageY + currentY;

                duplicate.style.left = (finalPageX - headerIconSize / 2) + 'px';
                duplicate.style.top = (finalPageY - headerIconSize / 2) + 'px';
                // Set icons to full opacity immediately (matching template)
                duplicate.style.opacity = '1';
                duplicate.style.display = 'flex';
              }
            });
          } else {
            // Phase 4: Keep duplicate icons in place and reveal text segments
            gsap.set(heroHeader, {
              transform: `translate(-50%, calc(-50% + -100px))`,
              opacity: 0,
            });

            if (heroSection) heroSection.style.backgroundColor = '#e3e3db';

            gsap.set(animatedIcons, { opacity: 0 });

            // Keep duplicate icons positioned at placeholders with fade consideration
            duplicateIconsRef.current.forEach((duplicate, index) => {
              if (index < placeholders.length) {
                const targetRect = placeholders[index]?.getBoundingClientRect();
                if (!targetRect) return;
                const targetCenterX = targetRect.left + targetRect.width / 2;
                const targetCenterY = targetRect.top + targetRect.height / 2;
                // Since container is fixed positioned, we use viewport coordinates
                const targetPageX = targetCenterX;
                const targetPageY = targetCenterY;

                duplicate.style.left = (targetPageX - headerIconSize / 2) + 'px';
                duplicate.style.top = (targetPageY - headerIconSize / 2) + 'px';

                // Keep icons fully visible in phase 4 (matching template behavior)
                duplicate.style.opacity = '1';
                duplicate.style.display = 'flex';
              }
            });

            // Animate text segments in random order with fade consideration
            textAnimationOrder.forEach((item, randomIndex) => {
              const segmentStart = 0.75 + randomIndex * 0.03;
              const segmentEnd = segmentStart + 0.015;

              const segmentProgress = gsap.utils.mapRange(
                segmentStart,
                segmentEnd,
                0,
                1,
                progress
              );
              const clampedProgress = Math.max(0, Math.min(1, segmentProgress));

              // Check if we're near the beginning (for fade-out when scrolling back)
              const fadeOutStart = 0.75; // Match icon fade-out threshold
              let finalOpacity = clampedProgress;

              if (progress < fadeOutStart) {
                // Fade out smoothly as we scroll back
                const fadeRange = 0.05; // Same fade range as icons
                const fadeOutProgress = Math.max(0, (progress - (fadeOutStart - fadeRange)) / fadeRange);
                finalOpacity = clampedProgress * fadeOutProgress;
              }

              gsap.set(item.segment, {
                opacity: finalOpacity,
              });
            });
          }
        },
      });
      
      // Register with orchestrator if available
      if (refs.registerScrollTrigger && scrollTriggerRef.current) {
        refs.registerScrollTrigger(scrollTriggerRef.current);
      }
    } catch (error) {
      console.error('[IntroAnimation] Failed to create animation:', error);
    }

    // Cleanup function for useGSAP
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      // Clean up duplicate icons
      duplicateIconsRef.current.forEach(duplicate => {
        duplicate?.remove();
      });
      duplicateIconsRef.current = [];
    };
  }, {
    dependencies: [refs.isEnabled, refs],
    scope: refs.introRef,
    revertOnUpdate: true
  });
}
