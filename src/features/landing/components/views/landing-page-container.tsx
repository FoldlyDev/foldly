'use client';

import { useRef, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IntroSection } from '../sections/intro-section';
import { useIntroSectionAnimation } from '../../hooks/useIntroSectionAnimation';
import { HeroSection } from '../sections/hero-section';
import { AboutSection } from '../sections/about-section';
import { FeaturesSection } from '../sections/features-section';
import { OutroSection } from '../sections/outro-section';
import { Navigation } from '@/components/ui/layout/navigation';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import { useHeroSectionAnimation } from '../../hooks/useHeroSectionAnimation';
import { useFeaturesSectionAnimation } from '../../hooks/useFeaturesSectionAnimation';

/**
 * Client-side container component for the landing page
 * Handles all hooks and client-side logic while keeping the page component as Server Component
 */
export function LandingPageContainer() {
  // Intro section refs
  const introRef = useRef<HTMLElement>(null);
  const introHeroHeaderRef = useRef<HTMLDivElement>(null);
  const introAnimatedIconsRef = useRef<HTMLDivElement>(null);
  const introIconRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const introTextSegmentRefs = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];
  const introPlaceholderIconRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const introDuplicateIconsContainerRef = useRef<HTMLDivElement>(null);

  // Hero section refs
  const heroRef = useRef<HTMLElement>(null);
  const heroCardsRef = useRef<HTMLDivElement>(null);
  const heroCard1Ref = useRef<HTMLDivElement>(null);
  const heroCard2Ref = useRef<HTMLDivElement>(null);
  const heroCard3Ref = useRef<HTMLDivElement>(null);

  // Features section refs
  const featuresRef = useRef<HTMLElement>(null);
  const featuresHeaderRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const flipCard1InnerRef = useRef<HTMLDivElement>(null);
  const flipCard2InnerRef = useRef<HTMLDivElement>(null);
  const flipCard3InnerRef = useRef<HTMLDivElement>(null);

  // Create ref objects that match component expectations
  const introSectionRefs = useRef({
    introRef,
    heroHeaderRef: introHeroHeaderRef,
    animatedIconsRef: introAnimatedIconsRef,
    iconRefs: introIconRefs,
    textSegmentRefs: introTextSegmentRefs,
    placeholderIconRefs: introPlaceholderIconRefs,
    duplicateIconsContainerRef: introDuplicateIconsContainerRef,
  });

  const heroSectionRefs = useRef({
    heroRef,
    heroCardsRef,
    heroCard1Ref,
    heroCard2Ref,
    heroCard3Ref,
  });

  const featuresSectionRefs = useRef({
    featuresRef,
    featuresHeaderRef,
    card1Ref,
    card2Ref,
    card3Ref,
    flipCard1InnerRef,
    flipCard2InnerRef,
    flipCard3InnerRef,
  });

  // Initialize Lenis smooth scrolling
  useLenisScroll();

  // Initialize section-specific animations
  useIntroSectionAnimation({
    introRef,
    heroHeaderRef: introHeroHeaderRef,
    animatedIconsRef: introAnimatedIconsRef,
    iconRefs: introIconRefs,
    textSegmentRefs: introTextSegmentRefs,
    placeholderIconRefs: introPlaceholderIconRefs,
    duplicateIconsContainerRef: introDuplicateIconsContainerRef,
  });

  useHeroSectionAnimation({
    heroRef,
    heroCardsRef,
    heroCard1Ref,
    heroCard2Ref,
    heroCard3Ref,
  });

  useFeaturesSectionAnimation({
    featuresRef,
    featuresHeaderRef,
    card1Ref,
    card2Ref,
    card3Ref,
    flipCard1InnerRef,
    flipCard2InnerRef,
    flipCard3InnerRef,
  });

  // Refresh ScrollTrigger after all animations are set up
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navigation />
      <div className='landing-page'>
        <IntroSection ref={introSectionRefs} />
        <HeroSection ref={heroSectionRefs} />
        <AboutSection />
        <FeaturesSection ref={featuresSectionRefs} />
        <OutroSection />
      </div>
    </>
  );
}
