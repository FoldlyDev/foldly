'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { SpotlightImage } from '../../types';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

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
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const spotlightImages = document.querySelector('.home-spotlight-images');
    if (!spotlightImages) return;

    const containerHeight = spotlightImages.scrollHeight;
    const viewportHeight = window.innerHeight;

    const initialOffset = containerHeight * 0.05;
    const totalMovement = containerHeight + initialOffset + viewportHeight;

    const spotlightHeader = document.querySelector('.spotlight-mask-header h3');
    let headerSplit: SplitText | null = null;

    if (spotlightHeader) {
      headerSplit = new SplitText(spotlightHeader, {
        type: 'words',
        wordsClass: 'spotlight-word',
      });

      gsap.set(headerSplit.words, { opacity: 0 });
    }

    ScrollTrigger.create({
      trigger: '.home-spotlight',
      start: 'top top',
      end: `+=${window.innerHeight * 7}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        if (progress <= 0.5) {
          const animationProgress = progress / 0.5;

          const startY = 5;
          const endY = -(totalMovement / containerHeight) * 100;

          const currentY = startY + (endY - startY) * animationProgress;

          gsap.set(spotlightImages, {
            y: `${currentY}%`,
          });
        }

        const maskContainer = document.querySelector(
          '.spotlight-mask-image-container'
        );
        const maskImage = document.querySelector('.spotlight-mask-image');

        if (maskContainer && maskImage) {
          if (progress >= 0.25 && progress <= 0.75) {
            const maskProgress = (progress - 0.25) / 0.5;
            const maskSize = `${maskProgress * 475}%`;

            const imageScale = 1.25 - maskProgress * 0.25;

            (maskContainer as HTMLElement).style.setProperty('-webkit-mask-size', maskSize);
            (maskContainer as HTMLElement).style.setProperty('mask-size', maskSize);

            gsap.set(maskImage, {
              scale: imageScale,
            });
          } else if (progress < 0.25) {
            (maskContainer as HTMLElement).style.setProperty('-webkit-mask-size', '0%');
            (maskContainer as HTMLElement).style.setProperty('mask-size', '0%');

            gsap.set(maskImage, {
              scale: 1.25,
            });
          } else if (progress > 0.75) {
            (maskContainer as HTMLElement).style.setProperty('-webkit-mask-size', '475%');
            (maskContainer as HTMLElement).style.setProperty('mask-size', '475%');

            gsap.set(maskImage, {
              scale: 1,
            });
          }
        }

        if (headerSplit && headerSplit.words.length > 0) {
          if (progress >= 0.75 && progress <= 0.95) {
            const textProgress = (progress - 0.75) / 0.2;
            const totalWords = headerSplit.words.length;

            headerSplit.words.forEach((word: Element, index: number) => {
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

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      headerSplit?.revert();
    };
  }, []);

  return (
    <section className="home-spotlight">
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
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.2"
            data-animate-on-scroll="true"
          >
            <span>▶</span> Visual logs
          </p>
          <p
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
            data-animate-type="line-reveal"
            data-animate-delay="0.3"
            data-animate-on-scroll="true"
          >
            Trends shout but Juno whispers
          </h3>
        </div>
      </div>
      <div className="home-spotlight-images">
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
      <div className="spotlight-mask-image-container">
        <div className="spotlight-mask-image">
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
            <h3>Built This Face with Flexbox</h3>
          </div>
        </div>
      </div>
    </section>
  );
}