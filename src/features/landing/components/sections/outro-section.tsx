'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { OutroStrip } from '../../types';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

const outroStrips: OutroStrip[] = [
  {
    id: 'os-1',
    speed: 0.3,
    skills: [
      { text: 'Frontend', variant: 'skill-var-1' },
      { text: 'UX', variant: 'skill-var-2' },
      { text: 'Vibe Check', variant: 'skill-var-3' },
      { text: 'Clean Code', variant: 'skill-var-1' },
      { text: 'Creative Flow', variant: 'skill-var-3' },
      { text: 'Pixel Logic', variant: 'skill-var-1' },
    ],
  },
  {
    id: 'os-2',
    speed: 0.4,
    skills: [
      { text: 'Motion', variant: 'skill-var-2' },
      { text: 'Taste', variant: 'skill-var-3' },
      { text: 'Grid Game', variant: 'skill-var-1' },
    ],
  },
  {
    id: 'os-3',
    speed: 0.25,
    skills: [
      { text: 'Details', variant: 'skill-var-2' },
      { text: 'Toronto Core', variant: 'skill-var-3' },
      { text: 'Builds', variant: 'skill-var-1' },
      { text: 'Case Studies', variant: 'skill-var-2' },
      { text: 'Scroll Love', variant: 'skill-var-3' },
      { text: 'Easings', variant: 'skill-var-3' },
      { text: 'HTML Mindset', variant: 'skill-var-1' },
    ],
  },
  {
    id: 'os-4',
    speed: 0.35,
    skills: [
      { text: 'Type Systems', variant: 'skill-var-1' },
      { text: 'Keyframes', variant: 'skill-var-2' },
      { text: 'Component Life', variant: 'skill-var-3' },
    ],
  },
  {
    id: 'os-5',
    speed: 0.2,
    skills: [
      { text: 'Side Projects', variant: 'skill-var-1' },
      { text: 'Studio Vibes', variant: 'skill-var-2' },
      { text: 'GSAP Fanboy', variant: 'skill-var-3' },
      { text: 'No Filler', variant: 'skill-var-1' },
      { text: 'Live Sites', variant: 'skill-var-2' },
      { text: 'Canada Mode', variant: 'skill-var-3' },
      { text: 'Launch Ready', variant: 'skill-var-1' },
      { text: 'CodegridPRO', variant: 'skill-var-2' },
    ],
  },
  {
    id: 'os-6',
    speed: 0.25,
    skills: [
      { text: 'UI Nerd', variant: 'skill-var-3' },
      { text: 'Quietly Bold', variant: 'skill-var-1' },
      { text: 'Shipped', variant: 'skill-var-2' },
      { text: 'Real CSS', variant: 'skill-var-3' },
    ],
  },
];

export function OutroSection() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const outroHeader = document.querySelector('.outro h3');
    let outroSplit: SplitText | null = null;

    if (outroHeader) {
      outroSplit = new SplitText(outroHeader, {
        type: 'words',
        wordsClass: 'outro-word',
      });

      gsap.set(outroSplit.words, { opacity: 0 });
    }

    const outroStripElements = document.querySelectorAll('.outro-strip');

    ScrollTrigger.create({
      trigger: '.outro',
      start: 'top top',
      end: `+=${window.innerHeight * 3}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        if (outroSplit && outroSplit.words.length > 0) {
          if (progress >= 0.25 && progress <= 0.75) {
            const textProgress = (progress - 0.25) / 0.5;
            const totalWords = outroSplit.words.length;

            outroSplit.words.forEach((word: Element, index: number) => {
              const wordRevealProgress = index / totalWords;

              if (textProgress >= wordRevealProgress) {
                gsap.set(word, { opacity: 1 });
              } else {
                gsap.set(word, { opacity: 0 });
              }
            });
          } else if (progress < 0.25) {
            gsap.set(outroSplit.words, { opacity: 0 });
          } else if (progress > 0.75) {
            gsap.set(outroSplit.words, { opacity: 1 });
          }
        }
      },
    });

    ScrollTrigger.create({
      trigger: '.outro',
      start: 'top bottom',
      end: `+=${window.innerHeight * 6}px`,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        outroStripElements.forEach((strip, index) => {
          const stripData = outroStrips[index];
          if (stripData) {
            const movement = progress * 100 * stripData.speed;
            gsap.set(strip, {
              x: `${movement}%`,
            });
          }
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      outroSplit?.revert();
    };
  }, []);

  return (
    <section className="outro">
      <div className="container">
        <h3>Scroll ends but ideas don't</h3>
      </div>
      <div className="outro-strips">
        {outroStrips.map((strip) => (
          <div key={strip.id} className={`outro-strip ${strip.id}`}>
            {strip.skills.map((skill, index) => (
              <div key={index} className={`skill ${skill.variant}`}>
                <p className="mono">{skill.text}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}