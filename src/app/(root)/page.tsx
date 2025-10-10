// =============================================================================
// LANDING PAGE STYLES - Module-specific imports for code splitting
// =============================================================================
import '@/modules/landing/styles/navigation/LandingNavigation.css';
import '@/modules/landing/styles/views/Landing.css';
import '@/modules/landing/styles/sections/IntroSection.css';
import '@/modules/landing/styles/sections/FeatureHighlightSection.css';
import '@/modules/landing/styles/sections/AboutSection.css';
import '@/modules/landing/styles/sections/DemoSection.css';
import '@/modules/landing/styles/sections/OutroSection.css';
import '@/modules/landing/styles/sections/FooterSection.css';
import '@/modules/landing/styles/ui/cards.css';

import { Landing } from '@/modules/landing';

/**
 * Home page - Server Component
 * Renders the client-side landing page container
 */
export default function HomePage() {
  return <Landing />;
}
