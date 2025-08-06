'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const gifRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initFlickerAnimation = () => {
      const section = sectionRef.current;
      const gif = gifRef.current;

      if (!section || !gif) return;

      // Set initial state - hidden
      gsap.set(gif, {
        opacity: 0,
        filter: 'brightness(0) contrast(200%)',
      });

      // Create flicker reveal animation
      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'center center',
        onEnter: () => {
          // Flicker effect timeline
          const tl = gsap.timeline();

          // Quick flashes
          tl.to(gif, {
            opacity: 0.2,
            filter: 'brightness(2) contrast(150%)',
            duration: 0.05,
          })
          .to(gif, {
            opacity: 0,
            filter: 'brightness(0) contrast(200%)',
            duration: 0.05,
          })
          .to(gif, {
            opacity: 0.5,
            filter: 'brightness(1.5) contrast(120%)',
            duration: 0.1,
          })
          .to(gif, {
            opacity: 0.1,
            filter: 'brightness(0.5) contrast(150%)',
            duration: 0.05,
          })
          .to(gif, {
            opacity: 0.8,
            filter: 'brightness(1.2) contrast(110%)',
            duration: 0.15,
          })
          .to(gif, {
            opacity: 0.3,
            filter: 'brightness(0.8) contrast(120%)',
            duration: 0.05,
          })
          .to(gif, {
            opacity: 1,
            filter: 'brightness(1) contrast(100%)',
            duration: 0.3,
            ease: 'power2.out',
          });

          // Add glitch distortion effect
          const glitchTl = gsap.timeline({ repeat: 2 });
          glitchTl.to(gif, {
            x: () => gsap.utils.random(-5, 5),
            y: () => gsap.utils.random(-3, 3),
            duration: 0.02,
          })
          .to(gif, {
            x: 0,
            y: 0,
            duration: 0.02,
          });
        },
        once: true,
      });
    };

    // Initialize after a small delay
    const timer = setTimeout(initFlickerAnimation, 100);

    return () => {
      clearTimeout(timer);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="contact" id="contact">
      <div className="home-spotlight-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-light.png" alt="Symbol" width={18} height={18} />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-light.png" alt="Symbol" width={18} height={18} />
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="contact-header">
          <div className="contact-callout">
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.25"
            >
              <span>▶</span> Email: hey@junowatts.com
            </p>
          </div>
          <div className="contact-header-title">
            <h2 data-animate-type="line-reveal" data-animate-delay="0.25">
              Summon Juno to Your Project
            </h2>
          </div>
        </div>
        <div ref={gifRef} className="contact-gif">
          <Image
            src="/assets/landing/contact/contact.gif"
            alt="Contact"
            fill
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        </div>
      </div>
      <div className="home-spotlight-bottom-bar">
        <div className="container">
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
          >
            <span>▶</span> Instagram
          </p>
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
          >
            <span>▶</span> Twitter / X
          </p>
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
          >
            <span>▶</span> YouTube
          </p>
          <p
            className="mono"
            data-animate-type="scramble"
            data-animate-delay="0.25"
          >
            <span>▶</span> LinkedIn
          </p>
        </div>
      </div>
    </section>
  );
}