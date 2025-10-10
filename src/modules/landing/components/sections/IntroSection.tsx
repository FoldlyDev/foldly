'use client';

import { forwardRef } from 'react';
import {
  IoDocumentOutline,
  IoFolderOpenOutline,
  IoLinkOutline,
  IoPeopleOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import { Spotlight } from '../ui/Spotlight';
import { Shimmering } from '@/components/ui/animateui';

interface IntroSectionProps {}

interface IntroSectionRefs {
  introRef: React.RefObject<HTMLElement | null>;
  heroHeaderRef: React.RefObject<HTMLDivElement | null>;
  animatedIconsRef: React.RefObject<HTMLDivElement | null>;
  iconRefs: React.RefObject<HTMLDivElement | null>[];
  textSegmentRefs: React.RefObject<HTMLSpanElement | null>[];
  placeholderIconRefs: React.RefObject<HTMLDivElement | null>[];
  duplicateIconsContainerRef: React.RefObject<HTMLDivElement | null>;
}

// Icon data - using React Icons Ionicons5 (thin outline style) that match the text content
const iconData = [
  { Icon: IoDocumentOutline, alt: 'File Icon' }, // "Collect files from"
  { Icon: IoPeopleOutline, alt: 'People Icon' }, // "anyone. No logins."
  { Icon: IoLinkOutline, alt: 'Link Icon' }, // "Create smart links"
  { Icon: IoFolderOpenOutline, alt: 'Organize Icon' }, // "that organize"
  { Icon: IoSparklesOutline, alt: 'Platform Icon' }, // "automatically on Foldly."
];

// Text segments for the animated text
const textSegments = [
  'Collect files from ',
  'anyone with ',
  'shareable links ',
  'that organize ',
  'automatically on ',
  'Foldly.',
];

export const IntroSection = forwardRef<IntroSectionRefs, IntroSectionProps>(
  (props, ref) => {
    const refs = ref as React.RefObject<IntroSectionRefs>;

    return (
      <section
        className='intro-hero min-h-[100svh]!'
        ref={refs?.current?.introRef}
      >
        <Spotlight />

        {/* SVG Gradient Definition */}
        <svg width='0' height='0' style={{ position: 'absolute' }}>
          <defs>
            <linearGradient
              id='icon-gradient'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='100%'
            >
              <stop offset='0%' stopColor='var(--foldly-gradient-start)' />
              <stop offset='100%' stopColor='var(--foldly-gradient-end)' />
            </linearGradient>
            <linearGradient
              id='icon-gradient-dark'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='100%'
            >
              <stop offset='0%' stopColor='#020618' />
              <stop offset='100%' stopColor='#4a6b85' />
            </linearGradient>
          </defs>
        </svg>

        {/* Hero Header - Initially visible, fades out */}
        <div className='intro-hero-header' ref={refs?.current?.heroHeaderRef}>
          <h1 className='mt-8 foldly-gradient-text py-4 text-center text-6xl! font-bold tracking-tight md:text-9xl!'>
            Foldly
          </h1>
          <p>One platform, endless file collection possibilities.</p>
        </div>

        {/* Animated Icons Container */}
        <div
          className='intro-animated-icons'
          ref={refs?.current?.animatedIconsRef}
        >
          {iconData.map((icon, index) => (
            <div
              key={index}
              className={`intro-animated-icon intro-icon-${index + 1}`}
              ref={refs?.current?.iconRefs[index]}
            >
              <icon.Icon
                className='w-full h-full'
                style={{ stroke: 'url(#icon-gradient)', fill: 'none' }}
              />
            </div>
          ))}
        </div>

        {/* Container for duplicate icons that will be created by GSAP */}
        <div
          className='intro-duplicate-icons-container'
          ref={refs?.current?.duplicateIconsContainerRef}
        />

        {/* Animated Text with Placeholder Icons */}
        <h1 className='intro-animated-text'>
          <div
            className='intro-placeholder-icon'
            ref={refs?.current?.placeholderIconRefs[0]}
          />
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[0]}
          >
            {textSegments[0]}
          </span>{' '}
          <div
            className='intro-placeholder-icon'
            ref={refs?.current?.placeholderIconRefs[1]}
          />
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[1]}
          >
            {textSegments[1]}
          </span>{' '}
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[2]}
          >
            {textSegments[2]}
          </span>{' '}
          <div
            className='intro-placeholder-icon'
            ref={refs?.current?.placeholderIconRefs[2]}
          />
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[3]}
          >
            {textSegments[3]}
          </span>{' '}
          <div
            className='intro-placeholder-icon'
            ref={refs?.current?.placeholderIconRefs[3]}
          />
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[4]}
          >
            {textSegments[4]}
          </span>{' '}
          <div
            className='intro-placeholder-icon'
            ref={refs?.current?.placeholderIconRefs[4]}
          />
          <span
            className='intro-text-segment'
            ref={refs?.current?.textSegmentRefs[5]}
          >
            {textSegments[5]}
          </span>
        </h1>
      </section>
    );
  }
);

IntroSection.displayName = 'IntroSection';
