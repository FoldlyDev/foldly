'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { MenuLink } from '../../types';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(SplitText);
}

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
  
  const menuRef = useRef<HTMLElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const splitTextsRef = useRef<SplitText[]>([]);
  const footerSplitTextsRef = useRef<SplitText[]>([]);
  const lastScrollYRef = useRef(0);

  // Scramble text animation
  const scrambleText = (elements: Element[], duration = 0.4) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    elements.forEach((char) => {
      const originalText = char.textContent || '';
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

  // Initialize menu
  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.set(menuOverlayRef.current, {
      scaleY: 0,
      transformOrigin: 'top center',
    });

    // Initialize split text for menu items
    const menuItems = document.querySelectorAll('.menu-nav li');
    menuItems.forEach((item) => {
      const link = item.querySelector('a');
      if (link) {
        const split = new SplitText(link, {
          type: 'words',
          mask: 'words',
        });
        splitTextsRef.current.push(split);

        gsap.set(split.words, {
          yPercent: 120,
        });
      }
    });

    // Initialize split text for footer elements
    const footerElements = document.querySelectorAll(
      '.menu-social a, .menu-social span, .menu-time'
    );
    footerElements.forEach((element) => {
      const split = new SplitText(element, {
        type: 'chars',
      });
      footerSplitTextsRef.current.push(split);

      gsap.set(split.chars, {
        opacity: 0,
      });

      if (element.classList.contains('menu-time')) {
        gsap.set(element, { opacity: 0 });
      }
    });

    gsap.set('.menu-nav li', { opacity: 1 });
    gsap.set('.menu-footer', { opacity: 1, y: 20 });

    return () => {
      splitTextsRef.current.forEach((split) => split.revert());
      footerSplitTextsRef.current.forEach((split) => split.revert());
    };
  }, []);

  // Handle scroll to show/hide menu
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        if (isOpen) {
          closeMenu();
        }
        if (isMenuVisible) {
          menuRef.current?.classList.add('hidden');
          setIsMenuVisible(false);
        }
      } else if (currentScrollY < lastScrollYRef.current) {
        if (!isMenuVisible) {
          menuRef.current?.classList.remove('hidden');
          setIsMenuVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, isMenuVisible, isAnimating]);

  // Update time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
      });
      setCurrentTime(`${timeString} LOCAL`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openMenu = () => {
    if (isAnimating) return;
    
    setIsOpen(true);
    setIsAnimating(true);
    
    // Add classes for hamburger and logo animation
    const hamburgerMenu = document.querySelector('.menu-hamburger-icon');
    const menuLogo = document.querySelector('.menu-logo img');
    if (hamburgerMenu) {
      hamburgerMenu.classList.add('open');
    }
    if (menuLogo) {
      menuLogo.classList.add('rotated');
    }

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    tl.to(menuOverlayRef.current, {
      duration: 0.5,
      scaleY: 1,
      ease: 'power3.out',
    });

    const allWords = splitTextsRef.current.reduce((acc, split) => {
      return acc.concat(split.words || []);
    }, [] as Element[]);

    tl.to(
      allWords,
      {
        duration: 0.75,
        yPercent: 0,
        stagger: 0.05,
        ease: 'power4.out',
      },
      '-=0.3'
    );

    tl.to(
      '.menu-footer',
      {
        duration: 0.3,
        y: 0,
        ease: 'power2.out',
        onComplete: () => {
          const timeElement = document.querySelector('.menu-time');
          if (timeElement) {
            gsap.set(timeElement, { opacity: 1 });
          }

          const allFooterChars = footerSplitTextsRef.current.reduce((acc, split) => {
            return acc.concat(split.chars || []);
          }, [] as Element[]);

          allFooterChars.forEach((char, index) => {
            setTimeout(() => {
              scrambleText([char], 0.4);
            }, index * 30);
          });
        },
      },
      '-=1'
    );
  };

  const closeMenu = () => {
    if (isAnimating) return;
    
    setIsOpen(false);
    setIsAnimating(true);
    
    // Remove classes for hamburger and logo animation
    const hamburgerMenu = document.querySelector('.menu-hamburger-icon');
    const menuLogo = document.querySelector('.menu-logo img');
    if (hamburgerMenu) {
      hamburgerMenu.classList.remove('open');
    }
    if (menuLogo) {
      menuLogo.classList.remove('rotated');
    }

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    const allWords = splitTextsRef.current.reduce((acc, split) => {
      return acc.concat(split.words || []);
    }, [] as Element[]);

    tl.to('.menu-footer', {
      duration: 0.3,
      y: 20,
      ease: 'power2.in',
      onStart: () => {
        const timeElement = document.querySelector('.menu-time');
        if (timeElement) {
          gsap.set(timeElement, { opacity: 0 });
        }

        const allFooterChars = footerSplitTextsRef.current.reduce((acc, split) => {
          return acc.concat(split.chars || []);
        }, [] as Element[]);
        gsap.set(allFooterChars, { opacity: 0 });
      },
    });

    tl.to(
      allWords,
      {
        duration: 0.25,
        yPercent: 120,
        stagger: -0.025,
        ease: 'power2.in',
      },
      '-=0.25'
    );

    tl.to(
      menuOverlayRef.current,
      {
        duration: 0.5,
        scaleY: 0,
        ease: 'power3.inOut',
      },
      '-=0.2'
    );
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
            src="/assets/landing/global/logo.png"
            alt="Logo"
            width={20}
            height={20}
            style={{ width: '1.25rem', height: 'auto' }}
          />
        </a>
        <button className="menu-toggle" aria-label="Toggle menu">
          <div className="menu-hamburger-icon">
            <span className="menu-item"></span>
            <span className="menu-item"></span>
          </div>
        </button>
      </div>
      <div ref={menuOverlayRef} className="menu-overlay">
        <nav className="menu-nav">
          <ul>
            {menuLinks.map((link) => (
              <li key={link.href}>
                <a 
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
        <div className="menu-footer">
          <div className="menu-social">
            <a href="#">
              <span>▶</span> Instagram
            </a>
            <a href="#">
              <span>▶</span> LinkedIn
            </a>
          </div>
          <div className="menu-time">{currentTime}</div>
        </div>
      </div>
    </nav>
  );
}