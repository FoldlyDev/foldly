'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface FeatureHighlightSectionRefs {
  sectionRef: React.RefObject<HTMLElement | null>;
  headerRef: React.RefObject<HTMLHeadingElement | null>;
  stripRefs: React.RefObject<HTMLDivElement | null>[];
}

interface FeatureHighlightSectionProps {}

export const FeatureHighlightSection = forwardRef<FeatureHighlightSectionRefs, FeatureHighlightSectionProps>((_, ref) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLHeadingElement>(null);
  const stripRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useImperativeHandle(ref, () => ({
    sectionRef,
    headerRef,
    stripRefs,
  }));

  return (
    <section ref={sectionRef} className="feature-highlight">
      <div className="container">
        <h3 ref={headerRef}>Everything you need, nothing you don't</h3>
      </div>
      <div className="feature-highlight-strips">
        <div ref={stripRefs[0]} className="feature-highlight-strip fhs-1">
          <div className="feature feature-var-1"><p className="mono">Custom Upload URLs</p></div>
          <div className="feature feature-var-2"><p className="mono">Drag-Drop Interface</p></div>
          <div className="feature feature-var-3"><p className="mono">File Versioning</p></div>
          <div className="feature feature-var-1"><p className="mono">Bulk Operations</p></div>
          <div className="feature feature-var-3"><p className="mono">Collaborative Workflows</p></div>
          <div className="feature feature-var-1"><p className="mono">Enterprise Protection</p></div>
        </div>
        <div ref={stripRefs[1]} className="feature-highlight-strip fhs-2">
          <div className="feature feature-var-2"><p className="mono">Usage Insights</p></div>
          <div className="feature feature-var-3"><p className="mono">Data Protection</p></div>
          <div className="feature feature-var-1"><p className="mono">URL Controls</p></div>
        </div>
        <div ref={stripRefs[2]} className="feature-highlight-strip fhs-3">
          <div className="feature feature-var-2"><p className="mono">Folder Templates</p></div>
          <div className="feature feature-var-3"><p className="mono">Scale-Ready</p></div>
          <div className="feature feature-var-1"><p className="mono">Cloud Storage</p></div>
          <div className="feature feature-var-2"><p className="mono">Access Control</p></div>
          <div className="feature feature-var-3"><p className="mono">Developer API</p></div>
          <div className="feature feature-var-3"><p className="mono">Workflow Automation</p></div>
          <div className="feature feature-var-1"><p className="mono">White-Label URLs</p></div>
        </div>
        <div ref={stripRefs[3]} className="feature-highlight-strip fhs-4">
          <div className="feature feature-var-1"><p className="mono">File Validation</p></div>
          <div className="feature feature-var-2"><p className="mono">Live Updates</p></div>
          <div className="feature feature-var-3">
            <p className="mono">Team Features</p>
          </div>
        </div>
        <div ref={stripRefs[4]} className="feature-highlight-strip fhs-5">
          <div className="feature feature-var-1"><p className="mono">Personal Hub</p></div>
          <div className="feature feature-var-2"><p className="mono">Email Notifications</p></div>
          <div className="feature feature-var-3"><p className="mono">Batch Downloads</p></div>
          <div className="feature feature-var-1"><p className="mono">QR Code Sharing</p></div>
          <div className="feature feature-var-2"><p className="mono">Optimized Speed</p></div>
          <div className="feature feature-var-3"><p className="mono">Worldwide Delivery</p></div>
          <div className="feature feature-var-1"><p className="mono">Production-Ready</p></div>
          <div className="feature feature-var-2"><p className="mono">Pro Features</p></div>
        </div>
        <div ref={stripRefs[5]} className="feature-highlight-strip fhs-6">
          <div className="feature feature-var-3"><p className="mono">Virus Scanning</p></div>
          <div className="feature feature-var-1"><p className="mono">Intuitive Interface</p></div>
          <div className="feature feature-var-2"><p className="mono">Mobile Responsive</p></div>
          <div className="feature feature-var-3"><p className="mono">Instant Previews</p></div>
        </div>
      </div>
    </section>
  );
});

FeatureHighlightSection.displayName = 'FeatureHighlightSection';