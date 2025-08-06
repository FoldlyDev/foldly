'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Matter from 'matter-js';
import { useAnimatedElement } from '../../hooks/use-animations';

export function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<any[]>([]);
  
  const { animateOnScroll } = useAnimatedElement();

  useEffect(() => {
    if (!containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger, SplitText);

    // Initialize text animations for anime-text paragraphs
    const animeTextParagraphs = containerRef.current.querySelectorAll('.anime-text p');
    const wordHighlightBgColor = '191, 188, 180';
    const keywords = [
      'corner',
      'scroll',
      'archive',
      'learnings',
      'rhythm',
      'detail',
      'deploy',
      'caffeine',
      'messing',
    ];

    animeTextParagraphs.forEach((paragraph) => {
      const text = paragraph.textContent || '';
      const words = text.split(/\s+/);
      paragraph.innerHTML = '';

      words.forEach((word) => {
        if (word.trim()) {
          const wordContainer = document.createElement('div');
          wordContainer.className = 'word';

          const wordText = document.createElement('span');
          wordText.textContent = word;

          const normalizedWord = word.toLowerCase().replace(/[.,!?;:"]/g, '');
          if (keywords.includes(normalizedWord)) {
            wordContainer.classList.add('keyword-wrapper');
            wordText.classList.add('keyword', normalizedWord);
          }

          wordContainer.appendChild(wordText);
          paragraph.appendChild(wordContainer);
        }
      });
    });

    // Anime text container scroll animation
    const animeTextContainer = containerRef.current.querySelector('.anime-text-container');
    if (animeTextContainer) {
      ScrollTrigger.create({
        trigger: animeTextContainer,
        pin: animeTextContainer,
        start: 'top top',
        end: `+=${window.innerHeight * 4}`,
        pinSpacing: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const words = Array.from(animeTextContainer.querySelectorAll('.anime-text .word'));
          const totalWords = words.length;

          words.forEach((word: any, index) => {
            const wordText = word.querySelector('span');

            if (progress <= 0.7) {
              const progressTarget = 0.7;
              const revealProgress = Math.min(1, progress / progressTarget);

              const overlapWords = 15;
              const totalAnimationLength = 1 + overlapWords / totalWords;

              const wordStart = index / totalWords;
              const wordEnd = wordStart + overlapWords / totalWords;

              const timelineScale =
                1 /
                Math.min(
                  totalAnimationLength,
                  1 + (totalWords - 1) / totalWords + overlapWords / totalWords
                );

              const adjustedStart = wordStart * timelineScale;
              const adjustedEnd = wordEnd * timelineScale;
              const duration = adjustedEnd - adjustedStart;

              const wordProgress =
                revealProgress <= adjustedStart
                  ? 0
                  : revealProgress >= adjustedEnd
                  ? 1
                  : (revealProgress - adjustedStart) / duration;

              word.style.opacity = wordProgress;

              const backgroundFadeStart =
                wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
              const backgroundOpacity = Math.max(0, 1 - backgroundFadeStart);
              word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${backgroundOpacity})`;

              const textRevealThreshold = 0.9;
              const textRevealProgress =
                wordProgress >= textRevealThreshold
                  ? (wordProgress - textRevealThreshold) / (1 - textRevealThreshold)
                  : 0;
              wordText.style.opacity = Math.pow(textRevealProgress, 0.5);
            } else {
              const reverseProgress = (progress - 0.7) / 0.3;
              word.style.opacity = 1;
              const targetTextOpacity = 1;

              const reverseOverlapWords = 5;
              const reverseWordStart = index / totalWords;
              const reverseWordEnd = reverseWordStart + reverseOverlapWords / totalWords;

              const reverseTimelineScale =
                1 /
                Math.max(
                  1,
                  (totalWords - 1) / totalWords + reverseOverlapWords / totalWords
                );

              const reverseAdjustedStart = reverseWordStart * reverseTimelineScale;
              const reverseAdjustedEnd = reverseWordEnd * reverseTimelineScale;
              const reverseDuration = reverseAdjustedEnd - reverseAdjustedStart;

              const reverseWordProgress =
                reverseProgress <= reverseAdjustedStart
                  ? 0
                  : reverseProgress >= reverseAdjustedEnd
                  ? 1
                  : (reverseProgress - reverseAdjustedStart) / reverseDuration;

              if (reverseWordProgress > 0) {
                wordText.style.opacity = targetTextOpacity * (1 - reverseWordProgress);
                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${reverseWordProgress})`;
              } else {
                wordText.style.opacity = targetTextOpacity;
                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, 0)`;
              }
            }
          });
        },
      });
    }

    // Skills section pin
    ScrollTrigger.create({
      trigger: '.about-skills',
      start: 'top top',
      end: `+=${window.innerHeight * 3}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
    });

    // Gallery cards animation
    const galleryCards = gsap.utils.toArray('.gallery-card');
    const rotations = [-12, 10, -5, 5, -5, -2];

    galleryCards.forEach((galleryCard: any, index) => {
      gsap.set(galleryCard, {
        y: window.innerHeight,
        rotate: rotations[index],
      });
    });

    ScrollTrigger.create({
      trigger: '.about-sticky-cards',
      start: 'top top',
      end: `+=${window.innerHeight * 8}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const totalCards = galleryCards.length;
        const progressPerCard = 1 / totalCards;

        galleryCards.forEach((galleryCard: any, index) => {
          const galleryCardStart = index * progressPerCard;
          let galleryCardProgress = (progress - galleryCardStart) / progressPerCard;
          galleryCardProgress = Math.min(Math.max(galleryCardProgress, 0), 1);

          let yPos = window.innerHeight * (1 - galleryCardProgress);
          let xPos = 0;

          if (galleryCardProgress === 1 && index < totalCards - 1) {
            const remainingProgress =
              (progress - (galleryCardStart + progressPerCard)) /
              (1 - (galleryCardStart + progressPerCard));
            if (remainingProgress > 0) {
              const distanceMultiplier = 1 - index * 0.15;
              xPos = -window.innerWidth * 0.3 * distanceMultiplier * remainingProgress;
              yPos = -window.innerHeight * 0.3 * distanceMultiplier * remainingProgress;
            }
          }

          gsap.to(galleryCard, {
            y: yPos,
            x: xPos,
            duration: 0,
            ease: 'none',
          });
        });
      },
    });

    // Initialize physics for skills objects
    const initPhysics = (container: HTMLElement) => {
      const config = {
        gravity: { x: 0, y: 1 },
        restitution: 0.5,
        friction: 0.15,
        frictionAir: 0.02,
        density: 0.002,
        wallThickness: 200,
      };

      engineRef.current = Matter.Engine.create();
      engineRef.current.gravity = config.gravity;

      const containerRect = container.getBoundingClientRect();
      const wallThickness = config.wallThickness;
      const floorOffset = 8;

      const walls = [
        Matter.Bodies.rectangle(
          containerRect.width / 2,
          containerRect.height - floorOffset + wallThickness / 2,
          containerRect.width + wallThickness * 2,
          wallThickness,
          { isStatic: true }
        ),
        Matter.Bodies.rectangle(
          -wallThickness / 2,
          containerRect.height / 2,
          wallThickness,
          containerRect.height + wallThickness * 2,
          { isStatic: true }
        ),
        Matter.Bodies.rectangle(
          containerRect.width + wallThickness / 2,
          containerRect.height / 2,
          wallThickness,
          containerRect.height + wallThickness * 2,
          { isStatic: true }
        ),
      ];
      Matter.World.add(engineRef.current.world, walls);

      const objects = container.querySelectorAll('.object');
      objects.forEach((obj, index) => {
        const objRect = obj.getBoundingClientRect();

        const startX =
          Math.random() * (containerRect.width - objRect.width) + objRect.width / 2;
        const startY = -500 - index * 200;
        const startRotation = (Math.random() - 0.5) * Math.PI;

        const body = Matter.Bodies.rectangle(
          startX,
          startY,
          objRect.width,
          objRect.height,
          {
            restitution: config.restitution,
            friction: config.friction,
            frictionAir: config.frictionAir,
            density: config.density,
            chamfer: { radius: 10 },
            slop: 0.02,
          }
        );

        Matter.Body.setAngle(body, startRotation);

        bodiesRef.current.push({
          body: body,
          element: obj,
          width: objRect.width,
          height: objRect.height,
        });

        Matter.World.add(engineRef.current.world, body);
      });

      // Add top wall after delay
      setTimeout(() => {
        const topWall = Matter.Bodies.rectangle(
          containerRect.width / 2,
          -wallThickness / 2,
          containerRect.width + wallThickness * 2,
          wallThickness,
          { isStatic: true }
        );
        Matter.World.add(engineRef.current!.world, topWall);
      }, 3000);

      runnerRef.current = Matter.Runner.create();
      Matter.Runner.run(runnerRef.current, engineRef.current);

      function updatePositions() {
        bodiesRef.current.forEach(({ body, element, width, height }) => {
          const x = Math.max(0, Math.min(containerRect.width - width, body.position.x - width / 2));
          const y = Math.max(-height * 3, Math.min(containerRect.height - height - floorOffset, body.position.y - height / 2));

          (element as HTMLElement).style.left = x + 'px';
          (element as HTMLElement).style.top = y + 'px';
          (element as HTMLElement).style.transform = `rotate(${body.angle}rad)`;
        });

        requestAnimationFrame(updatePositions);
      }
      updatePositions();
    };

    // Initialize physics on scroll
    const objectContainer = containerRef.current.querySelector('.object-container');
    if (objectContainer) {
      ScrollTrigger.create({
        trigger: '.about-skills',
        start: 'top bottom',
        once: true,
        onEnter: () => {
          if (!engineRef.current) {
            initPhysics(objectContainer as HTMLElement);
          }
        },
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) Matter.Engine.clear(engineRef.current);
    };
  }, []);

  return (
    <>
      <section className="about-hero" id="about" ref={containerRef}>
        <div className="about-hero-img">
          <Image
            src="/assets/landing/about/about-hero-img.jpg"
            alt="About hero"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="container">
          <div className="about-header">
            <h2 data-animate-type="line-reveal" data-animate-delay="0.25">
              The Alchemist Behind It
            </h2>
          </div>
        </div>
      </section>

      <section className="anime-text-container">
        <div className="home-spotlight-top-bar">
          <div className="container">
            <div className="symbols-container">
              <div className="symbol">
                <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
              </div>
            </div>
            <div className="symbols-container">
              <div className="symbol">
                <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
              </div>
            </div>
          </div>
        </div>
        <div className="home-spotlight-bottom-bar">
          <div className="container">
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.2"
              data-animate-on-scroll="true"
            >
              <span>▶</span> Specs loaded
            </p>
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.25"
              data-animate-on-scroll="true"
            >
              / Readme.md
            </p>
          </div>
        </div>
        <div className="container">
          <div className="copy-container">
            <div className="anime-text">
              <p>
                Welcome to the corner of the internet where things get built, not
                just for the scroll, but for the story. This isn't just a site.
                It's a working archive of experiments, learnings, and quiet
                flexes.
              </p>
              <p>
                I'm Juno Watts. I design with rhythm, build with care, and believe
                every detail deserves a reason to exist. From quick sketches to
                final deploy, everything here was made with intent and maybe a bit
                of caffeine. This space is built for motion, meaning, and messing
                around until it clicks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-skills">
        <div className="container">
          <div className="about-skills-col">
            <div className="symbols-container">
              <div className="symbol">
                <Image src="/assets/landing/symbols/s1-light.png" alt="Symbol" width={18} height={18} />
              </div>
              <div className="symbol">
                <Image src="/assets/landing/symbols/s2-light.png" alt="Symbol" width={18} height={18} />
              </div>
            </div>
            <div className="about-skills-copy-wrapper">
              <div className="about-skills-callout">
                <p
                  className="mono"
                  data-animate-type="scramble"
                  data-animate-delay="0.2"
                  data-animate-on-scroll="true"
                >
                  <span>▶</span> Proving gravity applies to divs too
                </p>
              </div>
              <div className="about-skills-header">
                <h3
                  data-animate-type="line-reveal"
                  data-animate-delay="0.4"
                  data-animate-on-scroll="true"
                >
                  Things I know that make the web cooler
                </h3>
              </div>
            </div>
          </div>
          <div className="about-skills-col skills-playground">
            <div className="object-container">
              <div className="object os-1"><p className="mono">HTML</p></div>
              <div className="object os-2"><p className="mono">CSS</p></div>
              <div className="object os-3"><p className="mono">JavaScript</p></div>
              <div className="object os-1"><p className="mono">GSAP</p></div>
              <div className="object os-2"><p className="mono">ScrollTrigger</p></div>
              <div className="object os-3"><p className="mono">Lenis</p></div>
              <div className="object os-1"><p className="mono">React</p></div>
              <div className="object os-2"><p className="mono">Next.js</p></div>
              <div className="object os-3"><p className="mono">WebGL</p></div>
              <div className="object os-1"><p className="mono">Three.js</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-sticky-cards">
        <div className="sticky-cards-header">
          <h3
            data-animate-type="line-reveal"
            data-animate-delay="0.2"
            data-animate-on-scroll="true"
          >
            Visual logs from the field
          </h3>
        </div>
        <div className="home-spotlight-top-bar">
          <div className="container">
            <div className="symbols-container">
              <div className="symbol">
                <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
              </div>
              <div className="symbol">
                <Image src="/assets/landing/symbols/s2-dark.png" alt="Symbol" width={18} height={18} />
              </div>
              <div className="symbol">
                <Image src="/assets/landing/symbols/s3-dark.png" alt="Symbol" width={18} height={18} />
              </div>
            </div>
            <div className="symbols-container">
              <div className="symbol">
                <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
              </div>
              <div className="symbol">
                <Image src="/assets/landing/symbols/s2-dark.png" alt="Symbol" width={18} height={18} />
              </div>
              <div className="symbol">
                <Image src="/assets/landing/symbols/s3-dark.png" alt="Symbol" width={18} height={18} />
              </div>
            </div>
          </div>
        </div>
        <div className="home-spotlight-bottom-bar">
          <div className="container">
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.2"
              data-animate-on-scroll="true"
            >
              <span>▶</span> Gallery Mode
            </p>
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.25"
              data-animate-on-scroll="true"
            >
              / Snapshots
            </p>
          </div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-1.jpg"
              alt="Gallery 1"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">X01-842</p></div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-2.jpg"
              alt="Gallery 2"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">V9-372K</p></div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-3.jpg"
              alt="Gallery 3"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">Z84-Q17</p></div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-4.jpg"
              alt="Gallery 4"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">L56-904</p></div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-5.jpg"
              alt="Gallery 5"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">A23-7P1</p></div>
        </div>
        <div className="gallery-card">
          <div className="gallery-card-img">
            <Image
              src="/assets/landing/gallery-images/gallery-img-6.jpg"
              alt="Gallery 6"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="gallery-card-content"><p className="mono">T98-462</p></div>
        </div>
      </section>
    </>
  );
}