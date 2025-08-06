'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

interface TransitionProps {
  onSectionChange?: (section: string) => void;
}

export function Transition({ onSectionChange }: TransitionProps = {}) {
  const router = useRouter();
  const transitionRef = useRef<HTMLDivElement>(null);
  const maskTransitionRef = useRef<HTMLDivElement>(null);
  const maskBgOverlayRef = useRef<HTMLDivElement>(null);

  const calculateLogoScale = () => {
    const logoSize = 60;
    // Foldly logo: 3 connected geometric shapes forming an F with folded paper effect
    const logoData =
      // All three shapes connected as one path
      'M50 80 L220 50 L200 100 L100 115 L100 180 L200 165 L180 215 L100 230 L100 350 L50 350 Z';

    const tempSvg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    const tempPath = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'path'
    );
    tempPath.setAttribute('d', logoData);
    tempSvg.appendChild(tempPath);
    document.body.appendChild(tempSvg);

    const bbox = tempPath.getBBox();
    document.body.removeChild(tempSvg);

    const scale = logoSize / Math.max(bbox.width, bbox.height);

    return { scale, bbox };
  };

  const createMaskOverlay = () => {
    if (!maskTransitionRef.current) return;

    maskTransitionRef.current.innerHTML = `
      <svg width="100%" height="100%">
        <defs>
          <mask id="logoRevealMask">
            <rect width="100%" height="100%" fill="white" />
            <path id="logoMask" fill="black"></path>
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="var(--base-300)"
          mask="url(#logoRevealMask)"
        />
      </svg>
    `;
  };

  const revealTransition = () => {
    return new Promise<void>((resolve) => {
      createMaskOverlay();

      const logoMask = document.getElementById('logoMask');
      if (!logoMask) return resolve();

      // Foldly logo: 3 connected geometric shapes forming an F with folded paper effect
      const logoData =
        // All three shapes connected as one path
        'M50 80 L220 50 L200 100 L100 115 L100 180 L200 165 L180 215 L100 230 L100 350 L50 350 Z';

      logoMask.setAttribute('d', logoData);

      const { scale: logoScale, bbox } = calculateLogoScale();
      const pathCenterX = bbox.x + bbox.width / 2;
      const pathCenterY = bbox.y + bbox.height / 2;

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;

      const initialScale = logoScale;
      const translateX = viewportCenterX - pathCenterX * initialScale;
      const translateY = viewportCenterY - pathCenterY * initialScale;

      logoMask.setAttribute(
        'transform',
        `translate(${translateX}, ${translateY}) scale(${initialScale})`
      );

      gsap.set(maskTransitionRef.current, {
        display: 'block',
      });

      gsap.set(maskBgOverlayRef.current, {
        display: 'block',
        opacity: 1,
      });

      const scaleMultiplier = window.innerWidth < 1000 ? 15 : 40;

      gsap.to(
        {},
        {
          duration: 2,
          delay: 0,
          ease: 'power2.inOut',
          onUpdate: function () {
            const progress = this.progress();
            const scale = initialScale + progress * scaleMultiplier;

            const newTranslateX = viewportCenterX - pathCenterX * scale;
            const newTranslateY = viewportCenterY - pathCenterY * scale;

            logoMask.setAttribute(
              'transform',
              `translate(${newTranslateX}, ${newTranslateY}) scale(${scale})`
            );

            const fadeProgress = Math.min(0.3, progress * 2.5);
            gsap.set(maskBgOverlayRef.current, {
              opacity: 0.3 - fadeProgress,
            });
          },
          onComplete: () => {
            gsap.set(maskTransitionRef.current, { display: 'none' });
            gsap.set(maskBgOverlayRef.current, { display: 'none' });
            resolve();
          },
        }
      );

      const overlayElements = document.querySelectorAll('.transition-overlay');
      if (overlayElements.length > 0) {
        gsap.set('.transition-overlay', { scaleY: 0 });
      }
    });
  };

  const animateTransition = useCallback((section: string, isExternal = false) => {
    return new Promise<void>((resolve) => {
      const overlayElements = document.querySelectorAll('.transition-overlay');
      if (overlayElements.length === 0) {
        resolve();
        return;
      }
      
      gsap.set('.transition-overlay', { scaleY: 0, transformOrigin: 'bottom' });

      gsap.to('.transition-overlay', {
        scaleY: 1,
        duration: 0.75,
        ease: 'power4.out',
        onStart: () => {
          const logoElements = document.querySelectorAll('.transition-logo');
          if (logoElements.length > 0) {
            gsap.set('.transition-logo', {
              top: '120%',
              opacity: 1,
            });

            gsap.to('.transition-logo', {
              top: '50%',
              transform: 'translate(-50%, -50%)',
              duration: 0.75,
              delay: 0.5,
              ease: 'power4.out',
              onComplete: () => {
                setTimeout(() => {
                  if (isExternal) {
                    router.push(section);
                  } else if (onSectionChange) {
                    onSectionChange(section);
                  }
                  resolve();
                }, 50);
              },
            });
          }
        },
      });
    });
  }, [router, onSectionChange]);

  // Handle navigation link clicks
  const handleLinkClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Check if it's an internal section link
    if (href.startsWith('#')) {
      e.preventDefault();
      const section = href.substring(1);
      
      // Animate transition then scroll to section
      animateTransition(section).then(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      });
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      // Internal page navigation
      e.preventDefault();
      animateTransition(href, true);
    }
  }, [animateTransition]);

  // Initial page load transition and setup click handlers
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initial reveal
    revealTransition();
    
    // Setup global link click handlers
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is inside a link with data-transition
      const transitionLink = target.closest('a[data-transition="true"]');
      if (transitionLink) {
        handleLinkClick(e);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleLinkClick]);

  // Export transition function for external use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).pageTransition = animateTransition;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).pageTransition;
      }
    };
  }, [animateTransition]);

  return (
    <>
      <div ref={transitionRef} className="transition">
        <div className="transition-overlay overlay"></div>
        <div className="transition-logo">
          <Image
            src="/assets/img/logo/foldly_logo_sm.png"
            alt="Foldly Logo"
            width={60}
            height={60}
          />
        </div>
      </div>
      <div ref={maskTransitionRef} className="mask-transition"></div>
      <div ref={maskBgOverlayRef} className="mask-bg-overlay"></div>
    </>
  );
}