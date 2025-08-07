'use client';

import { useEffect, useRef } from 'react';
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
}

export function useIntroSectionAnimation(refs: IntroAnimationRefs) {
  const isInitialized = useRef(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const duplicateIconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (isInitialized.current) return;
    if (typeof window === 'undefined') return;

    // Create a small delay to ensure React has finished rendering
    const timer = setTimeout(() => {
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

      gsap.registerPlugin(ScrollTrigger);

      const animatedIcons = refs.animatedIconsRef.current;
      const iconElements = refs.iconRefs.map(ref => ref.current!);
      const textSegments = refs.textSegmentRefs.map(ref => ref.current!);
      const placeholders = refs.placeholderIconRefs.map(ref => ref.current!);
      const heroHeader = refs.heroHeaderRef.current;
      const heroSection = refs.introRef.current;
      const duplicateContainer = refs.duplicateIconsContainerRef.current!;

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
      const currentIconSize = iconElements[0]?.getBoundingClientRect().width || 60;
      const exactScale = headerIconSize / currentIconSize;

      // Use gsap.context for better cleanup
      const ctx = gsap.context(() => {
        // Create the main scroll trigger animation
        scrollTriggerRef.current = ScrollTrigger.create({
          trigger: heroSection,
          start: 'top top',
          end: `+=${window.innerHeight * 8}px`,
          pin: true,
          pinSpacing: true,
          scrub: 0.8, // Reduced for faster response, smooth easing
          invalidateOnRefresh: true,
          anticipatePin: 0.5, // Reduced for less aggressive pinning
          fastScrollEnd: 3000, // Prevent jumpiness on fast scrolling
          preventOverlaps: true, // Prevent overlap with other ScrollTriggers
          onUpdate: self => {
            const progress = self.progress;

            // Reset text segments opacity
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
              const currentCenterX =
                containerRect.left + containerRect.width / 2;
              const currentCenterY =
                containerRect.top + containerRect.height / 2;
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
              const currentCenterX =
                containerRect.left + containerRect.width / 2;
              const currentCenterY =
                containerRect.top + containerRect.height / 2;
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
              if (duplicateIconsRef.current.length === 0) {
                iconElements.forEach((icon, index) => {
                  if (index < placeholders.length) {
                    const duplicate = icon.cloneNode(true) as HTMLDivElement;
                    duplicate.className = 'intro-duplicate-icon';
                    duplicate.style.position = 'absolute';
                    duplicate.style.width = headerIconSize + 'px';
                    duplicate.style.height = headerIconSize + 'px';
                    duplicate.style.zIndex = '10';

                    document.body.appendChild(duplicate);
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
                  const startPageX = startCenterX + window.pageXOffset;
                  const startPageY = startCenterY + window.pageYOffset;

                  const targetRect = placeholders[index]?.getBoundingClientRect();
                  if (!targetRect) return;
                  const targetCenterX = targetRect.left + targetRect.width / 2;
                  const targetCenterY = targetRect.top + targetRect.height / 2;
                  const targetPageX = targetCenterX + window.pageXOffset;
                  const targetPageY = targetCenterY + window.pageYOffset;

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

                  duplicate.style.left = finalPageX - headerIconSize / 2 + 'px';
                  duplicate.style.top = finalPageY - headerIconSize / 2 + 'px';
                  // Fade in the duplicate icons smoothly
                  const fadeInProgress = Math.max(
                    0,
                    Math.min(1, moveProgress * 2)
                  ); // Faster fade in
                  duplicate.style.opacity = fadeInProgress.toString();
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
                  const targetPageX = targetCenterX + window.pageXOffset;
                  const targetPageY = targetCenterY + window.pageYOffset;

                  duplicate.style.left =
                    targetPageX - headerIconSize / 2 + 'px';
                  duplicate.style.top = targetPageY - headerIconSize / 2 + 'px';

                  // Fade out icons when scrolling back to phase 3
                  const fadeOutStart = 0.65;
                  let iconOpacity = 1;

                  if (progress < fadeOutStart) {
                    // Fade out as we scroll back
                    iconOpacity = progress / fadeOutStart;
                  }

                  duplicate.style.opacity = iconOpacity.toString();
                  duplicate.style.display = iconOpacity > 0 ? 'flex' : 'none';
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
                const clampedProgress = Math.max(
                  0,
                  Math.min(1, segmentProgress)
                );

                // Check if we're near the beginning (for fade-out when scrolling back)
                const fadeOutStart = 0.65;
                let finalOpacity = clampedProgress;

                if (progress < fadeOutStart) {
                  // Fade out as we scroll back towards phase 2
                  const fadeOutProgress = progress / fadeOutStart;
                  finalOpacity = clampedProgress * fadeOutProgress;
                }

                gsap.set(item.segment, {
                  opacity: finalOpacity,
                });
              });
            }
          },
        });
      });

      isInitialized.current = true;

      // Cleanup function
      return () => {
        clearTimeout(timer);
        ctx.revert(); // This will properly clean up all GSAP instances
        if (scrollTriggerRef.current) {
          scrollTriggerRef.current.kill();
          scrollTriggerRef.current = null;
        }
        // Clean up duplicate icons
        duplicateIconsRef.current.forEach(duplicate => {
          if (duplicate.parentNode) {
            duplicate.parentNode.removeChild(duplicate);
          }
        });
        duplicateIconsRef.current = [];
        isInitialized.current = false;
      };
    }, 100); // Small delay to let React settle
  }, [refs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);
}
