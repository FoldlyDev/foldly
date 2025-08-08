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
      <div className='min-h-screen relative overflow-hidden bg-white dark:bg-gray-950'>
        {/* Animated background elements */}
        <div className='absolute inset-0'>
          <div className='absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-400/5 rounded-full filter blur-3xl animate-pulse' />
          <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-400/5 rounded-full filter blur-3xl animate-pulse delay-700' />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full filter blur-3xl animate-pulse delay-300' />
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
              <h1 className='text-7xl md:text-8xl font-bold text-gray-900 dark:text-white'>
                Foldly
              </h1>
            </motion.div>

            {/* Announcement */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className='space-y-6'
            >
              <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'>
                <ChefHat className='w-5 h-5 text-gray-700 dark:text-gray-300 animate-bounce' />
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Something amazing is brewing
                </span>
              </div>

              <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-200'>
                Coming Soon
              </h2>

              <p className='text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed'>
                Sign in now to experience the platform while we craft something extraordinary.
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
                    className='group min-w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <LogIn className='w-5 h-5 mr-2' />
                    Sign In
                    <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                  </Button>

                  <Button
                    size='lg'
                    variant='outline'
                    onClick={() => router.push('/sign-up')}
                    className='group min-w-[200px] border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300'
                  >
                    <UserPlus className='w-5 h-5 mr-2 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400' />
                    Create Account
                    <Sparkles className='w-5 h-5 ml-2 text-blue-600 dark:text-blue-400 group-hover:animate-pulse' />
                  </Button>
                </>
              ) : isLoaded && isSignedIn ? (
                <>
                  <Button
                    size='lg'
                    onClick={handleAuthenticatedNavigation}
                    disabled={checkingOnboarding}
                    className='group min-w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {checkingOnboarding ? (
                      <>
                        <div className='w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                        Checking status...
                      </>
                    ) : (
                      <>
                        <Home className='w-5 h-5 mr-2' />
                        Continue to Platform
                        <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
                      </>
                    )}
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
              className='text-sm text-gray-600 dark:text-gray-400 mt-16'
            >
              The team behind Foldly is crafting something exquisite 🎨
            </motion.p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
