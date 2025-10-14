// =============================================================================
// EDITOR PROMOTION EMAIL TEMPLATE
// =============================================================================
// Sent when a user is granted editor permissions on a link or folder

import { Button, Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailBodyLayout } from './email-body-layout';

export interface EditorPromotionEmailTemplateProps {
  ownerName: string;
  ownerEmail: string;
  resourceType: 'link' | 'folder';
  resourceName: string;
  resourceUrl: string;
  otp: string;
}

export function EditorPromotionEmailTemplate({
  ownerName,
  ownerEmail,
  resourceType,
  resourceName,
  resourceUrl,
  otp,
}: EditorPromotionEmailTemplateProps) {
  const resourceLabel = resourceType === 'link' ? 'link' : 'folder';

  return (
    <EmailBodyLayout
      preview={`You now have editor access to ${resourceName}`}
    >
      <Heading style={heading}>You've Been Promoted to Editor 🎉</Heading>

      <Text style={paragraph}>
        Great news! <strong>{ownerName}</strong> has granted you editor
        permissions for the <strong>{resourceName}</strong> {resourceLabel}.
      </Text>

      <Hr style={divider} />

      {/* Permissions Box */}
      <div style={permissionsBox}>
        <Text style={permissionsHeading}>What you can do now:</Text>

        <Text style={permissionItem}>
          ✓ <strong>Upload files</strong> - Add your own files to the{' '}
          {resourceLabel}
        </Text>

        <Text style={permissionItem}>
          ✓ <strong>View all uploads</strong> - See files uploaded by others
        </Text>

        <Text style={permissionItem}>
          ✓ <strong>Manage files</strong> - Organize, rename, and delete files
        </Text>

        {resourceType === 'folder' && (
          <Text style={permissionItem}>
            ✓ <strong>Manage subfolders</strong> - Create and organize
            subfolders
          </Text>
        )}

        <Text style={permissionItem}>
          ✓ <strong>Download files</strong> - Access and download any file
        </Text>
      </div>

      <Hr style={divider} />

      <Text style={paragraph}>
        To get started, you'll need to verify your email address. Here's your
        verification code:
      </Text>

      {/* OTP Display */}
      <div style={otpBox}>
        <Text style={otpCode}>{otp}</Text>
      </div>

      <Text style={paragraph}>
        This code will expire in <strong>10 minutes</strong>. Click the button
        below to access the {resourceLabel} and enter your code.
      </Text>

      <Button href={resourceUrl} style={button}>
        Verify & Access {resourceType === 'link' ? 'Link' : 'Folder'}
      </Button>

      <Text style={infoNote}>
        <strong>Note:</strong> No account creation required! Once you verify
        your email, you'll have full editor access to this {resourceLabel}.
      </Text>

      <Hr style={divider} />

      <Text style={footerNote}>
        You were promoted to editor by {ownerName}. If you have questions about
        your permissions, contact them at{' '}
        <a href={`mailto:${ownerEmail}`} style={link}>
          {ownerEmail}
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

const permissionsBox = {
  backgroundColor: '#f0f8f4',
  border: '2px solid #22c55e',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const permissionsHeading = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
};

const permissionItem = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#333333',
  margin: '0 0 12px',
};

const otpBox = {
  backgroundColor: '#ffffff',
  border: '2px dashed #5469d4',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const otpCode = {
  fontSize: '48px',
  fontWeight: '700',
  letterSpacing: '8px',
  color: '#5469d4',
  fontFamily: 'Monaco, Courier, monospace',
  margin: '0',
  lineHeight: '1.2',
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

const infoNote = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  backgroundColor: '#f6f9fc',
  padding: '16px',
  borderRadius: '6px',
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
