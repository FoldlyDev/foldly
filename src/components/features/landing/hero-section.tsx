"use client";

import { forwardRef } from "react";

interface HeroSectionProps {}

interface HeroSectionRefs {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCardsRef: React.RefObject<HTMLDivElement | null>;
  heroCard1Ref: React.RefObject<HTMLDivElement | null>;
  heroCard2Ref: React.RefObject<HTMLDivElement | null>;
  heroCard3Ref: React.RefObject<HTMLDivElement | null>;
}

export const HeroSection = forwardRef<HeroSectionRefs, HeroSectionProps>(
  (props, ref) => {
    // Extract refs from the forwarded ref object
    const refs = ref as React.MutableRefObject<HeroSectionRefs>;

    return (
      <section className="hero" ref={refs?.current?.heroRef}>
        <div className="hero-cards" ref={refs?.current?.heroCardsRef}>
          <div
            className="card"
            id="hero-card-1"
            ref={refs?.current?.heroCard1Ref}
          >
            <div className="card-title">
              <span>Create</span>
              <span>01</span>
            </div>
            <div className="card-title">
              <span>01</span>
              <span>Create</span>
            </div>
          </div>

          <div
            className="card"
            id="hero-card-2"
            ref={refs?.current?.heroCard2Ref}
          >
            <div className="card-title">
              <span>Collect</span>
              <span>02</span>
            </div>
            <div className="card-title">
              <span>02</span>
              <span>Collect</span>
            </div>
          </div>

          <div
            className="card"
            id="hero-card-3"
            ref={refs?.current?.heroCard3Ref}
          >
            <div className="card-title">
              <span>Organize</span>
              <span>03</span>
            </div>
            <div className="card-title">
              <span>03</span>
              <span>Organize</span>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

HeroSection.displayName = "HeroSection";
