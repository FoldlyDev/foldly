"use client";

import { forwardRef } from "react";
import { FlipCard } from "@/components/ui/flip-card";

const cardData = [
  {
    id: "card-1",
    mobileId: "mobile-card-1",
    title: "Create",
    number: "01",
    features: [
      "Custom Links",
      "Brand Your Page",
      "Set Expiration",
      "Add Instructions",
      "Control Access",
      "Track Progress",
    ],
  },
  {
    id: "card-2",
    mobileId: "mobile-card-2",
    title: "Collect",
    number: "02",
    features: [
      "Drag & Drop",
      "No Login Required",
      "Large File Support",
      "Progress Tracking",
      "Auto Notifications",
      "Secure Storage",
    ],
  },
  {
    id: "card-3",
    mobileId: "mobile-card-3",
    title: "Organize",
    number: "03",
    features: [
      "Auto Folders",
      "Smart Tagging",
      "Search & Filter",
      "Bulk Operations",
      "Export Options",
      "Cloud Sync",
    ],
  },
];

interface FeaturesSectionProps {}

interface FeaturesSectionRefs {
  servicesRef: React.RefObject<HTMLElement | null>;
  servicesHeaderRef: React.RefObject<HTMLDivElement | null>;
  card1Ref: React.RefObject<HTMLDivElement | null>;
  card2Ref: React.RefObject<HTMLDivElement | null>;
  card3Ref: React.RefObject<HTMLDivElement | null>;
  flipCard1InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard2InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard3InnerRef: React.RefObject<HTMLDivElement | null>;
}

export const FeaturesSection = forwardRef<
  FeaturesSectionRefs,
  FeaturesSectionProps
>((props, ref) => {
  // Extract refs from the forwarded ref object
  const refs = ref as React.MutableRefObject<FeaturesSectionRefs>;

  return (
    <section className="services" ref={refs?.current?.servicesRef}>
      <div className="services-header" ref={refs?.current?.servicesHeaderRef}>
        <h1>File collection made ridiculously simple</h1>
      </div>

      {/* Desktop Animated Cards */}
      <section className="cards">
        <div className="cards-container">
          {cardData.map((card, index) => (
            <FlipCard
              key={card.id}
              id={card.id}
              title={card.title}
              number={card.number}
              features={card.features}
              ref={
                index === 0
                  ? refs?.current?.card1Ref
                  : index === 1
                  ? refs?.current?.card2Ref
                  : refs?.current?.card3Ref
              }
              flipCardInnerRef={
                index === 0
                  ? refs?.current?.flipCard1InnerRef
                  : index === 1
                  ? refs?.current?.flipCard2InnerRef
                  : refs?.current?.flipCard3InnerRef
              }
            />
          ))}
        </div>
      </section>

      {/* Mobile Cards */}
      <div className="mobile-cards">
        <div className="cards-container">
          {cardData.map((card) => (
            <FlipCard
              key={card.mobileId}
              id={card.mobileId}
              title={card.title}
              number={card.number}
              features={card.features}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";
