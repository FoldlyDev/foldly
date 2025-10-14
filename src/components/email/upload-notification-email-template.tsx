// =============================================================================
// UPLOAD NOTIFICATION EMAIL TEMPLATE
// =============================================================================
// Sent to workspace owner when someone uploads a file to their link

import { Button, Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailBodyLayout } from './email-body-layout';

export interface UploadNotificationEmailTemplateProps {
  uploaderName?: string;
  uploaderEmail: string;
  fileName: string;
  linkName: string;
  linkUrl: string;
}

export function UploadNotificationEmailTemplate({
  uploaderName,
  uploaderEmail,
  fileName,
  linkName,
  linkUrl,
}: UploadNotificationEmailTemplateProps) {
  const displayName = uploaderName || uploaderEmail;

  return (
    <EmailBodyLayout preview={`New file uploaded: ${fileName}`}>
      <Heading style={heading}>New File Uploaded 📁</Heading>

      <Text style={paragraph}>
        <strong>{displayName}</strong> just uploaded a file to your{' '}
        <strong>{linkName}</strong> link.
      </Text>

      <Hr style={divider} />

      {/* Upload Details Box */}
      <div style={detailsBox}>
        <Text style={detailLabel}>File Name:</Text>
        <Text style={detailValue}>{fileName}</Text>

        <Text style={detailLabel}>Uploaded by:</Text>
        <Text style={detailValue}>
          {uploaderName && <>{uploaderName}<br /></>}
          {uploaderEmail}
        </Text>

        <Text style={detailLabel}>Link:</Text>
        <Text style={detailValue}>{linkName}</Text>
      </div>

      <Hr style={divider} />

      <Text style={paragraph}>
        View and manage this file in your workspace dashboard.
      </Text>

      <Button
        href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
        style={button}
      >
        View in Dashboard
      </Button>

      <Text style={footerNote}>
        You're receiving this because you own the link{' '}
        <a href={linkUrl} style={link}>
          {linkName}
        </a>
        . You can manage notification settings in your dashboard.
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

const detailsBox = {
  backgroundColor: '#f6f9fc',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const detailLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#666666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const detailValue = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#1a1a1a',
  margin: '0 0 16px',
  wordBreak: 'break-word' as const,
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
