'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

interface NavigationAnimationRefs {
  menuRef: React.RefObject<HTMLElement | null>;
  menuHeaderRef: React.RefObject<HTMLDivElement | null>;
  menuOverlayRef: React.RefObject<HTMLDivElement | null>;
  menuItemsRef: React.RefObject<HTMLLIElement[]>;
  menuFooterRef: React.RefObject<HTMLDivElement | null>;
  menuLogoImgRef: React.RefObject<HTMLImageElement | null>;
  hamburgerMenuRef: React.RefObject<HTMLDivElement | null>;
}

interface NavigationAnimationOptions {
  isOpen: boolean;
  onAnimatingChange?: (isAnimating: boolean) => void;
  onOpenChange?: (isOpen: boolean) => void;
  scrollHideThreshold?: number;
  scrollUpThreshold?: number;
}

/**
 * Hook for managing Navigation GSAP animations
 * EXACT copy from Juno Watts template
 */
export function useNavigationAnimation(
  refs: NavigationAnimationRefs,
  { 
    isOpen, 
    onAnimatingChange, 
    onOpenChange,
    scrollHideThreshold = 50,
    scrollUpThreshold = 3 
  }: NavigationAnimationOptions
) {
  const isInitialized = useRef(false);
  const splitTextsRef = useRef<any[]>([]);
  const footerSplitTextsRef = useRef<any[]>([]);
  const isAnimatingRef = useRef(false);
  const isOpenRef = useRef(false);
  
  // Scroll hide states
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const rafId = useRef<number | null>(null);

  // Scramble text function from template
  const scrambleText = (elements: any[], duration = 0.4) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

    elements.forEach((char: any, index: number) => {
      const originalText = char.textContent;
      let iterations = 0;
      const maxIterations = Math.floor(Math.random() * 6) + 3;

      gsap.set(char, { opacity: 1 });

      const scrambleInterval = setInterval(() => {
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        iterations++;

        if (iterations >= maxIterations) {
          clearInterval(scrambleInterval);
          char.textContent = originalText;
        }
      }, 25);

      setTimeout(() => {
        clearInterval(scrambleInterval);
        char.textContent = originalText;
      }, duration * 1000);
    });
  };

  // Initialize menu - EXACT copy from template
  const initMenu = () => {
    if (!refs.menuOverlayRef?.current || !refs.menuItemsRef?.current || !refs.menuFooterRef?.current) return;

    // GSAP plugins are registered by the orchestrator

    gsap.set(refs.menuOverlayRef.current, {
      scaleY: 0,
      transformOrigin: "top center",
    });

    refs.menuItemsRef.current.forEach((item) => {
      const link = item.querySelector("a");
      if (link) {
        const split = new SplitText(link, {
          type: "words",
          wordsClass: "split-word",
          mask: "words",
        });
        splitTextsRef.current.push(split);

        gsap.set(split.words, {
          yPercent: 120,
        });
      }
    });

    const footerElements = refs.menuFooterRef.current.querySelectorAll(
      ".menu-social a, .menu-social span, .menu-time"
    );
    footerElements.forEach((element) => {
      const split = new SplitText(element, {
        type: "chars",
      });
      footerSplitTextsRef.current.push(split);

      gsap.set(split.chars, {
        opacity: 0,
      });

      if (element.classList.contains("menu-time")) {
        gsap.set(element, { opacity: 0 });
      }
    });

    gsap.set(refs.menuItemsRef.current, {
      opacity: 1,
    });

    gsap.set(refs.menuFooterRef.current, {
      opacity: 1,
      y: 20,
    });
  };

  // Open menu - EXACT copy from template
  const openMenu = () => {
    if (!refs.menuOverlayRef?.current || !refs.menuFooterRef?.current) return;

    isAnimatingRef.current = true;
    onAnimatingChange?.(true);
    
    if (refs.hamburgerMenuRef?.current) {
      refs.hamburgerMenuRef.current.classList.add("open");
    }
    if (refs.menuLogoImgRef?.current) {
      refs.menuLogoImgRef.current.classList.add("rotated");
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        onAnimatingChange?.(false);
      },
    });

    tl.to(refs.menuOverlayRef.current, {
      duration: 0.5,
      scaleY: 1,
      ease: "power3.out",
    });

    const allWords = splitTextsRef.current.reduce((acc, split) => {
      return acc.concat(split.words);
    }, []);

    tl.to(
      allWords,
      {
        duration: 0.75,
        yPercent: 0,
        stagger: 0.05,
        ease: "power4.out",
      },
      "-=0.3"
    );

    tl.to(
      refs.menuFooterRef.current,
      {
        duration: 0.3,
        y: 0,
        ease: "power2.out",
        onComplete: () => {
          const timeElement = refs.menuFooterRef.current!.querySelector(".menu-time");
          if (timeElement) {
            gsap.set(timeElement, { opacity: 1 });
          }

          const allFooterChars = footerSplitTextsRef.current.reduce((acc, split) => {
            return acc.concat(split.chars);
          }, []);

          allFooterChars.forEach((char: any, index: number) => {
            setTimeout(() => {
              scrambleText([char], 0.4);
            }, index * 30);
          });
        },
      },
      "-=1"
    );
  };

  // Close menu - EXACT copy from template
  const closeMenu = () => {
    if (!refs.menuOverlayRef?.current || !refs.menuFooterRef?.current) return;

    isAnimatingRef.current = true;
    onAnimatingChange?.(true);
    
    if (refs.hamburgerMenuRef?.current) {
      refs.hamburgerMenuRef.current.classList.remove("open");
    }
    if (refs.menuLogoImgRef?.current) {
      refs.menuLogoImgRef.current.classList.remove("rotated");
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        onAnimatingChange?.(false);
      },
    });

    const allWords = splitTextsRef.current.reduce((acc, split) => {
      return acc.concat(split.words);
    }, []);

    tl.to([refs.menuFooterRef.current], {
      duration: 0.3,
      y: 20,
      ease: "power2.in",
      onStart: () => {
        const timeElement = refs.menuFooterRef.current!.querySelector(".menu-time");
        if (timeElement) {
          gsap.set(timeElement, { opacity: 0 });
        }

        const allFooterChars = footerSplitTextsRef.current.reduce((acc, split) => {
          return acc.concat(split.chars);
        }, []);
        gsap.set(allFooterChars, { opacity: 0 });
      },
    });

    tl.to(
      allWords,
      {
        duration: 0.25,
        yPercent: 120,
        stagger: -0.025,
        ease: "power2.in",
      },
      "-=0.25"
    );

    tl.to(
      refs.menuOverlayRef.current,
      {
        duration: 0.5,
        scaleY: 0,
        ease: "power3.inOut",
      },
      "-=0.2"
    );
  };

  // Scroll hide logic
  const updateScrollDirection = useCallback(() => {
    // Get scroll position from Lenis if available, fallback to window.scrollY
    const lenis = (window as any).lenis;
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    
    // Don't hide if menu is open
    if (isOpenRef.current) {
      setIsVisible(true);
      lastScrollY.current = scrollY;
      ticking.current = false;
      return;
    }

    const direction = scrollY > lastScrollY.current ? 'down' : 'up';
    const scrollDifference = Math.abs(scrollY - lastScrollY.current);

    // Only update if scroll difference is significant
    if (scrollDifference < scrollUpThreshold) {
      ticking.current = false;
      return;
    }

    if (direction === 'down' && scrollY > scrollHideThreshold) {
      // Hide navbar when scrolling down past threshold
      setIsVisible(false);
    } else if (direction === 'up' || scrollY <= scrollHideThreshold) {
      // Show navbar when scrolling up or near top
      setIsVisible(true);
    }

    lastScrollY.current = scrollY;
    ticking.current = false;
  }, [scrollHideThreshold, scrollUpThreshold]);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      rafId.current = window.requestAnimationFrame(updateScrollDirection);
      ticking.current = true;
    }
  }, [updateScrollDirection]);

  // Initialize scroll listener
  useEffect(() => {
    // Initialize scroll position
    const initializeScrollPosition = () => {
      const lenis = (window as any).lenis;
      const currentScrollY = lenis ? lenis.scroll : window.scrollY;
      lastScrollY.current = currentScrollY;
    };

    requestAnimationFrame(initializeScrollPosition);

    // Check if Lenis is available
    const lenis = (window as any).lenis;
    
    if (lenis) {
      // Use Lenis scroll events
      lenis.on('scroll', handleScroll);
      
      return () => {
        lenis.off('scroll', handleScroll);
        if (rafId.current) {
          window.cancelAnimationFrame(rafId.current);
        }
      };
    } else {
      // Fallback to window scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        if (rafId.current) {
          window.cancelAnimationFrame(rafId.current);
        }
      };
    }
  }, [handleScroll]);

  // Apply visibility to menu
  useEffect(() => {
    if (!refs.menuRef?.current || !isInitialized.current) return;
    
    requestAnimationFrame(() => {
      if (refs.menuRef.current) {
        if (isVisible) {
          refs.menuRef.current.classList.remove('hidden');
        } else {
          refs.menuRef.current.classList.add('hidden');
        }
      }
    });
  }, [isVisible, refs.menuRef]);

  // Initialize
  useEffect(() => {
    if (isInitialized.current) return;
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      initMenu();
      
      if (refs.menuHeaderRef?.current) {
        refs.menuHeaderRef.current.addEventListener("click", () => {
          if (isAnimatingRef.current) return;
          // Toggle will be handled by parent component
        });
      }

      isInitialized.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [refs]);

  // Handle open/close
  useEffect(() => {
    if (!isInitialized.current) return;
    
    // Reset animation flag to ensure we can always animate
    isAnimatingRef.current = false;
    isOpenRef.current = isOpen;
    
    if (isOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [isOpen]);

  // Return visibility state
  return { isVisible };
}