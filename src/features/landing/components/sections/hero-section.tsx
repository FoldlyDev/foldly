'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FlipCard } from '@/components/marketing/flip-card';
import { useUser } from '@clerk/nextjs';
import { landingCardData } from '../../constants/card-data';
import BackgroundHighlight from '../ui/background-highlight';
import {
  useGsapAnimation,
  useScrollAnimations,
  useTextAnimations,
  useListRefs,
  DURATIONS,
  EASINGS,
  smootherStep,
  interpolateString,
  interpolateNumber,
  clamp,
  mapRange,
} from '../../hooks/animations';

export function HeroSection() {
  const { user } = useUser();
  const [titleHighlight, setTitleHighlight] = useState({ 
    x: 640, 
    y: 400, 
    width: 1200, 
    height: 200 
  });
  
  // Refs for animations
  const heroRef = useRef<HTMLElement>(null);
  const heroCardsRef = useRef<HTMLDivElement>(null);
  const { itemRefs: cardRefs } = useListRefs<HTMLDivElement>(3);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroHeaderRef = useRef<HTMLHeadingElement>(null);
  const heroDescriptionRef = useRef<HTMLParagraphElement>(null);
  const { itemRefs: heroTagRefs } = useListRefs<HTMLParagraphElement>(2);
  
  // Animation hooks
  const { animateRef, setRef } = useGsapAnimation();
  const { createCustomScrollAnimation } = useScrollAnimations();
  const { revealText, lineRevealText, scrambleText } = useTextAnimations();

  // Calculate title highlight position and dimensions
  useEffect(() => {
    const calculateTitlePosition = () => {
      if (typeof window === 'undefined' || !heroHeaderRef.current || !heroRef.current) return;
      
      const heroRect = heroRef.current.getBoundingClientRect();
      const titleRect = heroHeaderRef.current.getBoundingClientRect();
      
      // Calculate position relative to hero section
      const x = titleRect.left - heroRect.left + (titleRect.width / 2);
      const y = titleRect.top - heroRect.top + (titleRect.height / 2);
      
      // Full width coverage with extra margins
      const containerWidth = heroRect.width;
      const highlightWidth = Math.min(containerWidth * 0.9, 1400); // 90% of container or max 1400px
      
      // Exact title height plus some padding
      const highlightHeight = titleRect.height + 40; // 20px padding top/bottom
      
      setTitleHighlight({ 
        x, 
        y, 
        width: highlightWidth, 
        height: highlightHeight 
      });
    };

    // Calculate position after a delay to ensure elements are rendered
    const timer = setTimeout(calculateTitlePosition, 500);
    
    // Recalculate on resize
    window.addEventListener('resize', calculateTitlePosition);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateTitlePosition);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // On mobile/tablet, show cards immediately
    if (window.innerWidth <= 1000) {
      cardRefs.forEach((ref) => {
        if (ref.current) {
          ref.current.style.transform = 'scale(1)';
        }
      });
      return;
    }

    // Initialize text animations for data-animate elements
    if (heroHeaderRef.current) {
      const delay = parseFloat(heroHeaderRef.current.getAttribute('data-animate-delay') || '0');
      revealText(heroHeaderRef as RefObject<HTMLElement>, { delay });
    }

    if (heroDescriptionRef.current) {
      const delay = parseFloat(heroDescriptionRef.current.getAttribute('data-animate-delay') || '0');
      lineRevealText(heroDescriptionRef as RefObject<HTMLElement>, { delay });
    }

    // Animate tag elements
    heroTagRefs.forEach((ref) => {
      if (ref.current) {
        const delay = parseFloat(ref.current.getAttribute('data-animate-delay') || '0');
        scrambleText(ref as RefObject<HTMLElement>, { delay });
      }
    });

    // Hero cards initial setup
    cardRefs.forEach((ref) => {
      if (ref.current) {
        setRef(ref as RefObject<HTMLElement>, { transformOrigin: 'center center', scale: 0 });
        // Fallback visibility after timeout
        setTimeout(() => {
          if (ref.current && getComputedStyle(ref.current).transform.includes('scale(0)')) {
            ref.current.classList.add('fallback-visible');
          }
        }, 2000);
      }
    });

    // Animate cards in - exact template timing
    animateRef(cardRefs as RefObject<HTMLElement>[], {
      scale: 1,
      duration: 0.75, // Template uses 0.75, not medium duration
      delay: 0.25,
      stagger: 0.1,
      ease: EASINGS.power4Out,
      onComplete: () => {
        // Set transform origins for scroll animation - exact template IDs
        if (cardRefs[0]?.current) {
          setRef(cardRefs[0] as RefObject<HTMLElement>, { transformOrigin: 'top right' });
        }
        if (cardRefs[2]?.current) {
          setRef(cardRefs[2] as RefObject<HTMLElement>, { transformOrigin: 'top left' });
        }
      },
    });

    // Scroll animations for desktop only - EXACT template breakpoint (1000px)
    if (window.innerWidth > 1000 && heroRef.current && heroCardsRef.current) {
      createCustomScrollAnimation(
        heroRef as RefObject<HTMLElement>,
        (progress) => {
          // Exact smoothStep function from template
          const smoothStep = (p: number) => p * p * (3 - 2 * p);
          
          // Fade out cards container - template uses 0.5 not 0.3
          const heroCardsContainerOpacity = interpolateNumber(1, 0.5, smoothStep(progress));
          setRef(heroCardsRef as RefObject<HTMLElement>, { opacity: heroCardsContainerOpacity });

          // Animate individual cards with EXACT juno_watts timing
          cardRefs.forEach((cardRef, index) => {
            if (!cardRef.current) return;

            // Template uses 0.9 stagger delay, not 0.09
            const delay = index * 0.9;
            const cardProgress = clamp(0, 1, (progress - delay * 0.1) / (1 - delay * 0.1));
            const easeProgress = smoothStep(cardProgress);

            // Template uses exact 400% vertical movement
            const y = interpolateString('0%', '400%', easeProgress);
            
            // Scale matches template exactly
            const scale = interpolateNumber(1, 0.75, easeProgress);

            // Horizontal movement and rotation - exact template values
            let x = '0%';
            let rotation = 0;

            if (index === 0) {
              // Left card - exact template values
              x = interpolateString('0%', '90%', easeProgress);
              rotation = interpolateNumber(0, -15, easeProgress);
            } else if (index === 2) {
              // Right card - exact template values
              x = interpolateString('0%', '-90%', easeProgress);
              rotation = interpolateNumber(0, 15, easeProgress);
            }
            // Center card has no x/rotation in template

            setRef(cardRef as RefObject<HTMLElement>, {
              y,
              x,
              rotation,
              scale,
            });
          });
        },
        {
          start: 'top top',
          end: '75% top',
          scrub: 1,
        }
      );
    }

    return () => {
      // Cleanup handled by hooks
    };
  }, [animateRef, setRef, createCustomScrollAnimation, revealText, lineRevealText, scrambleText, cardRefs, heroTagRefs]);

  return (
    <BackgroundHighlight
      staticHighlights={[
        {
          x: titleHighlight.x,
          y: titleHighlight.y,
          width: titleHighlight.width,
          height: titleHighlight.height,
          shape: 'rectangle',
          opacity: 1.0,
        },
      ]}
    >
      <section ref={heroRef} className='hero' id='home'>
        <div className='home-services-top-bar relative z-20'>
          <div className='container'>
            <div className='symbols-container'>
              <div className='symbol'>
                <Image
                  src='/assets/landing/symbols/s1-dark.png'
                  alt='Symbol'
                  width={18}
                  height={18}
                />
              </div>
            </div>
            <div className='symbols-container'>
              <div className='symbol'>
                <Image
                  src='/assets/landing/symbols/s1-dark.png'
                  alt='Symbol'
                  width={18}
                  height={18}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className='container relative z-20'
          style={{ overflow: 'visible' }}
        >
          <div ref={heroContentRef} className='hero-content'>
            <div className='hero-header'>
              <h1 ref={heroHeaderRef} data-animate-type='reveal' data-animate-delay='0.25'>
                FOLDLY
              </h1>
            </div>
            <div className='hero-footer'>
              <div className='hero-footer-copy'>
                <p
                  ref={heroDescriptionRef}
                  className='md'
                  data-animate-type='line-reveal'
                  data-animate-delay='0.25'
                >
                  Create custom branded upload links for clients. Collect files
                  without friction - no logins required. Organize everything
                  automatically with smart folders and real-time notifications.
                </p>
              </div>
              <div className='hero-footer-tags'>
                <p
                  ref={heroTagRefs[0]}
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay='0.5'
                >
                  <span>▶</span> Interface Alchemy
                </p>
                <p
                  ref={heroTagRefs[1]}
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay='0.5'
                >
                  <span>▶</span> Scroll Sorcery
                </p>
              </div>
            </div>
          </div>
          <div ref={heroCardsRef} className='hero-cards'>
            {landingCardData.map((card, index) => (
              <FlipCard
                key={card.heroId}
                ref={cardRefs[index]}
                id={card.heroId}
                title={card.title}
                number={card.number}
                features={card.features}
                iconType={card.iconType}
              />
            ))}
          </div>
          <div className='hero-mobile-description'>
            <p className='md'>
              Create custom branded upload links for clients. Collect files
              without friction - no logins required. Organize everything
              automatically with smart folders and real-time notifications.
            </p>
            <Link
              href={user ? '/dashboard/workspace' : '/sign-in'}
              className='hero-mobile-cta'
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
            </Link>
          </div>
        </div>
      </section>
    </BackgroundHighlight>
  );
}