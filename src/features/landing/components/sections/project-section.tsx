'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProjectSnapshot {
  id: number;
  src: string;
  alt: string;
}

const projectSnapshots: ProjectSnapshot[] = [
  { id: 1, src: '/assets/landing/project-images/project-img-1.jpg', alt: 'Project Snapshot 1' },
  { id: 2, src: '/assets/landing/project-images/project-img-2.jpg', alt: 'Project Snapshot 2' },
  { id: 3, src: '/assets/landing/project-images/project-img-3.jpg', alt: 'Project Snapshot 3' },
  { id: 4, src: '/assets/landing/project-images/project-img-4.jpg', alt: 'Project Snapshot 4' },
];

export function ProjectSection() {
  const snapshotsRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initHorizontalScroll = () => {
      const snapshots = snapshotsRef.current;
      const progressBarContainer = progressBarRef.current;
      
      if (!snapshots || !progressBarContainer) return;
      
      const progressBar = progressBarContainer.querySelector('.progress-bar') as HTMLElement;
      const snapshotsWrapper = snapshots.querySelector('.project-snapshots-wrapper') as HTMLElement;

      if (!progressBar || !snapshotsWrapper) {
        console.warn('Required elements not found for horizontal scroll animation');
        return;
      }

      // Set initial states
      gsap.set(progressBar, { width: '0%' });
      gsap.set(snapshotsWrapper, { x: '0%' });

      // Create horizontal scroll animation
      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: snapshots,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          
          // Move snapshots horizontally
          const xPercent = -progress * 80; // Move 80% of total width
          gsap.set(snapshotsWrapper, { x: `${xPercent}%` });
          
          // Update progress bar
          gsap.set(progressBar, { width: `${progress * 100}%` });
        },
      });
    };

    // Initialize after a small delay to ensure DOM is ready
    const timer = setTimeout(initHorizontalScroll, 100);

    return () => {
      clearTimeout(timer);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
    };
  }, []);

  return (
    <>
      <div className="home-spotlight-top-bar">
        <div className="container">
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
            </div>
          </div>
          <div className="symbols-container">
            <div className="symbol">
              <Image src="/assets/landing/symbols/s1-dark.png" alt="Symbol" width={18} height={18} />
            </div>
          </div>
        </div>
      </div>

      <section className="project-header" id="project">
        <div className="container">
          <div className="project-title">
            <h3 data-animate-type="reveal" data-animate-delay="0.25">
              Orange Room
            </h3>
          </div>
          <div className="project-header-divider"></div>
          <div className="project-meta">
            <div className="project-meta-col">
              <p data-animate-type="line-reveal" data-animate-delay="0.25">
                Orangeroom.uk.co
              </p>
              <p data-animate-type="line-reveal" data-animate-delay="0.3">
                Website
              </p>
            </div>
            <div className="project-meta-col">
              <div className="project-meta-sub-col">
                <p data-animate-type="line-reveal" data-animate-delay="0.25">
                  June 2024
                </p>
                <p data-animate-type="line-reveal" data-animate-delay="0.3">
                  Creative Dev, Experimental
                </p>
              </div>
              <div className="project-meta-sub-col">
                <p data-animate-type="line-reveal" data-animate-delay="0.25">
                  Client
                </p>
                <p data-animate-type="line-reveal" data-animate-delay="0.3">
                  Layer Eleven
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="project-banner-img">
        <div className="container">
          <Image
            src="/assets/landing/project-images/project-img-2.jpg"
            alt="Project 2"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      </section>

      <section className="project-overview">
        <div className="container">
          <div className="project-overview-col"></div>
          <div className="project-overview-col">
            <div className="project-stack">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.2"
                data-animate-on-scroll="true"
              >
                <span>▶</span> Stack
              </p>
              <br />
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.3"
                data-animate-on-scroll="true"
              >
                Next.js
              </p>
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.4"
                data-animate-on-scroll="true"
              >
                Tailwind CSS
              </p>
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.5"
                data-animate-on-scroll="true"
              >
                Supabase
              </p>
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.6"
                data-animate-on-scroll="true"
              >
                Vercel
              </p>
            </div>
            <div className="project-copy">
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.3"
                data-animate-on-scroll="true"
              >
                This experimental microsite explores the psychological tension
                between individuality and conformity through interactive scroll
                mechanics. Built as a commentary on digital monotony, every element
                responds to user behavior.
              </p>
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.5"
                data-animate-on-scroll="true"
              >
                The technical approach prioritized performance while maintaining
                visual complexity. Custom WebGL shaders create the signature orange
                glow effect, while GSAP handles the choreographed animations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section ref={snapshotsRef} className="project-snapshots">
        <div className="project-snapshots-wrapper">
          {projectSnapshots.map((snapshot) => (
            <div key={snapshot.id} className="project-snapshot">
              <Image
                src={snapshot.src}
                alt={snapshot.alt}
                width={1200}
                height={675}
                style={{ objectFit: 'cover' }}
                priority={snapshot.id <= 2}
              />
            </div>
          ))}
        </div>
        <div ref={progressBarRef} className="snapshots-progress-bar">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="progress-indicator" />
          ))}
          <div className="progress-bar" />
        </div>
      </section>

      <section className="project-info">
        <div className="container">
          <div className="project-info-col"></div>
          <div className="project-info-col">
            <div className="project-info-copy">
              <p
                className="mono"
                data-animate-type="scramble"
                data-animate-delay="0.2"
                data-animate-on-scroll="true"
              >
                <span>▶</span> Technical Deep Dive
              </p>
              <br />
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.3"
                data-animate-on-scroll="true"
              >
                The Orange Room project pushed the boundaries of what's possible
                with modern web technologies. By leveraging WebGL for the signature
                glow effects and GSAP for precise animation choreography, we created
                an experience that feels both otherworldly and intimately familiar.
              </p>
              <p
                data-animate-type="line-reveal"
                data-animate-delay="0.5"
                data-animate-on-scroll="true"
              >
                Every interaction was meticulously crafted to reinforce the theme
                of digital conformity versus individual expression. The result is
                a site that doesn't just tell a story — it makes you feel it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="project-media-row">
        <div className="container">
          <div className="project-media-col">
            <Image
              src="/assets/landing/project-images/project-img-1.jpg"
              alt="Project 1"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="project-media-col">
            <Image
              src="/assets/landing/project-images/project-img-3.jpg"
              alt="Project 3"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      <section className="project-full-width-img">
        <div className="container">
          <Image
            src="/assets/landing/project-images/project-img-4.jpg"
            alt="Project 4"
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>
      </section>

      <section className="next-project">
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
        <div className="container next-project-data">
          <div className="next-project-title">
            <h3 data-animate-type="reveal" data-animate-delay="0.25">
              Digital Echoes
            </h3>
          </div>
          <div className="next-project-header-divider"></div>
          <div className="next-project-meta">
            <div className="next-project-meta-col">
              <p data-animate-type="line-reveal" data-animate-delay="0.25">
                Digitalechoes.io
              </p>
              <p data-animate-type="line-reveal" data-animate-delay="0.3">
                Interactive Experience
              </p>
            </div>
            <div className="next-project-meta-col">
              <div className="next-project-meta-sub-col">
                <p data-animate-type="line-reveal" data-animate-delay="0.25">
                  September 2024
                </p>
                <p data-animate-type="line-reveal" data-animate-delay="0.3">
                  WebGL, Three.js
                </p>
              </div>
              <div className="next-project-meta-sub-col">
                <p data-animate-type="line-reveal" data-animate-delay="0.25">
                  Client
                </p>
                <p data-animate-type="line-reveal" data-animate-delay="0.3">
                  Echo Studios
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="home-spotlight-bottom-bar">
          <div className="container">
            <p
              className="mono"
              data-animate-type="scramble"
              data-animate-delay="0.25"
            >
              <span>▶</span> View Next Project
            </p>
          </div>
        </div>
      </section>

      <section className="project-closing">
        <div className="container">
          <div className="project-closing-header">
            <h3 data-animate-type="reveal" data-animate-delay="0.25">
              The Outcome
            </h3>
          </div>
          <div className="project-closing-copy">
            <p
              data-animate-type="line-reveal"
              data-animate-delay="0.3"
              data-animate-on-scroll="true"
            >
              Orange Room launched to critical acclaim within the creative
              development community. The site achieved a 97% engagement rate with
              an average session duration exceeding 4 minutes — rare metrics for
              experimental web experiences.
            </p>
            <p
              data-animate-type="line-reveal"
              data-animate-delay="0.5"
              data-animate-on-scroll="true"
            >
              Featured on Awwwards, FWA, and CSS Design Awards, the project proves
              that thoughtful interaction design can transform simple concepts into
              memorable digital experiences. Sometimes the best stories are told
              through scroll.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}