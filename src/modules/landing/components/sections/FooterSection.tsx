'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { dropEmail } from '../../lib/actions/vibe-check-actions';

export interface FooterSectionRefs {
  footerRef: React.RefObject<HTMLElement | null>;
  emailInputRef: React.RefObject<HTMLInputElement | null>;
  footerLinksRef: React.RefObject<HTMLDivElement | null>;
  footerCopyRef: React.RefObject<HTMLDivElement | null>;
}

interface FooterSectionProps {}

export const FooterSection = forwardRef<FooterSectionRefs, FooterSectionProps>((_, ref) => {
  const footerRef = useRef<HTMLElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const footerLinksRef = useRef<HTMLDivElement>(null);
  const footerCopyRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: ''
  });

  useImperativeHandle(ref, () => ({
    footerRef,
    emailInputRef,
    footerLinksRef,
    footerCopyRef,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const result = await dropEmail(email);

      if (result.success) {
        setFeedback({ type: 'success', message: 'we got you ✨' });
        setEmail('');
      } else {
        setFeedback({ type: 'error', message: result.error || 'that didn\'t work, try again?' });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'something broke, try again?' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 3000);
    }
  };

  return (
    <footer ref={footerRef}>
      <div className="container">
        <div className="footer-top">
          <div className="footer-col">
            <p className="mono"><span>▶</span> Drop your email if you vibe</p>
            <div className="footer-email-container">
              <form onSubmit={handleSubmit} className="footer-email-row">
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.6 : 1 }}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.opacity = '0.8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = isSubmitting ? '0.6' : '1';
                  }}
                >
                  {isSubmitting ? (
                    <span style={{ fontSize: '12px' }}>...</span>
                  ) : (
                    <Image
                      src="/assets/landing/global/footer-right-arrow.png"
                      alt="Submit"
                      width={12}
                      height={12}
                    />
                  )}
                </button>
              </form>
              {feedback.message && (
                <p
                  className="mono"
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: feedback.type === 'success' ? '#00ff00' : '#ff6b6b',
                    animation: 'fadeIn 0.3s ease-in'
                  }}
                >
                  {feedback.message}
                </p>
              )}
            </div>
          </div>
          <div className="footer-col"></div>
        </div>
        <div className="footer-bottom">
          <div className="footer-col">
            <div className="footer-logo">
              <Image
                src="/assets/img/logo/foldly_logo_sm.png"
                alt="Foldly"
                width={100}
                height={100}
              />
            </div>
          </div>
          <div className="footer-col">
            <div className="footer-sub-col">
              <p className="mono">Explore</p>
              <div ref={footerLinksRef} className="footer-links">
                {/* <p><Link href="/">Start Here</Link></p>
                <p><Link href="/features">Features</Link></p>
                <p><Link href="/pricing">Pricing</Link></p>
                <p><Link href="/docs">Documentation</Link></p>
                <p><Link href="/contact">Get in Touch</Link></p> */}
                <p><Link href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></p>
              </div>
            </div>
            <div className="footer-sub-col">
              <p className="mono">Connect</p>
              <div ref={footerCopyRef} className="footer-copy">
                <p>Foldly Technologies</p>
                <p>Building the future of file sharing</p>
                <br />
                <p><a href="https://twitter.com/foldly" target="_blank" rel="noopener noreferrer">Twitter</a></p>
                <p><a href="https://github.com/foldly" target="_blank" rel="noopener noreferrer">GitHub</a></p>
                <p><a href="https://linkedin.com/company/foldly" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-copyright">
          <div className="footer-col">
            <p className="mono">© Foldly {new Date().getFullYear()}</p>
          </div>
          <div className="footer-col">
            <div className="footer-sub-col">
            </div>
            <div className="footer-sub-col">
              <p className="mono">Built with passion</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

FooterSection.displayName = 'FooterSection';