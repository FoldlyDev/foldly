// =============================================================================
// EMAIL BODY LAYOUT
// =============================================================================
// Shared layout wrapper for all Foldly email templates

import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface EmailBodyLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailBodyLayout({ preview, children }: EmailBodyLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>Foldly</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Foldly. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href="https://foldly.com" style={link}>
                Website
              </Link>
              {' • '}
              <Link href="https://foldly.com/support" style={link}>
                Support
              </Link>
              {' • '}
              <Link href="https://foldly.com/privacy" style={link}>
                Privacy
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 40px',
  borderBottom: '1px solid #e6e6e6',
};

const headerText = {
  margin: '0',
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  letterSpacing: '-0.5px',
};

const content = {
  padding: '40px 40px 0',
};

const footer = {
  padding: '32px 40px',
  borderTop: '1px solid #e6e6e6',
  marginTop: '40px',
};

const footerText = {
  margin: '0 0 8px',
  fontSize: '12px',
  color: '#8898aa',
  textAlign: 'center' as const,
};

const footerLinks = {
  margin: '0',
  fontSize: '12px',
  color: '#8898aa',
  textAlign: 'center' as const,
};

const link = {
  color: '#5469d4',
  textDecoration: 'none',
};
