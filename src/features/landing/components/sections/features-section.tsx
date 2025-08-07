'use client';

import { forwardRef } from 'react';
import { FlipCard } from '@/components/marketing/flip-card';
import { BubbleBackground } from '@/components/ui/core/bubble';

const cardData = [
  {
    id: 'card-1',
    mobileId: 'mobile-card-1',
    title: 'Create',
    number: '01',
    iconType: 'settings' as const,
    features: [
      'Custom Links',
      'Brand Your Page',
      'Set Expiration',
      'Add Instructions',
      'Control Access',
      'Track Progress',
    ],
  },
  {
    id: 'card-2',
    mobileId: 'mobile-card-2',
    title: 'Collect',
    number: '02',
    iconType: 'archive' as const,
    features: [
      'Drag & Drop',
      'No Login Required',
      'Large File Support',
      'Progress Tracking',
      'Auto Notifications',
      'Secure Storage',
    ],
  },
  {
    id: 'card-3',
    mobileId: 'mobile-card-3',
    title: 'Organize',
    number: '03',
    iconType: 'heart' as const,
    features: [
      'Auto Folders',
      'Smart Tagging',
      'Search & Filter',
      'Bulk Operations',
      'Export Options',
      'Cloud Sync',
    ],
  },
];

interface FeaturesSectionProps {}

interface FeaturesSectionRefs {
  featuresRef: React.RefObject<HTMLElement | null>;
  featuresHeaderRef: React.RefObject<HTMLDivElement | null>;
  card1Ref: React.RefObject<HTMLDivElement | null>;
  card2Ref: React.RefObject<HTMLDivElement | null>;
  card3Ref: React.RefObject<HTMLDivElement | null>;
  flipCard1InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard2InnerRef: React.RefObject<HTMLDivElement | null>;
  flipCard3InnerRef: React.RefObject<HTMLDivElement | null>;
}

export const FeaturesSection = forwardRef<
  FeaturesSectionRefs,
  FeaturesSectionProps
>((props, ref) => {
  // Extract refs from the forwarded ref object
  const refs = ref as { current: FeaturesSectionRefs };

  return (
    <section
      className='features-section w-full overflow-hidden'
      ref={refs?.current?.featuresRef}
    >
      <div className='features-header' ref={refs?.current?.featuresHeaderRef}>
        <h1>FROM SCATTERED TO SORTED</h1>
      </div>

      {/* Desktop Animated Cards */}
      <section className='cards mt-20'>
        <div className='cards-container'>
          {cardData.map((card, index) => (
            <FlipCard
              key={card.id}
              id={card.id}
              title={card.title}
              number={card.number}
              features={card.features}
              iconType={card.iconType}
              ref={
                index === 0
                  ? refs?.current?.card1Ref
                  : index === 1
                    ? refs?.current?.card2Ref
                    : refs?.current?.card3Ref
              }
              flipCardInnerRef={
                index === 0
                  ? refs?.current?.flipCard1InnerRef
                  : index === 1
                    ? refs?.current?.flipCard2InnerRef
                    : refs?.current?.flipCard3InnerRef
              }
            />
          ))}
        </div>
      </section>

      {/* Mobile Cards with Tailwind Centering */}
      <div className='mobile-cards w-full'>
        <div className='cards-container flex flex-col items-center justify-center w-full max-w-md mx-auto px-4'>
          {cardData.map((card, index) => (
            <div
              key={card.mobileId}
              className={`w-full max-w-xs mx-auto py-4 ${
                index < cardData.length - 1 ? '!mb-6' : ''
              }`}
            >
              <FlipCard
                id={card.mobileId}
                title={card.title}
                number={card.number}
                features={card.features}
                iconType={card.iconType}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';
