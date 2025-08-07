'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAnimations } from '../../lib/animations';
import { FlipCard } from '@/components/marketing/flip-card';
import { useUser } from '@clerk/nextjs';
import { landingCardData } from '../../constants/card-data';
import BackgroundHighlight from '../ui/background-highlight';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HeroSection() {
  const { user } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize animations for data-animate elements
    initAnimations();

    // Hero cards animation
    gsap.set('.hero .hero-cards .card', { transformOrigin: 'center center' });

    gsap.to('.hero .hero-cards .card', {
      scale: 1,
      duration: 0.75,
      delay: 0.25,
      stagger: 0.1,
      ease: 'power4.out',
      onComplete: () => {
        gsap.set('#hero-card-1', { transformOrigin: 'top right' });
        gsap.set('#hero-card-3', { transformOrigin: 'top left' });
      },
    });

    const smoothStep = (p: number) => p * p * (3 - 2 * p);

    if (window.innerWidth > 1000) {
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: '75% top',
        scrub: 1,
        onUpdate: self => {
          const progress = self.progress;

          const heroCardsContainerOpacity = gsap.utils.interpolate(
            1,
            0.5,
            smoothStep(progress)
          );
          gsap.set('.hero-cards', {
            opacity: heroCardsContainerOpacity,
          });

          ['#hero-card-1', '#hero-card-2', '#hero-card-3'].forEach(
            (cardId, index) => {
              const delay = index * 0.9;
              const cardProgress = gsap.utils.clamp(
                0,
                1,
                (progress - delay * 0.1) / (1 - delay * 0.1)
              );

              const y = gsap.utils.interpolate(
                '0%',
                '400%',
                smoothStep(cardProgress)
              );
              const scale = gsap.utils.interpolate(
                1,
                0.75,
                smoothStep(cardProgress)
              );

              let x = '0%';
              let rotation = 0;
              if (index === 0) {
                x = gsap.utils.interpolate(
                  '0%',
                  '90%',
                  smoothStep(cardProgress)
                );
                rotation = gsap.utils.interpolate(
                  0,
                  -15,
                  smoothStep(cardProgress)
                );
              } else if (index === 2) {
                x = gsap.utils.interpolate(
                  '0%',
                  '-90%',
                  smoothStep(cardProgress)
                );
                rotation = gsap.utils.interpolate(
                  0,
                  15,
                  smoothStep(cardProgress)
                );
              }

              gsap.set(cardId, {
                y: y,
                x: x,
                rotation: rotation,
                scale: scale,
              });
            }
          );
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <BackgroundHighlight>
      <section className='hero' id='home'>
        <div className='home-services-top-bar relative z-20'>
          <div className='container'>
            <div className='symbols-container'>
              <div className='symbol'>
                <Image
                  src='/assets/landing/symbols/s1-dark.png'
                  alt='Symbol'
                  width={18}
                  height={18}
                />
              </div>
            </div>
            <div className='symbols-container'>
              <div className='symbol'>
                <Image
                  src='/assets/landing/symbols/s1-dark.png'
                  alt='Symbol'
                  width={18}
                  height={18}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className='container relative z-20'
          style={{ overflow: 'visible' }}
        >
          <div className='hero-content'>
            <div className='hero-header'>
              <h1 data-animate-type='reveal' data-animate-delay='0.25'>
                FOLDLY
              </h1>
            </div>
            <div className='hero-footer'>
              <div className='hero-footer-copy'>
                <p
                  className='md'
                  data-animate-type='line-reveal'
                  data-animate-delay='0.25'
                >
                  Create custom branded upload links for clients. Collect files
                  without friction - no logins required. Organize everything
                  automatically with smart folders and real-time notifications.
                </p>
              </div>
              <div className='hero-footer-tags'>
                <p
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay='0.5'
                >
                  <span>▶</span> Interface Alchemy
                </p>
                <p
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay='0.5'
                >
                  <span>▶</span> Scroll Sorcery
                </p>
              </div>
            </div>
          </div>
          <div className='hero-cards'>
            {landingCardData.map(card => (
              <FlipCard
                key={card.heroId}
                id={card.heroId}
                title={card.title}
                number={card.number}
                features={card.features}
                iconType={card.iconType}
              />
            ))}
          </div>
          <div className='hero-mobile-description'>
            <p className='md'>
              Create custom branded upload links for clients. Collect files
              without friction - no logins required. Organize everything
              automatically with smart folders and real-time notifications.
            </p>
            <Link
              href={user ? '/dashboard/workspace' : '/sign-in'}
              className='hero-mobile-cta'
            >
              {user ? 'Go to Dashboard' : 'Get Started Now'}
            </Link>
          </div>
        </div>
      </section>
    </BackgroundHighlight>
  );
}
