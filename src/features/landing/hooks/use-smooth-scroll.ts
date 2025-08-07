'use client';

import { useEffect, useRef } from 'react';

interface SmoothScrollOptions {
  lerp?: number; // Linear interpolation factor (0.02 = very smooth, 0.1 = less smooth)
  wheelMultiplier?: number; // Scroll sensitivity multiplier
  touchMultiplier?: number; // Touch scroll sensitivity
  minSpeed?: number; // Minimum speed threshold
}

export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const {
    lerp = 0.08, // Buttery smooth interpolation
    wheelMultiplier = 1,
    touchMultiplier = 1.5,
    minSpeed = 0.1,
  } = options;

  const scrollRef = useRef({
    current: 0,
    target: 0,
    ease: 0,
    speed: 0,
    last: 0,
    startY: 0,
  });

  const rafRef = useRef<number>(0);
  const isRunning = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scroll = scrollRef.current;
    
    // Initialize scroll position
    scroll.current = window.pageYOffset;
    scroll.target = window.pageYOffset;

    let isScrolling = false;
    let scrollTimer: NodeJS.Timeout;

    const updateScroll = () => {
      const delta = scroll.target - scroll.current;
      scroll.ease += (Math.abs(delta) - scroll.ease) * 0.1;
      scroll.current += delta * lerp;
      scroll.speed = scroll.current - scroll.last;
      scroll.last = scroll.current;

      // Apply the smooth scroll
      window.scrollTo(0, scroll.current);

      // Continue animation if there's significant movement
      if (Math.abs(delta) > minSpeed && isRunning.current) {
        rafRef.current = requestAnimationFrame(updateScroll);
      } else {
        isScrolling = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      // Calculate scroll delta
      const delta = e.deltaY * wheelMultiplier;
      scroll.target += delta;
      
      // Constrain scroll bounds
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scroll.target = Math.max(0, Math.min(scroll.target, maxScroll));

      // Start smooth scrolling if not already running
      if (!isScrolling && isRunning.current) {
        isScrolling = true;
        rafRef.current = requestAnimationFrame(updateScroll);
      }

      // Clear existing scroll timer and set new one
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      scroll.startY = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaY = (scroll.startY - touch.clientY) * touchMultiplier;
      
      scroll.target += deltaY;
      
      // Constrain scroll bounds
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scroll.target = Math.max(0, Math.min(scroll.target, maxScroll));

      scroll.startY = touch.clientY;

      // Start smooth scrolling if not already running
      if (!isScrolling && isRunning.current) {
        isScrolling = true;
        rafRef.current = requestAnimationFrame(updateScroll);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyScrollMap: { [key: string]: number } = {
        ArrowUp: -100,
        ArrowDown: 100,
        PageUp: -window.innerHeight * 0.8,
        PageDown: window.innerHeight * 0.8,
        Home: -scroll.target,
        End: document.documentElement.scrollHeight - window.innerHeight - scroll.target,
      };

      if (keyScrollMap[e.key]) {
        e.preventDefault();
        scroll.target += keyScrollMap[e.key];
        
        // Constrain scroll bounds
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scroll.target = Math.max(0, Math.min(scroll.target, maxScroll));

        if (!isScrolling && isRunning.current) {
          isScrolling = true;
          rafRef.current = requestAnimationFrame(updateScroll);
        }
      }
    };

    const handleResize = () => {
      scroll.current = window.pageYOffset;
      scroll.target = window.pageYOffset;
    };

    // Start the smooth scroll system
    isRunning.current = true;

    // Add event listeners with passive: false for preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    // Prevent default scroll behavior
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';

    return () => {
      // Cleanup
      isRunning.current = false;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(scrollTimer);
      
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);

      // Restore default scroll behavior
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.scrollBehavior = '';
    };
  }, [lerp, wheelMultiplier, touchMultiplier, minSpeed]);

  return scrollRef.current;
}