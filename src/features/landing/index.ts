// Landing Feature Exports
// Export landing components, hooks, and types

// Main pages
export { HomePage } from './components/home-page';
export { HomePage as LandingPageContainer } from './components/home-page';

// UI Components
export { Menu } from './components/ui/menu';
export { Transition } from './components/ui/transition';
export { Footer } from './components/ui/footer';

// Sections
export { HeroSection } from './components/sections/hero-section';
export { HomeAboutSection } from './components/sections/home-about-section';
export { HomeServicesSection } from './components/sections/home-services-section';
export { HomeSpotlightSection } from './components/sections/home-spotlight-section';
export { OutroSection } from './components/sections/outro-section';

// Hooks
export { useLenisScroll } from './hooks/use-lenis-scroll';
export { useAnimatedElement, useScrambleAnimation, useRevealAnimation, useLineRevealAnimation } from './hooks/use-animations';

// Types
export type * from './types';
