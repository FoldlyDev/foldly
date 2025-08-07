'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import Image from 'next/image';
import { landingCardData } from '../../constants/card-data';
import {
  useGsapAnimation,
  useScrollAnimations,
  useTextAnimations,
  useListRefs,
  smoothStep,
  smootherStep,
  interpolateString,
  interpolateNumber,
  clamp,
  mapRange,
} from '../../hooks/animations';

export function HomeServicesSection() {
  // Refs for animations
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerTextRef = useRef<HTMLParagraphElement>(null);
  const { itemRefs: cardRefs } = useListRefs<HTMLDivElement>(3);
  const { itemRefs: cardInnerRefs } = useListRefs<HTMLDivElement>(3);
  const { itemRefs: bottomBarTextRefs } = useListRefs<HTMLParagraphElement>(2);
  
  // Animation hooks
  const { setRef } = useGsapAnimation();
  const { createPinnedAnimation, createCustomScrollAnimation } = useScrollAnimations();
  const { scrambleText } = useTextAnimations();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Template performance optimization - disable complex animations on mobile/tablet
    if (window.innerWidth <= 1000) {
      return;
    }

    // Create EXACT template pinned animation (4x viewport height)
    if (sectionRef.current) {
      createPinnedAnimation(sectionRef as RefObject<HTMLElement>, {
        start: 'top top',
        end: `+=${window.innerHeight * 4}px`, // Template adds 'px'
        pin: '.home-services', // Template pins the class selector
        pinSpacing: true,
      });
    }

    // Create scroll-triggered animations - EXACT template timing
    if (sectionRef.current) {
      createCustomScrollAnimation(
        sectionRef as RefObject<HTMLElement>,
        (progress) => {
          // Header animation - exact smoothStep function from template
          const smoothStep = (p: number) => p * p * (3 - 2 * p);
          const headerProgress = clamp(0, 1, progress / 0.9);
          const headerY = interpolateString('300%', '0%', smoothStep(headerProgress));
          
          if (headerRef.current) {
            setRef(headerRef as RefObject<HTMLElement>, { y: headerY });
          }

          // EXACT template card animations - complex three-phase system
          cardRefs.forEach((cardRef, index) => {
            if (!cardRef.current) return;

            // Template uses 0.5 stagger delay, not 0.1
            const delay = index * 0.5;
            const cardProgress = clamp(0, 1, (progress - delay * 0.1) / (0.9 - delay * 0.1));
            const innerCardRef = cardInnerRefs[index];

            let y: string;
            let scale: number;
            let opacity: number;
            let x: string;
            let rotate: number;
            let rotationY: number;

            // Template uses complex three-segment animation
            if (cardProgress < 0.4) {
              const normalizedProgress = cardProgress / 0.4;
              y = interpolateString('-100%', '50%', smoothStep(normalizedProgress));
              scale = interpolateNumber(0.25, 0.75, smoothStep(normalizedProgress));
            } else if (cardProgress < 0.6) {
              const normalizedProgress = (cardProgress - 0.4) / 0.2;
              y = interpolateString('50%', '0%', smoothStep(normalizedProgress));
              scale = interpolateNumber(0.75, 1, smoothStep(normalizedProgress));
            } else {
              y = '0%';
              scale = 1;
            }

            // Opacity calculation
            if (cardProgress < 0.2) {
              const normalizedProgress = cardProgress / 0.2;
              opacity = smoothStep(normalizedProgress);
            } else {
              opacity = 1;
            }

            // Position and rotation - EXACT template logic
            if (cardProgress < 0.6) {
              x = index === 0 ? '100%' : index === 1 ? '0%' : '-100%';
              rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
              rotationY = 0;
            } else if (cardProgress < 1) {
              const normalizedProgress = (cardProgress - 0.6) / 0.4;
              x = interpolateString(
                index === 0 ? '100%' : index === 1 ? '0%' : '-100%',
                '0%',
                smoothStep(normalizedProgress)
              );
              rotate = interpolateNumber(
                index === 0 ? -5 : index === 1 ? 0 : 5,
                0,
                smoothStep(normalizedProgress)
              );
              rotationY = smoothStep(normalizedProgress) * 180;
            } else {
              x = '0%';
              rotate = 0;
              rotationY = 180;
            }

            // Apply transforms
            setRef(cardRef as RefObject<HTMLElement>, {
              opacity,
              y,
              x,
              rotate,
              scale,
            });

            if (innerCardRef?.current) {
              setRef(innerCardRef as RefObject<HTMLElement>, {
                rotationY,
              });
            }
          });
        },
        {
          start: 'top bottom',
          end: `+=${window.innerHeight * 4}`,
          scrub: 1,
        }
      );
    }

    // Initialize text animations for bottom bar
    bottomBarTextRefs.forEach((ref) => {
      if (ref.current) {
        const delay = parseFloat(ref.current.getAttribute('data-animate-delay') || '0');
        
        // Set up intersection observer for scroll-triggered animation
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                scrambleText(ref as RefObject<HTMLElement>, { delay });
                observer.unobserve(entry.target);
              }
            });
          },
          {
            threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
            rootMargin: '0px 0px -20% 0px',
          }
        );

        const parentSection = ref.current.closest('section');
        if (parentSection) {
          observer.observe(parentSection);
        }

        return () => {
          observer.disconnect();
        };
      }
    });

    return () => {
      // Cleanup handled by hooks
    };
  }, [createPinnedAnimation, createCustomScrollAnimation, setRef, scrambleText, cardRefs, cardInnerRefs, bottomBarTextRefs]);

  return (
    <section ref={sectionRef} className="home-services">
      <div className="container">
        <div ref={headerRef} className="home-services-header">
          <p ref={headerTextRef} className="md">Equipped and ready for scroll battles</p>
        </div>
      </div>
      <div className="home-services-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="home-services-bottom-bar">
        <div className="container">
          <p
            ref={bottomBarTextRefs[0]}
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.2"
            data-animate-on-scroll="true"
          >
            <span>▶</span> Deployed abilities
          </p>
          <p
            ref={bottomBarTextRefs[1]}
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
            data-animate-on-scroll="true"
          >
            [ Stats synced: 2025 ]
          </p>
        </div>
      </div>
      <div className="cards">
        <div className="cards-container">
          {landingCardData.map((card, index) => (
            <div key={card.id} ref={cardRefs[index]} className="card" id={card.id}>
              <div className="card-wrapper">
                <div ref={cardInnerRefs[index]} className="flip-card-inner">
                  <div className="flip-card-front">
                    <div className="card-title">
                      <p className="mono">{card.title}</p>
                      <p className="mono">{card.number}</p>
                    </div>
                    <div className="card-title">
                      <p className="mono">{card.number}</p>
                      <p className="mono">{card.title}</p>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div className="card-title">
                      <p className="mono">{card.title}</p>
                      <p className="mono">{card.number}</p>
                    </div>
                    <div className="card-copy">
                      {card.features.map((feature) => (
                        <p key={feature}>{feature}</p>
                      ))}
                    </div>
                    <div className="card-title">
                      <p className="mono">{card.number}</p>
                      <p className="mono">{card.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}