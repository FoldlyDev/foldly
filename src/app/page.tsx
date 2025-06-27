"use client";

import { useEffect } from "react";
import { HeroSection } from "@/components/features/landing/hero-section";
import { AboutSection } from "@/components/features/landing/about-section";
import { FeaturesSection } from "@/components/features/landing/features-section";
import { AnimatedCards } from "@/components/features/landing/animated-cards";
import { OutroSection } from "@/components/features/landing/outro-section";
import { Navigation } from "@/components/layout/navigation";
import { initLandingAnimations } from "@/lib/animations/landing-animations";

export default function HomePage() {
  useEffect(() => {
    // Initialize GSAP animations after component mounts
    initLandingAnimations();
  }, []);

  return (
    <div className="landing-page">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <AnimatedCards />
      <OutroSection />
    </div>
  );
}
