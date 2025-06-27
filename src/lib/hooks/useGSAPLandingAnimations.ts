"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import Lenis from "lenis";

interface AnimationRefs {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCardsRef: React.RefObject<HTMLDivElement | null>;
  heroCard1Ref: React.RefObject<HTMLDivElement | null>;
  heroCard2Ref: React.RefObject<HTMLDivElement | null>;
  heroCard3Ref: React.RefObject<HTMLDivElement | null>;
  servicesRef: React.RefObject<HTMLElement | null>;
  servicesHeaderRef: React.RefObject<HTMLDivElement | null>;
  card1Ref: React.RefObject<HTMLDivElement | null>;
  card2Ref: React.RefObject<HTMLDivElement | null>;
  card3Ref: React.RefObject<HTMLDivElement | null>;
  flipCard1InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard2InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard3InnerRef: React.RefObject<HTMLDivElement | null>;
}

export function useGSAPLandingAnimations(refs: AnimationRefs) {
  const isInitialized = useRef(false);
  const lenisRef = useRef<Lenis | null>(null);
  const scrollTriggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (isInitialized.current) return;
    if (typeof window === "undefined") return;

    // Check if all required refs are available
    const requiredRefs = Object.values(refs);
    const allRefsReady = requiredRefs.every((ref) => ref.current !== null);

    if (!allRefsReady) return;

    gsap.registerPlugin(ScrollTrigger, CustomEase);

    // Custom ease
    CustomEase.create("hop", ".8, 0, .3, 1");

    // Initialize smooth scrolling
    const lenis = new Lenis();
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const smoothStep = (p: number) => p * p * (3 - 2 * p);

    if (window.innerWidth > 1000) {
      // Hero cards animation
      const heroScrollTrigger = ScrollTrigger.create({
        trigger: refs.heroRef.current,
        start: "top top",
        end: "75% top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

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
              "0%",
              "350%",
              smoothStep(cardProgress)
            );
            const scale = gsap.utils.interpolate(
              1,
              0.75,
              smoothStep(cardProgress)
            );

            let x = "0%";
            let rotation = 0;
            if (index === 0) {
              x = gsap.utils.interpolate("0%", "90%", smoothStep(cardProgress));
              rotation = gsap.utils.interpolate(
                0,
                -15,
                smoothStep(cardProgress)
              );
            } else if (index === 2) {
              x = gsap.utils.interpolate(
                "0%",
                "-90%",
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

      // Services section pinning
      const servicesPinTrigger = ScrollTrigger.create({
        trigger: refs.servicesRef.current,
        start: "top top",
        end: `+=${window.innerHeight * 4}px`,
        pin: refs.servicesRef.current,
        pinSpacing: true,
      });

      scrollTriggersRef.current.push(servicesPinTrigger);

      // Cards animation
      const cardsScrollTrigger = ScrollTrigger.create({
        trigger: refs.servicesRef.current,
        start: "top bottom",
        end: `+=${window.innerHeight * 4}`,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          const headerProgress = gsap.utils.clamp(0, 1, progress / 0.9);
          const headerY = gsap.utils.interpolate(
            "400%",
            "0%",
            smoothStep(headerProgress)
          );

          if (refs.servicesHeaderRef.current) {
            gsap.set(refs.servicesHeaderRef.current, {
              y: headerY,
            });
          }

          const cardRefs = [refs.card1Ref, refs.card2Ref, refs.card3Ref];
          const flipCardInnerRefs = [
            refs.flipCard1InnerRef,
            refs.flipCard2InnerRef,
            refs.flipCard3InnerRef,
          ];

          cardRefs.forEach((cardRef, index) => {
            if (!cardRef.current) return;

            const delay = index * 0.5;
            const cardProgress = gsap.utils.clamp(
              0,
              1,
              (progress - delay * 0.1) / (0.9 - delay * 0.1)
            );

            const innerCard = flipCardInnerRefs[index]?.current;

            let y: string;
            if (cardProgress < 0.4) {
              const normalizedProgress = cardProgress / 0.4;
              y = gsap.utils.interpolate(
                "-100%",
                "50%",
                smoothStep(normalizedProgress)
              );
            } else if (cardProgress < 0.6) {
              const normalizedProgress = (cardProgress - 0.4) / 0.2;
              y = gsap.utils.interpolate(
                "50%",
                "0%",
                smoothStep(normalizedProgress)
              );
            } else {
              y = "0%";
            }

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

            let opacity: number;
            if (cardProgress < 0.2) {
              const normalizedProgress = cardProgress / 0.2;
              opacity = smoothStep(normalizedProgress);
            } else {
              opacity = 1;
            }

            let x: string, rotate: number, rotationY: number;
            if (cardProgress < 0.6) {
              x = index === 0 ? "100%" : index === 1 ? "0%" : "-100%";
              rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
              rotationY = 0;
            } else if (cardProgress < 1) {
              const normalizedProgress = (cardProgress - 0.6) / 0.4;
              x = gsap.utils.interpolate(
                index === 0 ? "100%" : index === 1 ? "0%" : "-100%",
                "0%",
                smoothStep(normalizedProgress)
              );
              rotate = gsap.utils.interpolate(
                index === 0 ? -5 : index === 1 ? 0 : 5,
                0,
                smoothStep(normalizedProgress)
              );
              rotationY = smoothStep(normalizedProgress) * 180;
            } else {
              x = "0%";
              rotate = 0;
              rotationY = 180;
            }

            gsap.set(cardRef.current, {
              opacity: opacity,
              y: y,
              x: x,
              rotate: rotate,
              scale: scale,
            });

            if (innerCard) {
              gsap.set(innerCard, {
                rotationY: rotationY,
              });
            }
          });
        },
      });

      scrollTriggersRef.current.push(cardsScrollTrigger);
    }

    isInitialized.current = true;

    // Cleanup function
    return () => {
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      scrollTriggersRef.current = [];

      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }

      gsap.ticker.remove((time) => {
        if (lenisRef.current) {
          lenisRef.current.raf(time * 1000);
        }
      });

      isInitialized.current = false;
    };
  }, [refs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scrollTriggersRef.current.forEach((trigger) => trigger.kill());
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    };
  }, []);
}
