'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface Slide {
  slideTitle: string;
  slideDescription: string;
  slideUrl: string;
  slideTags: string[];
  slideImg: string;
}

const slides: Slide[] = [
  {
    slideTitle: 'Brainstorm OS',
    slideDescription:
      'A concept UI for a neural-thinking workspace. Designed to visualize raw ideas, tangled thoughts, and clean execution — all at once.',
    slideUrl: '#project',
    slideTags: ['Web Design', 'UI/UX', 'Concept UI', 'Creative Dev'],
    slideImg: '/assets/landing/work/slider-img-1.jpg',
  },
  {
    slideTitle: 'Orange Room',
    slideDescription:
      'A surreal microsite exploring control, uniformity, and digital disconnect. Built with scroll-reactive animations and bold, brutalist layout.',
    slideUrl: '#project',
    slideTags: ['Creative Dev', 'Scroll UX', 'Experimental', 'Visual Story'],
    slideImg: '/assets/landing/work/slider-img-2.jpg',
  },
  {
    slideTitle: 'Futureschool',
    slideDescription:
      'A quirky concept for a 60s-style AI education platform. Handcrafted visuals meet structured layouts for a playful learning interface.',
    slideUrl: '#project',
    slideTags: ['UI Design', 'Theme Concept', 'Playful UX', 'Frontend'],
    slideImg: '/assets/landing/work/slider-img-3.jpg',
  },
  {
    slideTitle: 'Mindwave Grid',
    slideDescription:
      'A visual identity experiment for a VR-based ideation tool. Dynamic grids, floating modules, and warm tones bring structure to wild thinking.',
    slideUrl: '#project',
    slideTags: ['VR Design', 'Grid System', 'Creative Tech', '3D UI'],
    slideImg: '/assets/landing/work/slider-img-4.jpg',
  },
];

export function WorkSection() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollAllowed, setScrollAllowed] = useState(false);
  const lastScrollTimeRef = useRef(0);
  const splitInstancesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!sliderRef.current) return;

    gsap.registerPlugin(SplitText);

    // Set initial opacity
    gsap.set(sliderRef.current, { opacity: 0 });
    gsap.to(sliderRef.current, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    });

    // Initialize first slide
    initializeFirstSlide();

    // Event handlers
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 'down' : 'up';
      handleScroll(direction);
    };

    let touchStartY = 0;
    let isTouchActive = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      isTouchActive = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isTouchActive || isAnimating || !scrollAllowed) return;

      const touchCurrentY = e.touches[0].clientY;
      const difference = touchStartY - touchCurrentY;

      if (Math.abs(difference) > 50) {
        isTouchActive = false;
        const direction = difference > 0 ? 'down' : 'up';
        handleScroll(direction);
      }
    };

    const handleTouchEnd = () => {
      isTouchActive = false;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      // Clean up split instances
      splitInstancesRef.current.forEach(split => split.revert());
    };
  }, [isAnimating, scrollAllowed]);

  const createSlide = (slideIndex: number) => {
    const slideData = slides[slideIndex - 1];

    const slide = document.createElement('div');
    slide.className = 'slide';

    slide.innerHTML = `
      <div class="slide-img">
        <img src="${slideData.slideImg}" alt="" />
      </div>
      <div class="slide-header">
        <div class="slide-title">
          <h2>${slideData.slideTitle}</h2>
        </div>
        <div class="slide-description">
          <p>${slideData.slideDescription}</p>
        </div>
        <div class="slide-link">
          <a href="${slideData.slideUrl}">View Project</a>
        </div>
      </div>
      <div class="slide-info">
        <div class="slide-tags">
          <p class="mono">Tags</p>
          ${slideData.slideTags.map(tag => `<p class="mono">${tag}</p>`).join('')}
        </div>
        <div class="slide-index-wrapper">
          <p class="mono">${slideIndex.toString().padStart(2, '0')}</p>
          <p class="mono">/</p>
          <p class="mono">${slides.length.toString().padStart(2, '0')}</p>
        </div>
      </div>
    `;

    return slide;
  };

  const splitText = (slide: HTMLElement) => {
    const slideHeader = slide.querySelector('.slide-title h2');
    if (slideHeader) {
      const split = new SplitText(slideHeader, {
        type: 'words',
        wordsClass: 'word',
      });
      splitInstancesRef.current.push(split);
    }

    const slideContent = slide.querySelectorAll('p, a');
    slideContent.forEach((element) => {
      const split = new SplitText(element, {
        type: 'lines',
        linesClass: 'line',
      });
      splitInstancesRef.current.push(split);
    });
  };

  const initializeFirstSlide = () => {
    if (!sliderRef.current) return;

    const firstSlide = createSlide(1);
    sliderRef.current.appendChild(firstSlide);

    splitText(firstSlide);

    const words = firstSlide.querySelectorAll('.word');
    const lines = firstSlide.querySelectorAll('.line');

    gsap.set([...words, ...lines], {
      y: '100%',
      force3D: true,
    });

    const tl = gsap.timeline();

    const headerWords = firstSlide.querySelectorAll('.slide-title .word');
    tl.to(
      headerWords,
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1,
        force3D: true,
      },
      0.5
    );

    const tagsLines = firstSlide.querySelectorAll('.slide-tags .line');
    const indexLines = firstSlide.querySelectorAll('.slide-index-wrapper .line');
    const descriptionLines = firstSlide.querySelectorAll('.slide-description .line');

    tl.to(
      tagsLines,
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1,
      },
      '-=0.75'
    );

    tl.to(
      indexLines,
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1,
      },
      '<'
    );

    tl.to(
      descriptionLines,
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        stagger: 0.1,
      },
      '<'
    );

    const linkLines = firstSlide.querySelectorAll('.slide-link .line');
    tl.to(
      linkLines,
      {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
      },
      '-=1'
    );

    setTimeout(() => {
      setScrollAllowed(true);
      lastScrollTimeRef.current = Date.now();
    }, 1500);
  };

  const handleScroll = (direction: 'up' | 'down') => {
    const now = Date.now();

    if (isAnimating || !scrollAllowed) return;
    if (now - lastScrollTimeRef.current < 1000) return;

    lastScrollTimeRef.current = now;
    animateSlide(direction);
  };

  const animateSlide = (direction: 'up' | 'down') => {
    if (!sliderRef.current) return;

    setIsAnimating(true);
    setScrollAllowed(false);

    const currentSlideElement = sliderRef.current.querySelector('.slide');
    if (!currentSlideElement) return;

    const nextSlideIndex = direction === 'down' 
      ? currentSlide === slides.length ? 1 : currentSlide + 1
      : currentSlide === 1 ? slides.length : currentSlide - 1;

    setCurrentSlide(nextSlideIndex);

    const exitY = direction === 'down' ? '-200vh' : '200vh';
    const entryY = direction === 'down' ? '100vh' : '-100vh';

    gsap.to(currentSlideElement, {
      scale: 0.25,
      opacity: 0,
      rotation: 30,
      y: exitY,
      duration: 2,
      ease: 'power4.inOut',
      force3D: true,
      onComplete: () => {
        currentSlideElement.remove();
      },
    });

    setTimeout(() => {
      const newSlide = createSlide(nextSlideIndex);
      const newSlideImg = newSlide.querySelector('.slide-img img') as HTMLElement;

      gsap.set(newSlide, {
        y: entryY,
        force3D: true,
      });

      gsap.set(newSlideImg, {
        scale: 2,
        force3D: true,
      });

      sliderRef.current!.appendChild(newSlide);

      splitText(newSlide);

      const words = newSlide.querySelectorAll('.word');
      const lines = newSlide.querySelectorAll('.line');

      gsap.set([...words, ...lines], {
        y: '100%',
        force3D: true,
      });

      gsap.to(newSlide, {
        y: 0,
        duration: 1.5,
        ease: 'power4.out',
        force3D: true,
        onStart: () => {
          gsap.to(newSlideImg, {
            scale: 1,
            duration: 1.5,
            ease: 'power4.out',
            force3D: true,
          });

          const tl = gsap.timeline();

          const headerWords = newSlide.querySelectorAll('.slide-title .word');
          tl.to(
            headerWords,
            {
              y: '0%',
              duration: 1,
              ease: 'power4.out',
              stagger: 0.1,
              force3D: true,
            },
            0.75
          );

          const tagsLines = newSlide.querySelectorAll('.slide-tags .line');
          const indexLines = newSlide.querySelectorAll('.slide-index-wrapper .line');
          const descriptionLines = newSlide.querySelectorAll('.slide-description .line');

          tl.to(
            tagsLines,
            {
              y: '0%',
              duration: 1,
              ease: 'power4.out',
              stagger: 0.1,
            },
            '-=0.75'
          );

          tl.to(
            indexLines,
            {
              y: '0%',
              duration: 1,
              ease: 'power4.out',
              stagger: 0.1,
            },
            '<'
          );

          tl.to(
            descriptionLines,
            {
              y: '0%',
              duration: 1,
              ease: 'power4.out',
              stagger: 0.1,
            },
            '<'
          );

          const linkLines = newSlide.querySelectorAll('.slide-link .line');
          tl.to(
            linkLines,
            {
              y: '0%',
              duration: 1,
              ease: 'power4.out',
            },
            '-=1'
          );
        },
        onComplete: () => {
          setIsAnimating(false);
          setTimeout(() => {
            setScrollAllowed(true);
            lastScrollTimeRef.current = Date.now();
          }, 100);
        },
      });
    }, 750);
  };

  return (
    <div className="slider" id="work" ref={sliderRef}></div>
  );
}