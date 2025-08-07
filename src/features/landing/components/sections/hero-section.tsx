'use client';

import { forwardRef } from 'react';
import { Diamond } from '@/components/ui/core/diamond';
import { FlipCard } from '@/components/marketing/flip-card';
import { BubbleBackground } from '@/components/ui/core/bubble';
import { GradientButton } from '@/components/ui/core/gradient-button';
import { SignUpButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface HeroSectionProps {}

interface HeroSectionRefs {
  heroRef: React.RefObject<HTMLElement | null>;
  heroCardsRef: React.RefObject<HTMLDivElement | null>;
  heroCard1Ref: React.RefObject<HTMLDivElement | null>;
  heroCard2Ref: React.RefObject<HTMLDivElement | null>;
  heroCard3Ref: React.RefObject<HTMLDivElement | null>;
}

// Diamond row configuration
interface DiamondRowConfig {
  variants: Array<'primary' | 'secondary' | 'tertiary'>;
  text: string;
  className: string;
}

// Diamond row data configuration
const diamondRowsConfig: DiamondRowConfig[] = [
  {
    variants: [
      'primary',
      'secondary',
      'tertiary',
      'tertiary',
      'secondary',
      'primary',
    ],
    text: 'With foldly',
    className: 'hero-diamonds-top',
  },
  {
    variants: [
      'secondary',
      'tertiary',
      'primary',
      'primary',
      'tertiary',
      'secondary',
    ],
    text: 'MADE SIMPLE',
    className: 'hero-diamonds-bottom',
  },
];

// Hero cards configuration
const heroCardData = [
  {
    id: 'hero-card-1',
    title: 'Create',
    number: '01',
    features: ['Custom Links', 'Brand Your Page', 'Set Expiration'],
    iconType: 'settings' as const,
  },
  {
    id: 'hero-card-2',
    title: 'Collect',
    number: '02',
    features: ['Drag & Drop', 'No Login Required', 'Large File Support'],
    iconType: 'heart' as const,
  },
  {
    id: 'hero-card-3',
    title: 'Organize',
    number: '03',
    features: ['Auto Folders', 'Smart Tagging', 'Search & Filter'],
    iconType: 'archive' as const,
  },
];

const HeroCTA: React.FC = () => {
  const { user } = useUser();

  if (user) {
    return (
      <Link href='/dashboard/workspace'>
        <GradientButton className='hero-cta-button' variant='primary' size='lg'>
          Go to Dashboard
        </GradientButton>
      </Link>
    );
  } else {
    return (
      <SignUpButton>
        <GradientButton className='hero-cta-button' variant='primary' size='lg'>
          Get Started Now
        </GradientButton>
      </SignUpButton>
    );
  }
};

export const HeroSection = forwardRef<HeroSectionRefs, HeroSectionProps>(
  (props, ref) => {
    // Extract refs from the forwarded ref object
    const refs = ref as React.RefObject<HeroSectionRefs>;

    return (
      <>
        <section className='hero' ref={refs?.current?.heroRef}>
          {/* Hero Header - Groups title with its decorations */}
          <div className='hero-header'>
            {/* Main Title */}
            <h1 className='hero-main-title'>FILE COLLECTION</h1>
          </div>

          {/* Hero Cards */}
          <div className='hero-cards' ref={refs?.current?.heroCardsRef}>
            {heroCardData.map((card, index) => (
              <FlipCard
                key={card.id}
                id={card.id}
                title={card.title}
                number={card.number}
                features={card.features}
                iconType={card.iconType}
                className='hero-flip-card'
                ref={
                  index === 0
                    ? refs?.current?.heroCard1Ref
                    : index === 1
                      ? refs?.current?.heroCard2Ref
                      : refs?.current?.heroCard3Ref
                }
              />
            ))}
          </div>

          {/* Hero Description & CTA */}
          <div className='hero-description'>
            <div className='hero-description-content'>
              <p className='hero-description-text'>
                Create custom branded upload links for clients. Collect files
                without friction - no logins required. Organize everything
                automatically with smart folders and real-time notifications.
              </p>
              <HeroCTA />
            </div>
          </div>
        </section>
      </>
    );
  }
);

HeroSection.displayName = 'HeroSection';
