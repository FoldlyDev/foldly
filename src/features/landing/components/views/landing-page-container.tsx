'use client';

import { useRef, useEffect, useState } from 'react';
import { IntroSection } from '../sections/intro-section';
import { useIntroSectionAnimation } from '../../hooks/useIntroSectionAnimation';
import { AnimationErrorBoundary } from '../ui/animation-error-boundary';
import {
  FeatureHighlightSection,
  type FeatureHighlightSectionRefs,
} from '../sections/feature-highlight-section';
import { AboutSection, type AboutSectionRefs } from '../sections/about-section';
import { DemoSection, type DemoSectionRefs } from '../sections/demo-section';
import { OutroSection } from '../sections/outro-section';
import {
  FooterSection,
  type FooterSectionRefs,
} from '../sections/footer-section';
import { LandingNavigation } from '../navigation/landing-navigation';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import { useFeatureHighlightSectionAnimation } from '../../hooks/useFeatureHighlightSectionAnimation';
import { useDemoSectionAnimation } from '../../hooks/useDemoSectionAnimation';
import { useAboutSectionAnimation } from '../../hooks/useAboutSectionAnimation';
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

  // Feature Highlight section refs
  const featureHighlightSectionRefs = useRef<FeatureHighlightSectionRefs>(null);

  // About section refs
  const aboutSectionRefs = useRef<AboutSectionRefs>(null);

  // Demo section refs
  const demoSectionRefs = useRef<DemoSectionRefs>(null);

  // Footer section refs
  const footerSectionRefs = useRef<FooterSectionRefs>(null);

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

  // Disable browser scroll restoration to prevent conflicts with ScrollTrigger animations
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    return () => {
      // Re-enable scroll restoration when leaving the page
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Initialize animation orchestrator - single source of truth
  const { animationState, registerScrollTrigger, registerCleanup } =
    useLandingAnimationOrchestrator({
      isReady,
      onHydrationComplete: () => {
        console.log('Hydration completed');
      },
      onIntroReady: () => {
        console.log('Intro animation ready');
      },
      onAboutReady: () => {
        console.log('About animation ready');
      },
      onFeatureHighlightReady: () => {
        console.log('Feature Highlight animation ready');
      },
      onDemoReady: () => {
        console.log('Demo animation ready');
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
    registerScrollTrigger,
    registerCleanup,
    prefersReducedMotion: animationState.prefersReducedMotion,
  });

  useFeatureHighlightSectionAnimation({
    refs: featureHighlightSectionRefs.current || {},
    isEnabled:
      animationState.featureHighlightReady &&
      !!featureHighlightSectionRefs.current &&
      !animationState.prefersReducedMotion,
  });

  useDemoSectionAnimation({
    refs: demoSectionRefs.current || {},
    isEnabled:
      animationState.demoReady &&
      !!demoSectionRefs.current &&
      !animationState.prefersReducedMotion,
  });

  useAboutSectionAnimation({
    refs: aboutSectionRefs.current || {},
    isEnabled:
      animationState.aboutReady &&
      !!aboutSectionRefs.current &&
      !animationState.prefersReducedMotion,
  });

  return (
    <AnimationErrorBoundary>
      {!isReady && (
        <div className='fixed inset-0 bg-[#020618] z-50 flex items-center justify-center'>
          <div className='text-white'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
            <p className='text-lg'>Initializing animations...</p>
          </div>
        </div>
      )}
      {animationState.hasError && (
        <div className='fixed inset-0 bg-[#020618] z-50 flex items-center justify-center'>
          <div className='text-white text-center'>
            <p className='text-xl mb-4'>Failed to load animations</p>
            <button
              onClick={() => window.location.reload()}
              className='px-6 py-2 bg-white text-black rounded hover:bg-gray-100'
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
      <div
        className='landing-page'
        style={{
          opacity: isReady && !animationState.hasError ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <LandingNavigation />

        <IntroSection ref={introSectionRefs} />
        <AboutSection ref={aboutSectionRefs} />
        <FeatureHighlightSection ref={featureHighlightSectionRefs} />
        <DemoSection ref={demoSectionRefs} />
        <OutroSection />
        <FooterSection ref={footerSectionRefs} />
      </div>
    </AnimationErrorBoundary>
  );
}
