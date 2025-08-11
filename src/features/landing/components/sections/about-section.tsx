'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import Image from 'next/image';

export interface AboutSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  cardRefs: React.RefObject<HTMLDivElement | null>[];
}

interface AboutSectionProps {}

export const AboutSection = forwardRef<AboutSectionRefs, AboutSectionProps>((_, ref) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useImperativeHandle(ref, () => ({
    sectionRef,
    headerRef,
    cardRefs,
  }));

  return (
    <section ref={sectionRef} className="home-about">
      <div className="container">
        <div className="home-about-col">
          <div className="symbols-container">
            <div className="symbol">
              <Image 
                src="/assets/img/logo/foldly_logo_sm.png" 
                alt="Foldly Logo" 
                width={18} 
                height={18}
                className="symbol-icon"
              />
            </div>
          </div>
          <div ref={headerRef} className="home-about-header">
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.2"
              data-animate-on-scroll="true"
            >
              <span>▸</span> Why Foldly
            </p>
            <h3
              data-animate-type="line-reveal"
              data-animate-delay="0.2"
              data-animate-on-scroll="true"
            >
              The smarter way to receive files from anyone
            </h3>
          </div>
        </div>
        <div className="home-about-col">
          <div className="home-about-col-row">
            <div ref={cardRefs[0]} className="home-about-card">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.2"
                data-animate-on-scroll="true"
              >
                [ Feature 01 ]
              </p>
              <h4
                data-animate-type="line-reveal"
                data-animate-delay="0.2"
                data-animate-on-scroll="true"
              >
                Multi-Link System
              </h4>
              <p className="feature-description text-sm text-gray-600 dark:text-gray-400 mt-2">
                Your base link, unlimited topic links for projects, plus auto-generated links from any workspace folder.
              </p>
            </div>
            <div ref={cardRefs[1]} className="home-about-card">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.25"
                data-animate-on-scroll="true"
              >
                [ Feature 02 ]
              </p>
              <h4
                data-animate-type="line-reveal"
                data-animate-delay="0.25"
                data-animate-on-scroll="true"
              >
                Zero Barriers
              </h4>
              <p className="feature-description text-sm text-gray-600 dark:text-gray-400 mt-2">
                People just type their name and upload. No sign-ups, no apps to download - sharing files as it should be.
              </p>
            </div>
          </div>
          <div className="home-about-col-row">
            <div ref={cardRefs[2]} className="home-about-card">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.3"
                data-animate-on-scroll="true"
              >
                [ Feature 03 ]
              </p>
              <h4
                data-animate-type="line-reveal"
                data-animate-delay="0.3"
                data-animate-on-scroll="true"
              >
                Smart Organization
              </h4>
              <p className="feature-description text-sm text-gray-600 dark:text-gray-400 mt-2">
                Files organize themselves by sender and date. Move them to your workspace to arrange exactly how you like.
              </p>
            </div>
            <div ref={cardRefs[3]} className="home-about-card">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.35"
                data-animate-on-scroll="true"
              >
                [ Feature 04 ]
              </p>
              <h4
                data-animate-type="line-reveal"
                data-animate-delay="0.35"
                data-animate-on-scroll="true"
              >
                Secure & Flexible
              </h4>
              <p className="feature-description text-sm text-gray-600 dark:text-gray-400 mt-2">
                Add passwords when needed, require email verification, set file limits - security options that stay simple.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

AboutSection.displayName = 'AboutSection';