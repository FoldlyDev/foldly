// =============================================================================
// WELCOME EMAIL TEMPLATE
// =============================================================================
// Sent to new users after successful signup

import { Button, Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailBodyLayout } from './email-body-layout';

export interface WelcomeEmailTemplateProps {
  firstName?: string;
  username: string;
}

export function WelcomeEmailTemplate({
  firstName,
  username,
}: WelcomeEmailTemplateProps) {
  const displayName = firstName || username;

  return (
    <EmailBodyLayout preview={`Welcome to Foldly, ${displayName}!`}>
      <Heading style={heading}>Welcome to Foldly! 👋</Heading>

      <Text style={paragraph}>
        Hey {displayName},
      </Text>

      <Text style={paragraph}>
        We're stoked to have you here! Your account is all set and ready to roll.
      </Text>

      <Text style={paragraph}>
        Foldly makes collecting files from anyone super easy - just share a link
        and they can upload straight away. No sign-ups, no hassle. Perfect for
        gathering documents, images, videos, you name it.
      </Text>

      <Hr style={divider} />

      <Heading style={subheading}>Here's what you can do:</Heading>

      <Text style={featureItem}>
        ✓ <strong>Share links</strong> - Create upload links in seconds
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Stay organized</strong> - Keep everything tidy with folders
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Track uploads</strong> - See exactly who sent what
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Control access</strong> - Decide who views and edits
      </Text>

      <Hr style={divider} />

      <Text style={paragraph}>
        Ready to dive in? Head to your dashboard and create your first link!
      </Text>

      <Button
        href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
        style={button}
      >
        Go to Dashboard
      </Button>

      <Text style={footerNote}>
        Questions? Just reply to this email - we're here to help!
      </Text>

      <Text style={signature}>
        Cheers,
        <br />
        The Foldly Team
      </Text>
    </EmailBodyLayout>
  );
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 24px',
  lineHeight: '1.3',
};

const subheading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '24px 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 16px',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 12px',
};

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px 0',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
};

const footerNote = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#666666',
  margin: '24px 0 16px',
  fontStyle: 'italic',
};

const signature = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0',
};
