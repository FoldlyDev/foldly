'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface HomeAboutSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  cardRefs: React.RefObject<HTMLDivElement | null>[];
}

interface HomeAboutSectionProps {}

export const HomeAboutSection = forwardRef<HomeAboutSectionRefs, HomeAboutSectionProps>((_, ref) => {
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
              <div className="symbol-placeholder" style={{ width: '1.125rem', height: '1.125rem', backgroundColor: 'var(--base-secondary-fade)' }} />
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
              File collection reimagined for modern teams
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
                Zero Friction
              </h4>
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
                Professional
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

HomeAboutSection.displayName = 'HomeAboutSection';