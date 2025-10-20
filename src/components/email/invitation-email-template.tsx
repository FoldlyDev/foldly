// =============================================================================
// INVITATION EMAIL TEMPLATE
// =============================================================================
// Sent when workspace owner invites someone to upload files to their link

import { Button, Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailBodyLayout } from './email-body-layout';

export interface InvitationEmailTemplateProps {
  inviterName: string;
  inviterEmail: string;
  linkName: string;
  linkUrl: string;
  message?: string;
}

export function InvitationEmailTemplate({
  inviterName,
  inviterEmail,
  linkName,
  linkUrl,
  message,
}: InvitationEmailTemplateProps) {
  return (
    <EmailBodyLayout preview={`${inviterName} invited you to upload files`}>
      <Heading style={heading}>You've Got an Invite 📨</Heading>

      <Text style={paragraph}>
        <strong>{inviterName}</strong> ({inviterEmail}) wants you to share some
        files through their <strong>{linkName}</strong> link on Foldly.
      </Text>

      {message && (
        <>
          <Hr style={divider} />

          {/* Personal Message Box */}
          <div style={messageBox}>
            <Text style={messageLabel}>Personal message:</Text>
            <Text style={messageText}>{message}</Text>
          </div>

          <Hr style={divider} />
        </>
      )}

      <Text style={paragraph}>
        Sharing files is super simple with Foldly. Click the button below and
        upload away - no account needed!
      </Text>

      <Button href={linkUrl} style={button}>
        Upload Files
      </Button>

      <Text style={infoText}>
        <strong>Here's how it works:</strong>
      </Text>

      <Text style={infoItem}>
        1. Hit the button above to open the link
      </Text>
      <Text style={infoItem}>2. Pick the files you want to share</Text>
      <Text style={infoItem}>
        3. Upload - your files are tracked securely by your email
      </Text>

      <Hr style={divider} />

      <Text style={footerNote}>
        {inviterName} sent you this invite. Got questions? Reach out to them at{' '}
        <a href={`mailto:${inviterEmail}`} style={link}>
          {inviterEmail}
        </a>
        .
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 16px',
};

const messageBox = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const messageLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#666666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};

const messageText = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#1a1a1a',
  margin: '0',
  fontStyle: 'italic',
  whiteSpace: 'pre-wrap' as const,
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

const infoText = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#1a1a1a',
  margin: '24px 0 12px',
};

const infoItem = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0 0 8px',
};

const footerNote = {
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#666666',
  margin: '24px 0 0',
  fontStyle: 'italic',
};

const link = {
  color: '#5469d4',
  textDecoration: 'none',
};
