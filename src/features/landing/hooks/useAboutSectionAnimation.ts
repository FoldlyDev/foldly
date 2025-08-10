'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Matter from 'matter-js';

interface AboutSectionRefs {
  skillsContainerRef: React.RefObject<HTMLDivElement | null>;
  objectContainerRef: React.RefObject<HTMLDivElement | null>;
  galleryCardsContainerRef: React.RefObject<HTMLDivElement | null>;
  galleryCardRefs: React.RefObject<HTMLDivElement | null>[];
}

interface UseAboutSectionAnimationProps {
  refs: AboutSectionRefs;
  isEnabled: boolean;
}

export function useAboutSectionAnimation({
  refs,
  isEnabled,
}: UseAboutSectionAnimationProps) {
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const bodiesRef = useRef<
    Array<{
      body: Matter.Body;
      element: HTMLElement;
      width: number;
      height: number;
    }>
  >([]);

  useEffect(() => {
    if (!isEnabled) return;

    gsap.registerPlugin(ScrollTrigger);

    // Skills section physics animation
    const initPhysics = (container: HTMLElement) => {
      const config = {
        gravity: { x: 0, y: 1, scale: 0.001 },
        restitution: 0.5,
        friction: 0.15,
        frictionAir: 0.02,
        density: 0.002,
        wallThickness: 200,
      };

      const engine = Matter.Engine.create();
      engine.gravity = config.gravity;
      engineRef.current = engine;

      engine.constraintIterations = 15;
      engine.positionIterations = 25;
      engine.velocityIterations = 20;
      engine.enableSleeping = true;
      engine.timing.timeScale = 1;

      const containerRect = container.getBoundingClientRect();
      const wallThickness = config.wallThickness;
      const floorOffset = 8;

      // Create walls
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
      Matter.World.add(engine.world, walls);

      // Create physics bodies for skill objects
      const objects = container.querySelectorAll('.object');
      objects.forEach((obj, index) => {
        const objElement = obj as HTMLElement;
        const objRect = objElement.getBoundingClientRect();

        const startX =
          Math.random() * (containerRect.width - objRect.width) +
          objRect.width / 2;
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
          body,
          element: objElement,
          width: objRect.width,
          height: objRect.height,
        });

        Matter.World.add(engine.world, body);
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
        Matter.World.add(engine.world, topWall);
      }, 3000);

      // Random forces
      const forceInterval = setInterval(() => {
        if (bodiesRef.current.length > 0 && Math.random() < 0.3) {
          const randomBody =
            bodiesRef.current[
              Math.floor(Math.random() * bodiesRef.current.length)
            ];
          if (randomBody) {
            const randomForce = {
              x: (Math.random() - 0.5) * 0.02,
              y: (Math.random() - 0.5) * 0.01,
            };
            Matter.Body.applyForce(
              randomBody.body,
              randomBody.body.position,
              randomForce
            );
          }
        }
      }, 2000);

      const runner = Matter.Runner.create();
      runnerRef.current = runner;
      Matter.Runner.run(runner, engine);

      // Update positions
      const updatePositions = () => {
        bodiesRef.current.forEach(({ body, element, width, height }) => {
          const x = Math.max(
            0,
            Math.min(containerRect.width - width, body.position.x - width / 2)
          );
          const y = Math.max(
            -height * 3,
            Math.min(
              containerRect.height - height - floorOffset,
              body.position.y - height / 2
            )
          );

          element.style.left = x + 'px';
          element.style.top = y + 'px';
          element.style.transform = `rotate(${body.angle}rad)`;
        });

        requestAnimationFrame(updatePositions);
      };
      updatePositions();

      return () => {
        clearInterval(forceInterval);
      };
    };

    // Initialize physics on scroll
    const skillsSection = refs.skillsContainerRef.current;
    if (skillsSection) {
      const objectContainer = refs.objectContainerRef.current;
      if (objectContainer) {
        ScrollTrigger.create({
          trigger: skillsSection,
          start: 'top bottom',
          once: true,
          onEnter: () => {
            if (!engineRef.current) {
              initPhysics(objectContainer);
            }
          },
        });
      }

      // Pin skills section
      ScrollTrigger.create({
        trigger: skillsSection,
        start: 'top top',
        end: `+=${window.innerHeight * 3}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
      });
    }

    // Gallery cards animation
    const galleryCards = refs.galleryCardRefs
      .map(ref => ref.current)
      .filter(Boolean);
    const rotations = [-12, 10, -5, 5, -5, -2];

    galleryCards.forEach((galleryCard, index) => {
      if (galleryCard) {
        gsap.set(galleryCard, {
          y: window.innerHeight,
          rotate: rotations[index] || 0,
        });
      }
    });

    const galleryContainer = refs.galleryCardsContainerRef.current;
    if (galleryContainer && galleryCards.length > 0) {
      ScrollTrigger.create({
        trigger: galleryContainer,
        start: 'top top',
        end: `+=${window.innerHeight * 8}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: self => {
          const progress = self.progress;
          const totalCards = galleryCards.length;
          const progressPerCard = 1 / totalCards;

          galleryCards.forEach((galleryCard, index) => {
            if (!galleryCard) return;

            const galleryCardStart = index * progressPerCard;
            let galleryCardProgress =
              (progress - galleryCardStart) / progressPerCard;
            galleryCardProgress = Math.min(Math.max(galleryCardProgress, 0), 1);

            let yPos = window.innerHeight * (1 - galleryCardProgress);
            let xPos = 0;

            if (galleryCardProgress === 1 && index < totalCards - 1) {
              const remainingProgress =
                (progress - (galleryCardStart + progressPerCard)) /
                (1 - (galleryCardStart + progressPerCard));
              if (remainingProgress > 0) {
                const distanceMultiplier = 1 - index * 0.15;
                xPos =
                  -window.innerWidth *
                  0.3 *
                  distanceMultiplier *
                  remainingProgress;
                yPos =
                  -window.innerHeight *
                  0.3 *
                  distanceMultiplier *
                  remainingProgress;
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
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());

      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }

      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }

      bodiesRef.current = [];
    };
  }, [isEnabled, refs]);
}
