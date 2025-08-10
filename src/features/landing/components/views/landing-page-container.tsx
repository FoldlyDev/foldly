'use client';

import { useRef, useEffect, useState } from 'react';
import { IntroSection } from '../sections/intro-section';
import { useIntroSectionAnimation } from '../../hooks/useIntroSectionAnimation';
import { HeroSection } from '../sections/hero-section';
import {
  HomeAboutSection,
  type HomeAboutSectionRefs,
} from '../sections/home-about-section';
import { FeaturesSection } from '../sections/features-section';
import { OutroSection } from '../sections/outro-section';
import { LandingNavigation } from '../navigation/landing-navigation';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import { useHeroSectionAnimation } from '../../hooks/useHeroSectionAnimation';
import { useFeaturesSectionAnimation } from '../../hooks/useFeaturesSectionAnimation';
import { useHomeAboutSectionAnimation } from '../../hooks/useHomeAboutSectionAnimation';
import { useLandingAnimationOrchestrator } from '../../hooks/useLandingAnimationOrchestrator';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { checkOnboardingStatusAction } from '@/features/onboarding/lib/actions';

/**
 * Client-side container component for the landing page
 * Handles all hooks and client-side logic while keeping the page component as Server Component
 */
export function LandingPageContainer() {
  // Auth and routing
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Check onboarding status and redirect
  const handleAuthenticatedNavigation = async () => {
    setCheckingOnboarding(true);
    try {
      const status = await checkOnboardingStatusAction();
      if (!status.hasWorkspace) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      router.push('/dashboard'); // Fallback to dashboard
    }
    setCheckingOnboarding(false);
  };

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

  // Home About section refs
  const homeAboutSectionRefs = useRef<HomeAboutSectionRefs>(null);

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

  // Wait for client-side hydration to complete
  useEffect(() => {
    // Small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Initialize animation orchestrator - single source of truth
  const { animationState } = useLandingAnimationOrchestrator({
    isReady,
    onHydrationComplete: () => {
      console.log('Hydration completed');
    },
    onIntroReady: () => {
      console.log('Intro animation ready');
    },
    onHeroReady: () => {
      console.log('Hero animation ready');
    },
    onFeaturesReady: () => {
      console.log('Features animation ready');
    },
    onAnimationError: error => {
      console.error('Animation error:', error);
    },
  });

  // Initialize section-specific animations with orchestrator state
  useIntroSectionAnimation({
    introRef,
    heroHeaderRef: introHeroHeaderRef,
    animatedIconsRef: introAnimatedIconsRef,
    iconRefs: introIconRefs,
    textSegmentRefs: introTextSegmentRefs,
    placeholderIconRefs: introPlaceholderIconRefs,
    duplicateIconsContainerRef: introDuplicateIconsContainerRef,
    isEnabled: animationState.introReady,
  });

  useHeroSectionAnimation({
    heroRef,
    heroCardsRef,
    heroCard1Ref,
    heroCard2Ref,
    heroCard3Ref,
    isEnabled: animationState.heroReady,
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
    isEnabled: animationState.featuresReady,
  });

  useHomeAboutSectionAnimation({
    refs: homeAboutSectionRefs.current!,
    isEnabled: animationState.heroReady && !!homeAboutSectionRefs.current,
  });

  return (
    <>
      {!isReady && (
        <div className='fixed inset-0 bg-[#020618] z-50 flex items-center justify-center'>
          <div className='animate-pulse text-white'>Loading...</div>
        </div>
      )}
      <div
        className='landing-page'
        style={{ opacity: isReady ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <LandingNavigation />

        <IntroSection ref={introSectionRefs} />
        {/* <HeroSection ref={heroSectionRefs} /> */}
        <HomeAboutSection ref={homeAboutSectionRefs} />
        {/* <FeaturesSection ref={featuresSectionRefs} /> */}
        <OutroSection />
      </div>
    </>
  );
}
