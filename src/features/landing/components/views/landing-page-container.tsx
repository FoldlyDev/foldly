'use client';

import { useRef, useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { IntroSection } from '../sections/intro-section';
import { useIntroSectionAnimation } from '../../hooks/useIntroSectionAnimation';
import { HeroSection } from '../sections/hero-section';
import { AboutSection } from '../sections/about-section';
import { FeaturesSection } from '../sections/features-section';
import { OutroSection } from '../sections/outro-section';
import { LandingNavigation } from '../navigation/landing-navigation';
import { useLenisScroll } from '../../hooks/useLenisScroll';
import '../../styles/menu.css';
import { useHeroSectionAnimation } from '../../hooks/useHeroSectionAnimation';
import { useFeaturesSectionAnimation } from '../../hooks/useFeaturesSectionAnimation';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/core/shadcn/button';
import {
  ArrowRight,
  LogIn,
  UserPlus,
  Sparkles,
  Home,
  ChefHat,
} from 'lucide-react';
import { checkOnboardingStatusAction } from '@/features/onboarding/lib/actions';
import { useState } from 'react';

/**
 * Client-side container component for the landing page
 * Handles all hooks and client-side logic while keeping the page component as Server Component
 */
export function LandingPageContainer() {
  // Auth and routing
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

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
      {/* <LandingNavigation />
      <div className='landing-page'>
        <IntroSection ref={introSectionRefs} />
        <HeroSection ref={heroSectionRefs} />
        <AboutSection />
        <FeaturesSection ref={featuresSectionRefs} />
        <OutroSection />
      </div> */}
      <div className='min-h-screen relative overflow-hidden' style={{ background: 'var(--foldly-light-gradient-radial)' }}>
        {/* Animated background elements */}
        <div className='absolute inset-0'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-pulse' />
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-pulse delay-700' />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-tertiary/5 rounded-full filter blur-3xl animate-pulse delay-300' />
        </div>

        {/* Main content */}
        <div className='relative z-10 min-h-screen flex items-center justify-center p-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className='max-w-4xl w-full text-center space-y-8'
          >
            {/* Logo/Brand */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className='mb-12'
            >
              <div className='inline-flex items-center justify-center p-4 rounded-2xl bg-white/50 dark:bg-black/50 backdrop-blur-lg border border-neutral-200 dark:border-neutral-800 shadow-xl'>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent'>
                  Foldly
                </h1>
              </div>
            </motion.div>

            {/* Announcement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='space-y-6'
            >
              <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30'>
                <ChefHat className='w-5 h-5 text-primary animate-bounce' />
                <span className='text-sm font-medium text-primary dark:text-primary'>
                  Something amazing is cooking
                </span>
              </div>

              <h2 className='text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100'>
                Top-notch landing page
                <span className='block text-3xl md:text-4xl mt-2 text-neutral-700 dark:text-neutral-300'>
                  coming soon
                </span>
              </h2>

              <p className='text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed'>
                In the meantime, you can sign in and use the platform as normal.
                <span className='block mt-2 text-base'>
                  The team behind Foldly is cooking up something exquisite 🤤
                </span>
              </p>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-8'
            >
              {isLoaded && !isSignedIn ? (
                <>
                  <Button
                    size='lg'
                    onClick={() => router.push('/sign-in')}
                    className='group min-w-[200px] bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <LogIn className='w-5 h-5 mr-2' />
                    Sign In
                    <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                  </Button>

                  <Button
                    size='lg'
                    variant='outline'
                    onClick={() => router.push('/sign-up')}
                    className='group min-w-[200px] border-2 border-gray-300 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-all duration-300'
                  >
                    <UserPlus className='w-5 h-5 mr-2 text-gray-600 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400' />
                    Create Account
                    <Sparkles className='w-5 h-5 ml-2 text-cyan-600 dark:text-cyan-400 group-hover:animate-pulse' />
                  </Button>
                </>
              ) : isLoaded && isSignedIn ? (
                <>
                  <Button
                    size='lg'
                    onClick={() => router.push('/dashboard')}
                    className='group min-w-[200px] bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <Home className='w-5 h-5 mr-2' />
                    Go to Dashboard
                    <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                  </Button>

                  <Button
                    size='lg'
                    variant='outline'
                    onClick={() => router.push('/onboarding')}
                    className='group min-w-[200px] border-2 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300'
                  >
                    <Sparkles className='w-5 h-5 mr-2 text-primary' />
                    Onboarding
                  </Button>
                </>
              ) : (
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse' />
                  <div className='w-40 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse' />
                  <div className='w-40 h-12 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse' />
                </div>
              )}
            </motion.div>

            {/* Footer note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className='text-sm text-gray-500 dark:text-gray-500 mt-16'
            >
              The team behind Foldly is crafting something exquisite 🎨
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
