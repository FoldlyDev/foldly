'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNavigationAnimation } from '../../hooks/useNavigationAnimation';

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Index' },
  { href: '/about', label: 'The Dev' },
  { href: '/work', label: 'Cool Stuff' },
  { href: '/project', label: 'Log 01' },
  { href: '/contact', label: 'Ping Me' },
];

export function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
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
        <button ref={menuToggleRef} className="menu-toggle" aria-label="Toggle menu">
          <div ref={hamburgerMenuRef} className="menu menu-hamburger-icon">
            <span className="menu-item"></span>
            <span className="menu-item"></span>
          </div>
        </button>
      </div>
      <div ref={menuOverlayRef} className="menu-overlay">
        <nav className="menu-nav">
          <ul>
            {navLinks.map((link, index) => (
              <li
                key={link.href}
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