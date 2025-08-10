'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface AboutSectionRefs {
  skillsContainerRef: React.RefObject<HTMLDivElement | null>;
  objectContainerRef: React.RefObject<HTMLDivElement | null>;
  galleryCardsContainerRef: React.RefObject<HTMLDivElement | null>;
  galleryCardRefs: React.RefObject<HTMLDivElement | null>[];
}

interface AboutSectionProps {}

export const AboutSection = forwardRef<AboutSectionRefs, AboutSectionProps>((_, ref) => {
  const skillsContainerRef = useRef<HTMLDivElement>(null);
  const objectContainerRef = useRef<HTMLDivElement>(null);
  const galleryCardsContainerRef = useRef<HTMLDivElement>(null);
  const galleryCardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useImperativeHandle(ref, () => ({
    skillsContainerRef,
    objectContainerRef,
    galleryCardsContainerRef,
    galleryCardRefs,
  }));

  const skills = [
    { name: 'Drag & Drop', variant: 'os-1' },
    { name: 'File Sharing', variant: 'os-2' },
    { name: 'Cloud Storage', variant: 'os-3' },
    { name: 'Link Management', variant: 'os-1' },
    { name: 'Real-time Sync', variant: 'os-2' },
    { name: 'Analytics', variant: 'os-3' },
    { name: 'Collaboration', variant: 'os-1' },
    { name: 'Security', variant: 'os-2' },
    { name: 'Workflows', variant: 'os-3' },
    { name: 'Automation', variant: 'os-1' },
  ];

  const galleryImages = [
    { id: 'F01-842', src: '/images/gallery/gallery-1.jpg' },
    { id: 'V9-372K', src: '/images/gallery/gallery-2.jpg' },
    { id: 'Z84-Q17', src: '/images/gallery/gallery-3.jpg' },
    { id: 'L56-904', src: '/images/gallery/gallery-4.jpg' },
    { id: 'A23-7P1', src: '/images/gallery/gallery-5.jpg' },
    { id: 'T98-462', src: '/images/gallery/gallery-6.jpg' },
  ];

  return (
    <>

      {/* Skills Section */}
      <section ref={skillsContainerRef} className="about-skills">
        <div className="container">
          <div className="about-skills-col">
            <div className="symbols-container">
              <div className="symbol">
                <span className="symbol-icon light">◆</span>
              </div>
              <div className="symbol">
                <span className="symbol-icon light">◇</span>
              </div>
            </div>
            <div className="about-skills-copy-wrapper">
              <div className="about-skills-callout">
                <p className="mono" data-animate-type="scramble" data-animate-delay="0.2" data-animate-on-scroll="true">
                  <span>▸</span> Making file management feel like magic
                </p>
              </div>
              <div className="about-skills-header">
                <h3 data-animate-type="line-reveal" data-animate-delay="0.4" data-animate-on-scroll="true">
                  Features that power your workflow
                </h3>
              </div>
            </div>
          </div>
          <div className="about-skills-col skills-playground">
            <div ref={objectContainerRef} className="object-container">
              {skills.map((skill, index) => (
                <div key={index} className={`object ${skill.variant}`}>
                  <p className="mono">{skill.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section ref={galleryCardsContainerRef} className="about-sticky-cards">
        <div className="sticky-cards-header">
          <h3 data-animate-type="line-reveal" data-animate-delay="0.2" data-animate-on-scroll="true">
            See Foldly in action
          </h3>
        </div>
        <div className="home-spotlight-top-bar">
          <div className="container">
            <div className="symbols-container">
              <div className="symbol">
                <span className="symbol-icon">⬢</span>
              </div>
              <div className="symbol">
                <span className="symbol-icon">◆</span>
              </div>
              <div className="symbol">
                <span className="symbol-icon">◇</span>
              </div>
            </div>
            <div className="symbols-container">
              <div className="symbol">
                <span className="symbol-icon">⬢</span>
              </div>
              <div className="symbol">
                <span className="symbol-icon">◆</span>
              </div>
              <div className="symbol">
                <span className="symbol-icon">◇</span>
              </div>
            </div>
          </div>
        </div>
        <div className="home-spotlight-bottom-bar">
          <div className="container">
            <p className="mono" data-animate-type="scramble" data-animate-delay="0.2" data-animate-on-scroll="true">
              <span>▸</span> Gallery Mode
            </p>
            <p className="mono" data-animate-type="scramble" data-animate-delay="0.25" data-animate-on-scroll="true">
              / Screenshots
            </p>
          </div>
        </div>
        {galleryImages.map((image, index) => (
          <div key={index} ref={galleryCardRefs[index]} className="gallery-card">
            <div className="gallery-card-img">
              <div className="gallery-card-placeholder" />
            </div>
            <div className="gallery-card-content">
              <p className="mono">{image.id}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
});

AboutSection.displayName = 'AboutSection';
