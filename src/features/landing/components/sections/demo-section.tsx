'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import Image from 'next/image';

export interface DemoSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  topBarRef: React.RefObject<HTMLDivElement | null>;
  bottomBarRef: React.RefObject<HTMLDivElement | null>;
  stickyCardsHeaderRef: React.RefObject<HTMLDivElement | null>;
  galleryCardsRef: React.RefObject<HTMLDivElement[]>;
  maskContainerRef: React.RefObject<HTMLDivElement | null>;
  maskImageRef: React.RefObject<HTMLDivElement | null>;
  maskHeaderRef: React.RefObject<HTMLDivElement | null>;
}

interface DemoSectionProps {}

export const DemoSection = forwardRef<DemoSectionRefs, DemoSectionProps>(
  (_, ref) => {
    const sectionRef = useRef<HTMLElement>(null);
    const topBarRef = useRef<HTMLDivElement>(null);
    const bottomBarRef = useRef<HTMLDivElement>(null);
    const stickyCardsHeaderRef = useRef<HTMLDivElement>(null);
    const galleryCardsRef = useRef<HTMLDivElement[]>([]);
    const maskContainerRef = useRef<HTMLDivElement>(null);
    const maskImageRef = useRef<HTMLDivElement>(null);
    const maskHeaderRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      sectionRef,
      topBarRef,
      bottomBarRef,
      stickyCardsHeaderRef,
      galleryCardsRef,
      maskContainerRef,
      maskImageRef,
      maskHeaderRef,
    }));

    const galleryImages = [
      {
        id: 'STEP-01',
        src: '/assets/img/landing_page/step_1.png',
        title: 'Step 1',
        description: "Hit JUMP IN and let's get rollin' 🚀",
        width: 1920,
        height: 1080,
      },
      {
        id: 'STEP-02',
        src: '/assets/img/landing_page/step_2.png',
        title: 'Step 2',
        description: 'Log in or sign up like a pro.',
        width: 1920,
        height: 1080,
      },
      {
        id: 'STEP-03',
        src: '/assets/img/landing_page/step_3.png',
        title: 'Step 3',
        description: "Drop your username (bonus points if it's spicy).",
        width: 1920,
        height: 1080,
      },
      {
        id: 'STEP-04',
        src: '/assets/img/landing_page/step_4.png',
        title: 'Step 4',
        description: 'Cruise to the Links section.',
        width: 1920,
        height: 1080,
      },
      {
        id: 'STEP-05',
        src: '/assets/img/landing_page/step_5.png',
        title: 'Step 5',
        description: 'Setup your Base Link, your VIP file drop-off spot 📦✨',
        width: 1920,
        height: 1080,
      },
      {
        id: 'STEP-06',
        src: '/assets/img/landing_page/step_6.png',
        title: 'Step 6',
        description: 'Share it and watch the magic happen ✨',
        width: 1920,
        height: 1080,
      },
    ];

    return (
      <section ref={sectionRef} className='demo-spotlight'>
        {/* Gallery Subsection */}
        <div className='gallery-subsection'>
          <div ref={stickyCardsHeaderRef} className='sticky-cards-header'>
            <h3
              data-animate-type='line-reveal'
              data-animate-delay='0.2'
              data-animate-on-scroll='true'
            >
              See Foldly in Action
            </h3>
          </div>
          <div ref={topBarRef} className='home-spotlight-top-bar'>
            <div className='container'>
            </div>
          </div>
          <div ref={bottomBarRef} className='home-spotlight-bottom-bar'>
            <div className='container'>
              <p
                className='mono'
                data-animate-type='scramble'
                data-animate-delay='0.2'
                data-animate-on-scroll='true'
              >
                <span>▶</span> Demo Mode
              </p>
              <p
                className='mono'
                data-animate-type='scramble'
                data-animate-delay='0.25'
                data-animate-on-scroll='true'
              >
                / File Sharing Reimagined
              </p>
            </div>
          </div>
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className='gallery-card'
              ref={el => {
                if (el) galleryCardsRef.current[index] = el;
              }}
            >
              <div className='gallery-card-img'>
                <Image
                  src={image.src}
                  alt={image.title}
                  width={image.width}
                  height={image.height}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
                  style={{ 
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain' 
                  }}
                  priority={index < 2}
                />
              </div>
              <div className='gallery-card-content'>
                <h4>{image.title}</h4>
                <p>{image.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Video Demo Subsection with Mask */}
        <div ref={maskContainerRef} className='spotlight-mask-image-container'>
          <div ref={maskImageRef} className='spotlight-mask-image'>
            <Image
              src='/assets/landing/spotlight-images/spotlight-banner.jpg'
              alt=''
              fill
              style={{
                objectFit: 'cover',
                filter: 'brightness(0)',
              }}
            />
          </div>
          <div className='container'>
            <div ref={maskHeaderRef} className='spotlight-mask-header'>
              {/* <h3>Experience the Simplicity</h3> */}
              <h3>Amazing demo video is cooking</h3>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

DemoSection.displayName = 'DemoSection';
