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
        Hi {displayName},
      </Text>

      <Text style={paragraph}>
        We're thrilled to have you join Foldly! Your account is now set up and
        ready to go.
      </Text>

      <Text style={paragraph}>
        Foldly makes it easy to collect files from anyone via shareable links -
        no account needed for them. Perfect for collecting documents, images,
        videos, and more.
      </Text>

      <Hr style={divider} />

      <Heading style={subheading}>What you can do now:</Heading>

      <Text style={featureItem}>
        ✓ <strong>Create shareable links</strong> - Generate unique upload
        links in seconds
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Organize with folders</strong> - Keep your files structured
        and tidy
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Track uploads by email</strong> - Know exactly who uploaded
        what
      </Text>

      <Text style={featureItem}>
        ✓ <strong>Manage permissions</strong> - Control who can view and edit
      </Text>

      <Hr style={divider} />

      <Text style={paragraph}>
        Ready to get started? Head to your dashboard and create your first
        shareable link!
      </Text>

      <Button
        href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
        style={button}
      >
        Go to Dashboard
      </Button>

      <Text style={footerNote}>
        If you have any questions, just reply to this email. We're here to
        help!
      </Text>

      <Text style={signature}>
        Best,
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
