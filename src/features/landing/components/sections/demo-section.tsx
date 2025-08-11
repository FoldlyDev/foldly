'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import Image from 'next/image';

export interface DemoSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  topBarRef: React.RefObject<HTMLDivElement | null>;
  bottomBarRef: React.RefObject<HTMLDivElement | null>;
  introHeaderRef: React.RefObject<HTMLDivElement | null>;
  imagesRef: React.RefObject<HTMLDivElement | null>;
  maskContainerRef: React.RefObject<HTMLDivElement | null>;
  maskImageRef: React.RefObject<HTMLDivElement | null>;
  maskHeaderRef: React.RefObject<HTMLDivElement | null>;
}

interface DemoSectionProps {}

export const DemoSection = forwardRef<DemoSectionRefs, DemoSectionProps>((_, ref) => {
  const sectionRef = useRef<HTMLElement>(null);
  const topBarRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);
  const introHeaderRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const maskContainerRef = useRef<HTMLDivElement>(null);
  const maskImageRef = useRef<HTMLDivElement>(null);
  const maskHeaderRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    sectionRef,
    topBarRef,
    bottomBarRef,
    introHeaderRef,
    imagesRef,
    maskContainerRef,
    maskImageRef,
    maskHeaderRef,
  }));

  return (
    <section ref={sectionRef} className="home-spotlight">
      <div ref={topBarRef} className="home-spotlight-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-light.png" alt="Symbol" width={24} height={24} />
            </div>
            <div className="symbol">
              <Image src="/assets/landing/symbols/s2-light.png" alt="Symbol" width={24} height={24} />
            </div>
            <div className="symbol">
              <Image src="/assets/landing/symbols/s3-light.png" alt="Symbol" width={24} height={24} />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s3-light.png" alt="Symbol" width={24} height={24} />
            </div>
            <div className="symbol">
              <Image src="/assets/landing/symbols/s2-light.png" alt="Symbol" width={24} height={24} />
            </div>
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-light.png" alt="Symbol" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>
      <div ref={bottomBarRef} className="home-spotlight-bottom-bar">
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
        <div ref={introHeaderRef} className="spotlight-intro-header">
          <h3
            data-animate-type="line-reveal"
            data-animate-delay="0.3"
            data-animate-on-scroll="true"
          >
            Trends shout but Juno whispers
          </h3>
        </div>
      </div>
      <div ref={imagesRef} className="home-spotlight-images">
        <div className="home-spotlight-images-row">
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-1.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-2.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>
        <div className="home-spotlight-images-row">
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-3.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image"></div>
        </div>
        <div className="home-spotlight-images-row">
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-4.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-5.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
        </div>
        <div className="home-spotlight-images-row">
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-6.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-7.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>
        <div className="home-spotlight-images-row">
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-8.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
          <div className="home-spotlight-image image-holder">
            <Image src="/assets/landing/spotlight-images/spotlight-img-9.jpg" alt="" fill style={{ objectFit: 'cover' }} />
          </div>
          <div className="home-spotlight-image"></div>
        </div>
      </div>
      <div ref={maskContainerRef} className="spotlight-mask-image-container">
        <div ref={maskImageRef} className="spotlight-mask-image">
          <Image src="/assets/landing/spotlight-images/spotlight-banner.jpg" alt="" fill style={{ objectFit: 'cover' }} />
        </div>
        <div className="container">
          <div ref={maskHeaderRef} className="spotlight-mask-header">
            <h3>Built This Face with Flexbox</h3>
          </div>
        </div>
      </div>
    </section>
  );
});

DemoSection.displayName = 'DemoSection';