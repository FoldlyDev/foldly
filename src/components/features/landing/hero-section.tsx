"use client";

import { forwardRef } from "react";
import { Diamond } from "@/components/ui/diamond";
import { FlipCard } from "@/components/ui/flip-card";
import { BubbleBackground } from "@/components/ui/bubble";

interface HeroSectionProps {}

interface HeroSectionRefs {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCardsRef: React.RefObject<HTMLDivElement | null>;
  heroCard1Ref: React.RefObject<HTMLDivElement | null>;
  heroCard2Ref: React.RefObject<HTMLDivElement | null>;
  heroCard3Ref: React.RefObject<HTMLDivElement | null>;
}

const heroCardData = [
  {
    id: "hero-card-1",
    title: "Create",
    number: "01",
    features: ["Custom Links", "Brand Your Page", "Set Expiration"],
    iconType: "settings" as const,
  },
  {
    id: "hero-card-2",
    title: "Collect",
    number: "02",
    features: ["Drag & Drop", "No Login Required", "Large File Support"],
    iconType: "heart" as const,
  },
  {
    id: "hero-card-3",
    title: "Organize",
    number: "03",
    features: ["Auto Folders", "Smart Tagging", "Search & Filter"],
    iconType: "archive" as const,
  },
];

export const HeroSection = forwardRef<HeroSectionRefs, HeroSectionProps>(
  (props, ref) => {
    // Extract refs from the forwarded ref object
    const refs = ref as React.RefObject<HeroSectionRefs>;

    return (
      <>
        <BubbleBackground
          interactive
          className="absolute inset-0 flex items-center justify-center rounded-xl z-1"
        />
        <section className="hero" ref={refs?.current?.heroRef}>
          {/* Hero Header - Groups title with its decorations */}
          <div className="hero-header">
            {/* Top Diamonds Row */}
            <div className="hero-diamonds-top">
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="primary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="secondary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="tertiary"
              />
              <span className="hero-diamonds-text">With foldly</span>
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="tertiary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="secondary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="primary"
              />
            </div>

            {/* Main Title */}
            <h1 className="hero-main-title">FILE COLLECTION</h1>

            {/* Bottom Diamonds Row */}
            <div className="hero-diamonds-bottom">
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="secondary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="tertiary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="primary"
              />
              <span className="hero-diamonds-text">MADE SIMPLE</span>
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="primary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="tertiary"
              />
              <Diamond
                size={16}
                className="text-neutral-600"
                filled
                variant="secondary"
              />
            </div>
          </div>

          {/* Hero Cards */}
          <div className="hero-cards" ref={refs?.current?.heroCardsRef}>
            {heroCardData.map((card, index) => (
              <FlipCard
                key={card.id}
                id={card.id}
                title={card.title}
                number={card.number}
                features={card.features}
                iconType={card.iconType}
                className="hero-flip-card"
                ref={
                  index === 0
                    ? refs?.current?.heroCard1Ref
                    : index === 1
                    ? refs?.current?.heroCard2Ref
                    : refs?.current?.heroCard3Ref
                }
              />
            ))}
          </div>

          {/* Hero Description */}
          <div className="hero-description">
            <p className="text-neutral-400 text-base font-medium leading-relaxed">
              Create custom branded upload links for clients.
              <br />
              Collect files without friction - no logins required.
              <br />
              Organize everything automatically with smart
              <br />
              folders and real-time notifications.
            </p>
          </div>
        </section>
      </>
    );
  }
);

HeroSection.displayName = "HeroSection";
