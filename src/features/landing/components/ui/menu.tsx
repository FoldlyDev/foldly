'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import Image from 'next/image';
import type { MenuLink } from '../../types';
import {
  useGsapAnimation,
  useTextAnimations,
  useListRefs,
  DURATIONS,
  EASINGS,
  ANIMATION_PRESETS,
} from '../../hooks/animations';

const menuLinks: MenuLink[] = [
  { href: '#home', label: 'Index' },
  { href: '#about', label: 'The Dev' },
  { href: '#work', label: 'Cool Stuff' },
  { href: '#project', label: 'Log 01' },
  { href: '#contact', label: 'Ping Me' },
];

export function Menu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Refs using the new system
  const menuRef = useRef<HTMLElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const menuFooterRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  
  // Animation refs for menu items and footer elements
  const { itemRefs: menuItemRefs } = useListRefs<HTMLAnchorElement>(menuLinks.length);
  
  // Animation hooks
  const { setRef, createTimeline } = useGsapAnimation();
  const { createSplitText, cleanupSplitTexts } = useTextAnimations();
  
  const lastScrollYRef = useRef(0);
  const scrollVelocityRef = useRef(0);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // EXACT Juno Watts scramble text implementation
  const scrambleText = useCallback((elements: Element[], duration = 0.4) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    elements.forEach((char, index) => {
      const originalText = char.textContent ?? '';
      let iterations = 0;
      const maxIterations = Math.floor(Math.random() * 6) + 3; // Template uses 6+3

      setRef({ current: char as HTMLElement }, { opacity: 1 });

      const scrambleInterval = setInterval(() => {
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        iterations++;

        if (iterations >= maxIterations) {
          clearInterval(scrambleInterval);
          char.textContent = originalText;
        }
      }, 25); // Template uses 25ms intervals

      setTimeout(() => {
        clearInterval(scrambleInterval);
        char.textContent = originalText;
      }, duration * 1000);
    });
  }, [setRef]);

  // Initialize menu with refs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean up any existing splits first
    cleanupSplitTexts();

    // Initialize menu overlay
    if (menuOverlayRef.current) {
      setRef(menuOverlayRef as RefObject<HTMLElement>, ANIMATION_PRESETS.menuOverlay);
    }

    // Initialize menu items with EXACT template structure
    menuItemRefs.forEach((ref) => {
      if (ref.current) {
        // Template uses 'words' type with 'mask: words'
        const split = createSplitText(ref as RefObject<HTMLElement>, 'words', { 
          mask: 'words' 
        });
        if (split) {
          setRef({ current: split.words as unknown as HTMLElement }, {
            yPercent: 120,
          });
        }
      }
    });

    // Set initial opacity for menu nav items
    const menuNavItems = menuOverlayRef.current?.querySelectorAll('.menu-nav li');
    if (menuNavItems) {
      setRef({ current: menuNavItems as unknown as HTMLElement }, { opacity: 1 });
    }

    // Initialize footer elements
    const footerElements = menuOverlayRef.current?.querySelectorAll(
      '.menu-social a, .menu-social span, .menu-time'
    );
    if (footerElements) {
      footerElements.forEach((element) => {
        if (element.textContent) {
          const split = createSplitText({ current: element as HTMLElement }, 'chars');
          if (split) {
            setRef({ current: split.chars as unknown as HTMLElement }, {
              opacity: 0,
            });

            if (element.classList.contains('menu-time')) {
              setRef({ current: element as HTMLElement }, { opacity: 0 });
            }
          }
        }
      });
    }

    if (menuFooterRef.current) {
      setRef(menuFooterRef as RefObject<HTMLElement>, { opacity: 1, y: 20 });
    }

    return () => {
      cleanupSplitTexts();
    };
  }, [cleanupSplitTexts, createSplitText, setRef, menuItemRefs]);

  // Enhanced scroll behavior with velocity detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      
      // Calculate scroll velocity
      scrollVelocityRef.current = scrollDelta;
      
      // Clear existing timer
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      // Set new timer to reset velocity
      scrollTimerRef.current = setTimeout(() => {
        scrollVelocityRef.current = 0;
      }, 150);

      // Hide on scroll down with velocity threshold
      if (scrollDelta > 5 && currentScrollY > 100) {
        if (isOpen) {
          closeMenu();
        }
        if (isMenuVisible && menuRef.current) {
          menuRef.current.classList.add('hidden');
          setIsMenuVisible(false);
        }
      } 
      // Show on scroll up or when at top
      else if (scrollDelta < -5 || currentScrollY < 50) {
        if (!isMenuVisible && menuRef.current) {
          menuRef.current.classList.remove('hidden');
          setIsMenuVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [isOpen, isMenuVisible, isAnimating]);

  // Update time with smooth transitions
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const newTime = `${timeString} LOCAL`;
      
      // Only update if time changed
      if (newTime !== currentTime) {
        setCurrentTime(newTime);
        
        // Animate time change
        if (timeRef.current && isOpen) {
          setRef(timeRef as RefObject<HTMLElement>, {
            scale: 1.05,
            duration: 0.1,
            ease: 'power2.out',
            onComplete: () => {
              setRef(timeRef as RefObject<HTMLElement>, {
                scale: 1,
                duration: 0.1,
              });
            }
          });
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentTime, isOpen, setRef]);

  const openMenu = () => {
    if (isAnimating) return;
    
    setIsOpen(true);
    setIsAnimating(true);
    
    // Add classes for hamburger and logo animation
    if (hamburgerRef.current) {
      hamburgerRef.current.classList.add('open');
    }
    if (logoRef.current) {
      logoRef.current.classList.add('rotated');
    }

    const tl = createTimeline({
      onComplete: () => setIsAnimating(false),
    });

    // Animate overlay - EXACT template timing
    if (menuOverlayRef.current) {
      tl.to(menuOverlayRef.current, {
        duration: 0.5, // Template uses 0.5
        scaleY: 1,
        ease: EASINGS.power3Out,
      });
    }

    // Animate menu items
    const allWords: Element[] = [];
    menuItemRefs.forEach((ref) => {
      if (ref.current) {
        const splitInstance = ref.current.querySelector('.SplitText');
        if (splitInstance) {
          const words = splitInstance.querySelectorAll('div');
          allWords.push(...Array.from(words));
        }
      }
    });

    if (allWords.length > 0) {
      tl.to(
        allWords,
        {
          duration: 0.75, // Template uses 0.75
          yPercent: 0,
          stagger: 0.05,
          ease: EASINGS.power4Out,
        },
        '-=0.3'
      );
    }

    // Animate footer - EXACT template timing
    if (menuFooterRef.current) {
      tl.to(
        menuFooterRef.current,
        {
          duration: 0.3, // Template uses 0.3
          y: 0,
          ease: EASINGS.power2Out,
          onComplete: () => {
            if (timeRef.current) {
              setRef(timeRef as RefObject<HTMLElement>, { opacity: 1 });
            }

            const footerChars: Element[] = [];
            const footerElements = menuFooterRef.current?.querySelectorAll('.SplitText');
            footerElements?.forEach((splitEl) => {
              const chars = splitEl.querySelectorAll('div');
              footerChars.push(...Array.from(chars));
            });

            // Template uses 30ms stagger for chars
            footerChars.forEach((char, index) => {
              setTimeout(() => {
                scrambleText([char], 0.4);
              }, index * 30);
            });
          },
        },
        '-=1'
      );
    }
  };

  const closeMenu = () => {
    if (isAnimating) return;
    
    setIsOpen(false);
    setIsAnimating(true);
    
    // Remove classes for hamburger and logo animation
    if (hamburgerRef.current) {
      hamburgerRef.current.classList.remove('open');
    }
    if (logoRef.current) {
      logoRef.current.classList.remove('rotated');
    }

    const tl = createTimeline({
      onComplete: () => setIsAnimating(false),
    });

    // Animate footer out
    if (menuFooterRef.current) {
      tl.to(menuFooterRef.current, {
        duration: DURATIONS.fast,
        y: 20,
        ease: EASINGS.power2In,
        onStart: () => {
          if (timeRef.current) {
            setRef(timeRef as RefObject<HTMLElement>, { opacity: 0 });
          }

          const footerChars: Element[] = [];
          const footerElements = menuFooterRef.current?.querySelectorAll('.SplitText');
          footerElements?.forEach((splitEl) => {
            const chars = splitEl.querySelectorAll('div');
            footerChars.push(...Array.from(chars));
          });
          
          if (footerChars.length > 0) {
            setRef({ current: footerChars as unknown as HTMLElement }, { opacity: 0 });
          }
        },
      });
    }

    // Animate menu items out
    const allWords: Element[] = [];
    menuItemRefs.forEach((ref) => {
      if (ref.current) {
        const splitInstance = ref.current.querySelector('.SplitText');
        if (splitInstance) {
          const words = splitInstance.querySelectorAll('div');
          allWords.push(...Array.from(words));
        }
      }
    });

    if (allWords.length > 0) {
      tl.to(
        allWords,
        {
          duration: 0.25,
          yPercent: 120,
          stagger: -0.025,
          ease: EASINGS.power2In,
        },
        '-=0.25'
      );
    }

    // Animate overlay out
    if (menuOverlayRef.current) {
      tl.to(
        menuOverlayRef.current,
        {
          duration: DURATIONS.normal,
          scaleY: 0,
          ease: EASINGS.power3InOut,
        },
        '-=0.2'
      );
    }
  };

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  return (
    <nav ref={menuRef} className="menu">
      <div className="menu-header" onClick={toggleMenu}>
        <a 
          href="#home" 
          className="menu-logo"
          data-transition="true"
        >
          <Image
            ref={logoRef}
            src="/assets/landing/global/logo.png"
            alt="Logo"
            width={20}
            height={20}
            style={{ width: '1.25rem', height: '1.25rem' }}
          />
        </a>
        <button className="menu-toggle" aria-label="Toggle menu">
          <div ref={hamburgerRef} className="menu-hamburger-icon">
            <span className="menu-item"></span>
            <span className="menu-item"></span>
          </div>
        </button>
      </div>
      <div ref={menuOverlayRef} className="menu-overlay">
        <nav className="menu-nav">
          <ul>
            {menuLinks.map((link, index) => (
              <li key={link.href}>
                <a 
                  ref={menuItemRefs[index]}
                  href={link.href}
                  data-transition="true"
                  onClick={() => {
                    closeMenu();
                  }}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div ref={menuFooterRef} className="menu-footer">
          <div className="menu-social">
            <a href="#">
              <span>▶</span> Instagram
            </a>
            <a href="#">
              <span>▶</span> LinkedIn
            </a>
          </div>
          <div ref={timeRef} className="menu-time">{currentTime}</div>
        </div>
      </div>
    </nav>
  );
}