'use client';

import { useRef, useEffect, useState } from 'react';
import { IntroSection } from '../sections/intro-section';
import { useIntroSectionAnimation } from '../../hooks/useIntroSectionAnimation';
import { SkillsOutroSection, type SkillsOutroSectionRefs } from '../sections/skills-outro-section';
import {
  AboutSection,
  type AboutSectionRefs,
} from '../sections/about-section';
import { DemoSection, type DemoSectionRefs } from '../sections/demo-section';
import { FeaturesSection } from '../sections/features-section';
import { OutroSection } from '../sections/outro-section';
import { FooterSection, type FooterSectionRefs } from '../sections/footer-section';
import { LandingNavigation } from '../navigation/landing-navigation';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import { useSkillsOutroSectionAnimation } from '../../hooks/useSkillsOutroSectionAnimation';
import { useDemoSectionAnimation } from '../../hooks/useDemoSectionAnimation';
import { useFeaturesSectionAnimation } from '../../hooks/useFeaturesSectionAnimation';
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

  // Skills Outro section refs
  const skillsOutroSectionRefs = useRef<SkillsOutroSectionRefs>(null);

  // About section refs
  const aboutSectionRefs = useRef<AboutSectionRefs>(null);

  // Demo section refs
  const demoSectionRefs = useRef<DemoSectionRefs>(null);

  // Features section refs
  const featuresRef = useRef<HTMLElement>(null);
  const featuresHeaderRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const flipCard1InnerRef = useRef<HTMLDivElement>(null);
  const flipCard2InnerRef = useRef<HTMLDivElement>(null);
  const flipCard3InnerRef = useRef<HTMLDivElement>(null);

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

  // Disable browser scroll restoration to prevent conflicts with ScrollTrigger animations
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Ensure we start at the top on page load
    window.scrollTo(0, 0);
    
    return () => {
      // Re-enable scroll restoration when leaving the page
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
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
    onAboutReady: () => {
      console.log('About animation ready');
    },
    onSkillsOutroReady: () => {
      console.log('Skills Outro animation ready');
    },
    onDemoReady: () => {
      console.log('Demo animation ready');
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

  useSkillsOutroSectionAnimation({
    refs: skillsOutroSectionRefs.current!,
    isEnabled: animationState.skillsOutroReady && !!skillsOutroSectionRefs.current,
  });

  useDemoSectionAnimation({
    refs: demoSectionRefs.current!,
    isEnabled: animationState.demoReady && !!demoSectionRefs.current,
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

  useAboutSectionAnimation({
    refs: aboutSectionRefs.current!,
    isEnabled: animationState.aboutReady && !!aboutSectionRefs.current,
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
        <AboutSection ref={aboutSectionRefs} />
        <SkillsOutroSection ref={skillsOutroSectionRefs} />
        <DemoSection ref={demoSectionRefs} />
        {/* <FeaturesSection ref={featuresSectionRefs} /> */}
        <OutroSection />
        <FooterSection ref={footerSectionRefs} />
      </div>
    </>
  );
}
