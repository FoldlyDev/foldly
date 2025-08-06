'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { landingCardData } from '../../constants/card-data';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HomeServicesSection() {
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 1000) return;

    const smoothStep = (p: number) => p * p * (3 - 2 * p);

    ScrollTrigger.create({
      trigger: '.home-services',
      start: 'top top',
      end: `+=${window.innerHeight * 4}px`,
      pin: '.home-services',
      pinSpacing: true,
    });

    ScrollTrigger.create({
      trigger: '.home-services',
      start: 'top bottom',
      end: `+=${window.innerHeight * 4}`,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        const headerProgress = gsap.utils.clamp(0, 1, progress / 0.9);
        const headerY = gsap.utils.interpolate(
          '300%',
          '0%',
          smoothStep(headerProgress)
        );
        gsap.set('.home-services-header', {
          y: headerY,
        });

        ['#card-1', '#card-2', '#card-3'].forEach((cardId, index) => {
          const delay = index * 0.5;
          const cardProgress = gsap.utils.clamp(
            0,
            1,
            (progress - delay * 0.1) / (0.9 - delay * 0.1)
          );

          const innerCard = document.querySelector(
            `${cardId} .flip-card-inner`
          );

          let y;
          if (cardProgress < 0.4) {
            const normalizedProgress = cardProgress / 0.4;
            y = gsap.utils.interpolate(
              '-100%',
              '50%',
              smoothStep(normalizedProgress)
            );
          } else if (cardProgress < 0.6) {
            const normalizedProgress = (cardProgress - 0.4) / 0.2;
            y = gsap.utils.interpolate(
              '50%',
              '0%',
              smoothStep(normalizedProgress)
            );
          } else {
            y = '0%';
          }

          let scale;
          if (cardProgress < 0.4) {
            const normalizedProgress = cardProgress / 0.4;
            scale = gsap.utils.interpolate(
              0.25,
              0.75,
              smoothStep(normalizedProgress)
            );
          } else if (cardProgress < 0.6) {
            const normalizedProgress = (cardProgress - 0.4) / 0.2;
            scale = gsap.utils.interpolate(
              0.75,
              1,
              smoothStep(normalizedProgress)
            );
          } else {
            scale = 1;
          }

          let opacity;
          if (cardProgress < 0.2) {
            const normalizedProgress = cardProgress / 0.2;
            opacity = smoothStep(normalizedProgress);
          } else {
            opacity = 1;
          }

          let x, rotate, rotationY;
          if (cardProgress < 0.6) {
            x = index === 0 ? '100%' : index === 1 ? '0%' : '-100%';
            rotate = index === 0 ? -5 : index === 1 ? 0 : 5;
            rotationY = 0;
          } else if (cardProgress < 1) {
            const normalizedProgress = (cardProgress - 0.6) / 0.4;
            x = gsap.utils.interpolate(
              index === 0 ? '100%' : index === 1 ? '0%' : '-100%',
              '0%',
              smoothStep(normalizedProgress)
            );
            rotate = gsap.utils.interpolate(
              index === 0 ? -5 : index === 1 ? 0 : 5,
              0,
              smoothStep(normalizedProgress)
            );
            rotationY = smoothStep(normalizedProgress) * 180;
          } else {
            x = '0%';
            rotate = 0;
            rotationY = 180;
          }

          gsap.set(cardId, {
            opacity: opacity,
            y: y,
            x: x,
            rotate: rotate,
            scale: scale,
          });

          if (innerCard) {
            gsap.set(innerCard, {
              rotationY: rotationY,
            });
          }
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section className="home-services">
      <div className="container">
        <div className="home-services-header">
          <p className="md">Equipped and ready for scroll battles</p>
        </div>
      </div>
      <div className="home-services-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s3-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
            <div className="symbol">
              <Image
                src="/assets/landing/symbols/s1-dark.png"
                alt="Symbol"
                width={18}
                height={18}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="home-services-bottom-bar">
        <div className="container">
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.2"
            data-animate-on-scroll="true"
          >
            <span>▶</span> Deployed abilities
          </p>
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
            data-animate-on-scroll="true"
          >
            [ Stats synced: 2025 ]
          </p>
        </div>
      </div>
      <div className="cards">
        <div className="cards-container">
          {landingCardData.map((card) => (
            <div key={card.id} className="card" id={card.id}>
              <div className="card-wrapper">
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <div className="card-title">
                      <p className="mono">{card.title}</p>
                      <p className="mono">{card.number}</p>
                    </div>
                    <div className="card-title">
                      <p className="mono">{card.number}</p>
                      <p className="mono">{card.title}</p>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div className="card-title">
                      <p className="mono">{card.title}</p>
                      <p className="mono">{card.number}</p>
                    </div>
                    <div className="card-copy">
                      {card.features.map((feature) => (
                        <p key={feature}>{feature}</p>
                      ))}
                    </div>
                    <div className="card-title">
                      <p className="mono">{card.number}</p>
                      <p className="mono">{card.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}