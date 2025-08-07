'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import Image from 'next/image';
import type { SpotlightImage } from '../../types';
import {
  useGsapAnimation,
  useScrollAnimations,
  useTextAnimations,
  smootherStep,
  mapRange,
  interpolateString,
} from '../../hooks/animations';

const spotlightImages: SpotlightImage[] = [
  { src: '/assets/landing/spotlight-images/spotlight-img-1.jpg', alt: 'Spotlight 1', row: 0, position: 1 },
  { src: '/assets/landing/spotlight-images/spotlight-img-2.jpg', alt: 'Spotlight 2', row: 0, position: 3 },
  { src: '/assets/landing/spotlight-images/spotlight-img-3.jpg', alt: 'Spotlight 3', row: 1, position: 0 },
  { src: '/assets/landing/spotlight-images/spotlight-img-4.jpg', alt: 'Spotlight 4', row: 2, position: 1 },
  { src: '/assets/landing/spotlight-images/spotlight-img-5.jpg', alt: 'Spotlight 5', row: 2, position: 2 },
  { src: '/assets/landing/spotlight-images/spotlight-img-6.jpg', alt: 'Spotlight 6', row: 3, position: 1 },
  { src: '/assets/landing/spotlight-images/spotlight-img-7.jpg', alt: 'Spotlight 7', row: 3, position: 3 },
  { src: '/assets/landing/spotlight-images/spotlight-img-8.jpg', alt: 'Spotlight 8', row: 4, position: 0 },
  { src: '/assets/landing/spotlight-images/spotlight-img-9.jpg', alt: 'Spotlight 9', row: 4, position: 2 },
];

export function HomeSpotlightSection() {
  // Refs for animations
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightImagesRef = useRef<HTMLDivElement>(null);
  const spotlightHeaderRef = useRef<HTMLHeadingElement>(null);
  const introHeaderRef = useRef<HTMLHeadingElement>(null);
  const maskContainerRef = useRef<HTMLDivElement>(null);
  const maskImageRef = useRef<HTMLDivElement>(null);
  const maskHeaderRef = useRef<HTMLHeadingElement>(null);
  const bottomBarTextRefs = useRef<HTMLParagraphElement[]>([]);
  
  // Animation hooks
  const { setRef } = useGsapAnimation();
  const { createPinnedAnimation, createCustomScrollAnimation } = useScrollAnimations();
  const { createSplitText, lineRevealText, scrambleText, cleanupSplitTexts } = useTextAnimations();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize text animations for bottom bar
    bottomBarTextRefs.current.forEach((ref) => {
      if (ref) {
        const delay = parseFloat(ref.getAttribute('data-animate-delay') || '0');
        
        // Set up intersection observer for scroll-triggered animation
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                scrambleText({ current: ref }, { delay });
                observer.unobserve(entry.target);
              }
            });
          },
          {
            threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
            rootMargin: '0px 0px -20% 0px',
          }
        );

        const parentSection = ref.closest('section');
        if (parentSection) {
          observer.observe(parentSection);
        }
      }
    });

    // Initialize intro header animation
    if (introHeaderRef.current) {
      const delay = parseFloat(introHeaderRef.current.getAttribute('data-animate-delay') || '0');
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              lineRevealText(introHeaderRef as RefObject<HTMLElement>, { delay });
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: [0, 0.1, 0.3, 0.5, 0.7, 1.0],
          rootMargin: '0px 0px -20% 0px',
        }
      );

      const parentSection = introHeaderRef.current.closest('section');
      if (parentSection) {
        observer.observe(parentSection);
      }
    }

    if (!spotlightImagesRef.current || !sectionRef.current) return;

    const containerHeight = spotlightImagesRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const initialOffset = containerHeight * 0.05;
    const totalMovement = containerHeight + initialOffset + viewportHeight;

    // Create split text for mask header
    let headerSplit: any = null;
    if (maskHeaderRef.current) {
      headerSplit = createSplitText(maskHeaderRef as RefObject<HTMLElement>, 'words', {
        wordsClass: 'spotlight-word',
      });

      if (headerSplit) {
        setRef({ current: headerSplit.words as unknown as HTMLElement }, { opacity: 0 });
      }
    }

    // Create pinned scroll animation
    createPinnedAnimation(sectionRef as RefObject<HTMLElement>, {
      start: 'top top',
      end: `+=${window.innerHeight * 7}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (progress) => {
        // Animate spotlight images
        if (progress <= 0.5 && spotlightImagesRef.current) {
          const animationProgress = progress / 0.5;
          const startY = 5;
          const endY = -(totalMovement / containerHeight) * 100;
          const currentY = startY + (endY - startY) * animationProgress;
          
          setRef(spotlightImagesRef as RefObject<HTMLElement>, { y: `${currentY}%` });
        }

        // Animate mask
        if (maskContainerRef.current && maskImageRef.current) {
          if (progress >= 0.25 && progress <= 0.75) {
            const maskProgress = (progress - 0.25) / 0.5;
            const maskSize = `${maskProgress * 475}%`;
            const imageScale = 1.25 - maskProgress * 0.25;

            maskContainerRef.current.style.setProperty('-webkit-mask-size', maskSize);
            maskContainerRef.current.style.setProperty('mask-size', maskSize);
            
            setRef(maskImageRef as RefObject<HTMLElement>, { scale: imageScale });
          } else if (progress < 0.25) {
            maskContainerRef.current.style.setProperty('-webkit-mask-size', '0%');
            maskContainerRef.current.style.setProperty('mask-size', '0%');
            
            setRef(maskImageRef as RefObject<HTMLElement>, { scale: 1.25 });
          } else if (progress > 0.75) {
            maskContainerRef.current.style.setProperty('-webkit-mask-size', '475%');
            maskContainerRef.current.style.setProperty('mask-size', '475%');
            
            setRef(maskImageRef as RefObject<HTMLElement>, { scale: 1 });
          }
        }

        // Animate header text
        if (headerSplit && headerSplit.words.length > 0) {
          if (progress >= 0.75 && progress <= 0.95) {
            const textProgress = (progress - 0.75) / 0.2;
            const totalWords = headerSplit.words.length;

            headerSplit.words.forEach((word: Element, index: number) => {
              const wordRevealProgress = index / totalWords;

              if (textProgress >= wordRevealProgress) {
                setRef({ current: word as HTMLElement }, { opacity: 1 });
              } else {
                setRef({ current: word as HTMLElement }, { opacity: 0 });
              }
            });
          } else if (progress < 0.75) {
            setRef({ current: headerSplit.words as unknown as HTMLElement }, { opacity: 0 });
          } else if (progress > 0.95) {
            setRef({ current: headerSplit.words as unknown as HTMLElement }, { opacity: 1 });
          }
        }
      },
    });

    return () => {
      cleanupSplitTexts();
    };
  }, [setRef, createPinnedAnimation, createSplitText, lineRevealText, scrambleText, cleanupSplitTexts]);

  return (
    <section ref={sectionRef} className="home-spotlight">
      <div className="home-spotlight-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s2-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s2-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-light.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="home-spotlight-bottom-bar">
        <div className="container">
          <p
            ref={(el) => { if (el) bottomBarTextRefs.current[0] = el; }}
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.2"
            data-animate-on-scroll="true"
          >
            <span>▶</span> Visual logs
          </p>
          <p
            ref={(el) => { if (el) bottomBarTextRefs.current[1] = el; }}
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
            data-animate-on-scroll="true"
          >
            / Portfolio Arc
          </p>
        </div>
      </div>
      <div className="container">
        <div className="spotlight-intro-header">
          <h3
            ref={introHeaderRef}
            data-animate-type="line-reveal"
            data-animate-delay="0.3"
            data-animate-on-scroll="true"
          >
            Trends shout but Juno whispers
          </h3>
        </div>
      </div>
      <div ref={spotlightImagesRef} className="home-spotlight-images">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="home-spotlight-images-row">
            {[0, 1, 2, 3].map((col) => {
              const image = spotlightImages.find(
                (img) => img.row === row && img.position === col
              );
              return (
                <div
                  key={`${row}-${col}`}
                  className={`home-spotlight-image ${image ? 'image-holder' : ''}`}
                >
                  {image && (
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={400}
                      height={300}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div ref={maskContainerRef} className="spotlight-mask-image-container">
        <div ref={maskImageRef} className="spotlight-mask-image">
          <Image
            src="/assets/landing/spotlight-images/spotlight-banner.jpg"
            alt="Spotlight Banner"
            width={1920}
            height={1080}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="container">
          <div className="spotlight-mask-header">
            <h3 ref={maskHeaderRef}>Built This Face with Flexbox</h3>
          </div>
        </div>
      </div>
    </section>
  );
}