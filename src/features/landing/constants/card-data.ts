/**
 * Shared card data for landing page sections
 * Used in both HeroSection and HomeServicesSection for consistency
 */
export const landingCardData = [
  {
    id: 'card-1',
    heroId: 'hero-card-1',
    mobileId: 'mobile-card-1',
    title: 'Create',
    number: '01',
    features: ['Custom Links', 'Brand Your Page', 'Set Expiration'],
    iconType: 'settings' as const,
  },
  {
    id: 'card-2',
    heroId: 'hero-card-2',
    mobileId: 'mobile-card-2',
    title: 'Collect',
    number: '02',
    features: ['Drag & Drop', 'No Login Required', 'Large File Support'],
    iconType: 'heart' as const,
  },
  {
    id: 'card-3',
    heroId: 'hero-card-3',
    mobileId: 'mobile-card-3',
    title: 'Organize',
    number: '03',
    features: ['Auto Folders', 'Smart Tagging', 'Search & Filter'],
    iconType: 'archive' as const,
  },
];

export type LandingCardData = typeof landingCardData[0];