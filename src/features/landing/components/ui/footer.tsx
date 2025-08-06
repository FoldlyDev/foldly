'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { FooterLink } from '../../types';

const footerLinks: FooterLink[] = [
  { href: '/', label: 'Start Here' },
  { href: '/about', label: "Who's Juno" },
  { href: '/work', label: 'The Cool Work' },
  { href: '/project', label: 'Single Project' },
  { href: '/contact', label: 'Slide Into Inbox' },
];

export function Footer() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <p className="mono">
              <span>▶</span> Drop your email if you vibe
            </p>
            <div className="footer-email-container">
              <form onSubmit={handleEmailSubmit} className="footer-email-row">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit">
                  <Image
                    src="/assets/landing/global/footer-right-arrow.png"
                    alt="Submit"
                    width={20}
                    height={20}
                  />
                </button>
              </form>
            </div>
          </div>
          <div className="footer-col"></div>
        </div>
        <div className="footer-bottom">
          <div className="footer-col">
            <div className="footer-logo">
              <Image
                src="/assets/landing/global/logo.png"
                alt="Logo"
                width={60}
                height={60}
              />
            </div>
          </div>
          <div className="footer-col">
            <div className="footer-sub-col">
              <p className="mono">Explore</p>
              <div className="footer-links">
                {footerLinks.map((link) => (
                  <p key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </p>
                ))}
              </div>
            </div>
            <div className="footer-sub-col">
              <p className="mono">Stalk Me</p>
              <div className="footer-copy">
                <p>Unit 7, The Pixel Building</p>
                <p>Z Street, Amsterdam</p>
                <br />
                <p>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LinkedIn
                  </a>
                </p>
                <p>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <div className="footer-col">
            <p className="mono">MWT July 2025</p>
          </div>
          <div className="footer-col">
            <div className="footer-sub-col">
              <p className="mono">Made by Codegrid</p>
            </div>
            <div className="footer-sub-col">
              <p className="mono">© 2025 All Rights Reserved</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}