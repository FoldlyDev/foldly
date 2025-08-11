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
        <h3 ref={headerRef}>Uploads end but workflow doesn't</h3>
      </div>
      <div className="feature-highlight-strips">
        <div ref={stripRefs[0]} className="feature-highlight-strip fhs-1">
          <div className="feature feature-var-1"><p className="mono">Smart Links</p></div>
          <div className="feature feature-var-2"><p className="mono">UX</p></div>
          <div className="feature feature-var-3"><p className="mono">Version Control</p></div>
          <div className="feature feature-var-1"><p className="mono">Batch Processing</p></div>
          <div className="feature feature-var-3"><p className="mono">Team Flow</p></div>
          <div className="feature feature-var-1"><p className="mono">File Security</p></div>
        </div>
        <div ref={stripRefs[1]} className="feature-highlight-strip fhs-2">
          <div className="feature feature-var-2"><p className="mono">Analytics</p></div>
          <div className="feature feature-var-3"><p className="mono">Privacy</p></div>
          <div className="feature feature-var-1"><p className="mono">Link Management</p></div>
        </div>
        <div ref={stripRefs[2]} className="feature-highlight-strip fhs-3">
          <div className="feature feature-var-2"><p className="mono">Folders</p></div>
          <div className="feature feature-var-3"><p className="mono">Enterprise Ready</p></div>
          <div className="feature feature-var-1"><p className="mono">Storage</p></div>
          <div className="feature feature-var-2"><p className="mono">Permissions</p></div>
          <div className="feature feature-var-3"><p className="mono">API Access</p></div>
          <div className="feature feature-var-3"><p className="mono">Automation</p></div>
          <div className="feature feature-var-1"><p className="mono">Custom Domains</p></div>
        </div>
        <div ref={stripRefs[3]} className="feature-highlight-strip fhs-4">
          <div className="feature feature-var-1"><p className="mono">Type Safety</p></div>
          <div className="feature feature-var-2"><p className="mono">Real-time</p></div>
          <div className="feature feature-var-3">
            <p className="mono">Collaboration</p>
          </div>
        </div>
        <div ref={stripRefs[4]} className="feature-highlight-strip fhs-5">
          <div className="feature feature-var-1"><p className="mono">Workspace</p></div>
          <div className="feature feature-var-2"><p className="mono">Cloud Native</p></div>
          <div className="feature feature-var-3"><p className="mono">Next.js 15</p></div>
          <div className="feature feature-var-1"><p className="mono">No Limits</p></div>
          <div className="feature feature-var-2"><p className="mono">Fast Upload</p></div>
          <div className="feature feature-var-3"><p className="mono">Global CDN</p></div>
          <div className="feature feature-var-1"><p className="mono">Launch Ready</p></div>
          <div className="feature feature-var-2"><p className="mono">FoldlyPRO</p></div>
        </div>
        <div ref={stripRefs[5]} className="feature-highlight-strip fhs-6">
          <div className="feature feature-var-3"><p className="mono">File AI</p></div>
          <div className="feature feature-var-1"><p className="mono">Simple UI</p></div>
          <div className="feature feature-var-2"><p className="mono">Delivered</p></div>
          <div className="feature feature-var-3"><p className="mono">React 19</p></div>
        </div>
      </div>
    </section>
  );
});

FeatureHighlightSection.displayName = 'FeatureHighlightSection';