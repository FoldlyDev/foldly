'use client';

import { useEffect } from 'react';
import { Menu } from './ui/menu';
import { Transition } from './ui/transition';
import { Footer } from './ui/footer';
import { HeroSection } from './sections/hero-section';
import { HomeAboutSection } from './sections/home-about-section';
import { HomeServicesSection } from './sections/home-services-section';
import { HomeSpotlightSection } from './sections/home-spotlight-section';
import { OutroSection } from './sections/outro-section';
import { useLenisScroll } from '../hooks/use-lenis-scroll';
import { useAnimatedElement } from '../hooks/use-animations';

export function HomePage() {
  // Initialize smooth scroll
  useLenisScroll();
  
  // Initialize animations - this hook already handles initialization internally
  useAnimatedElement();

  return (
    <div className="landing-page">
      <Transition />
      <Menu />
      <main>
        <HeroSection />
        <HomeAboutSection />
        <HomeServicesSection />
        <HomeSpotlightSection />
        <OutroSection />
      </main>
      <Footer />
    </div>
  );
}