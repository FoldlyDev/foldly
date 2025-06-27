"use client";

import { useRef } from "react";
import { HeroSection } from "@/components/features/landing/hero-section";
import { AboutSection } from "@/components/features/landing/about-section";
import { FeaturesSection } from "@/components/features/landing/features-section";
import { OutroSection } from "@/components/features/landing/outro-section";
import { Navigation } from "@/components/layout/navigation";
import { useGSAPLandingAnimations } from "@/lib/hooks/useGSAPLandingAnimations";

/**
 * Client-side container component for the landing page
 * Handles all hooks and client-side logic while keeping the page component as Server Component
 */
export function LandingPageContainer() {
  // Hero section refs
  const heroRef = useRef<HTMLElement>(null);
  const heroCardsRef = useRef<HTMLDivElement>(null);
  const heroCard1Ref = useRef<HTMLDivElement>(null);
  const heroCard2Ref = useRef<HTMLDivElement>(null);
  const heroCard3Ref = useRef<HTMLDivElement>(null);

  // Features section refs
  const servicesRef = useRef<HTMLElement>(null);
  const servicesHeaderRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const flipCard1InnerRef = useRef<HTMLDivElement>(null);
  const flipCard2InnerRef = useRef<HTMLDivElement>(null);
  const flipCard3InnerRef = useRef<HTMLDivElement>(null);

  // Create ref objects that match component expectations
  const heroSectionRefs = useRef({
    heroRef,
    heroCardsRef,
    heroCard1Ref,
    heroCard2Ref,
    heroCard3Ref,
  });

  const featuresSectionRefs = useRef({
    servicesRef,
    servicesHeaderRef,
    card1Ref,
    card2Ref,
    card3Ref,
    flipCard1InnerRef,
    flipCard2InnerRef,
    flipCard3InnerRef,
  });

  // Initialize GSAP animations with refs
  useGSAPLandingAnimations({
    heroRef,
    heroCardsRef,
    heroCard1Ref,
    heroCard2Ref,
    heroCard3Ref,
    servicesRef,
    servicesHeaderRef,
    card1Ref,
    card2Ref,
    card3Ref,
    flipCard1InnerRef,
    flipCard2InnerRef,
    flipCard3InnerRef,
  });

  return (
    <div className="landing-page">
      <Navigation />
      <HeroSection ref={heroSectionRefs} />
      <AboutSection />
      <FeaturesSection ref={featuresSectionRefs} />
      <OutroSection />
    </div>
  );
}
