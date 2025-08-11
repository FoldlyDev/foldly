'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useUser } from '@clerk/nextjs';
import { useNavigationAnimation } from '../../hooks/useNavigationAnimation';
import { useOnboardingStatus } from '@/features/onboarding/hooks/use-onboarding-status';

interface NavLink {
  href: string;
  label: string;
  requiresAuth?: boolean;
  dynamicLink?: boolean;
}

export function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { data: onboardingData, isLoading: isOnboardingLoading } = useOnboardingStatus();
  
  const hasCompletedOnboarding = onboardingData?.hasWorkspace ?? null;
  const isAuthReady = isLoaded && !isOnboardingLoading;
  
  // Refs for animation - matching template structure
  const menuRef = useRef<HTMLElement>(null);
  const menuHeaderRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLLIElement[]>([]);
  const menuFooterRef = useRef<HTMLDivElement>(null);
  const menuLogoImgRef = useRef<HTMLImageElement>(null);
  const hamburgerMenuRef = useRef<HTMLDivElement>(null);
  const menuTimeRef = useRef<HTMLDivElement>(null);


  // Compute dynamic link values
  const authLink = {
    href: isSignedIn ? (hasCompletedOnboarding ? '/dashboard/workspace' : '/onboarding') : '/sign-in',
    label: isSignedIn ? (hasCompletedOnboarding ? 'Your Space' : 'Get Started') : 'Jump In',
  };

  // Static nav links structure to prevent re-initialization
  const navLinks: NavLink[] = [
    { href: '/', label: 'Home' },
    { href: authLink.href, label: authLink.label, dynamicLink: true },
    { href: '/pricing', label: 'The Deets' },
    { href: '/contact', label: 'Hit Us Up' },
  ];

  // Initialize animation hook
  useNavigationAnimation(
    {
      menuRef,
      menuHeaderRef,
      menuOverlayRef,
      menuItemsRef,
      menuFooterRef,
      menuLogoImgRef,
      hamburgerMenuRef,
    },
    {
      isOpen,
      onAnimatingChange: setIsAnimating,
      onOpenChange: setIsOpen,
      isReady: isAuthReady,
    }
  );

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      if (menuTimeRef.current) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
          hour12: false,
        });
        menuTimeRef.current.textContent = `${timeString} NY`;
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isAnimating) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <nav ref={menuRef} className="menu">
      <div ref={menuHeaderRef} className="menu-header" onClick={handleToggle}>
        <div className="menu-logo-wrapper">
          <Link href="/" className="menu-logo">
            <Image
              ref={menuLogoImgRef}
              src="/assets/img/logo/foldly_logo_sm.png"
              alt=""
              width={32}
              height={32}
              priority
            />
          </Link>
          {isSignedIn && user?.imageUrl && (
            <div className="menu-user-avatar">
              <Image
                src={user.imageUrl}
                alt={user.firstName || 'User'}
                width={32}
                height={32}
                className="menu-user-avatar-img"
              />
            </div>
          )}
        </div>
        <button ref={menuToggleRef} className="menu-toggle" aria-label="Toggle menu">
          {!isAuthReady ? (
            <div className="menu-spinner" />
          ) : (
            <div ref={hamburgerMenuRef} className="menu menu-hamburger-icon">
              <span className="menu-item"></span>
              <span className="menu-item"></span>
            </div>
          )}
        </button>
      </div>
      <div ref={menuOverlayRef} className="menu-overlay">
        <nav className="menu-nav">
          <ul key={isAuthReady ? 'ready' : 'loading'}>
            {navLinks.map((link, index) => (
              <li
                key={index}
                ref={(el) => {
                  if (el) menuItemsRef.current[index] = el;
                }}
              >
                <Link href={link.href} onClick={() => setIsOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div ref={menuFooterRef} className="menu-footer">
          <div className="menu-social">
            <a href="https://instagram.com/foldly" target="_blank" rel="noopener noreferrer">
              <span>▶</span> Instagram
            </a>
            <a href="https://linkedin.com/company/foldly" target="_blank" rel="noopener noreferrer">
              <span>▶</span> LinkedIn
            </a>
          </div>
          <div ref={menuTimeRef} className="menu-time">
            00:00:00 NY
          </div>
        </div>
      </div>
    </nav>
  );
}