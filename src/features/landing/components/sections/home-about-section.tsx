'use client';

import Image from 'next/image';
import type { AnimationProps, SkillCard } from '../../types';

const skillCards: SkillCard[] = [
  { id: '1', moveNumber: '[ Move 01 ]', title: 'Strategy' },
  { id: '2', moveNumber: '[ Move 02 ]', title: 'Wireframing' },
  { id: '3', moveNumber: '[ Move 03 ]', title: 'Branding' },
  { id: '4', moveNumber: '[ Move 04 ]', title: 'Dev' },
];

export function HomeAboutSection() {
  return (
    <section className='home-about'>
      <div className='container'>
        <div className='home-about-col'>
          <div className='symbols-container'>
            <div className='symbol'>
              <Image
                src='/assets/landing/symbols/s2-light.png'
                alt='Symbol'
                width={18}
                height={18}
              />
            </div>
          </div>
          <div className='home-about-header'>
            <p
              className='mono'
              data-animate-type='scramble'
              data-animate-delay='0.2'
              data-animate-on-scroll='true'
            >
              <span>▶</span> Skillset
            </p>
            <h3
              data-animate-type='line-reveal'
              data-animate-delay='0.2'
              data-animate-on-scroll='true'
              className='home-about-header-text'
            >
              Stuff I've leveled up so you don't have to
            </h3>
          </div>
        </div>
        <div className='home-about-col'>
          <div className='home-about-col-row'>
            {skillCards.slice(0, 2).map((card, index) => (
              <div key={card.id} className='home-about-card'>
                <p
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay={`${0.2 + index * 0.05}`}
                  data-animate-on-scroll='true'
                >
                  {card.moveNumber}
                </p>
                <h4
                  data-animate-type='line-reveal'
                  data-animate-delay={`${0.2 + index * 0.05}`}
                  data-animate-on-scroll='true'
                >
                  {card.title}
                </h4>
              </div>
            ))}
          </div>
          <div className='home-about-col-row'>
            {skillCards.slice(2, 4).map((card, index) => (
              <div key={card.id} className='home-about-card'>
                <p
                  className='mono'
                  data-animate-type='scramble'
                  data-animate-delay={`${0.3 + index * 0.05}`}
                  data-animate-on-scroll='true'
                >
                  {card.moveNumber}
                </p>
                <h4
                  data-animate-type='line-reveal'
                  data-animate-delay={`${0.3 + index * 0.05}`}
                  data-animate-on-scroll='true'
                >
                  {card.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
