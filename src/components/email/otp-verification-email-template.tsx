// =============================================================================
// OTP VERIFICATION EMAIL TEMPLATE
// =============================================================================
// Sent when user needs to verify their email with a one-time password

import { Heading, Hr, Text } from '@react-email/components';
import * as React from 'react';
import { EmailBodyLayout } from './email-body-layout';

export interface OTPVerificationEmailTemplateProps {
  otp: string;
  expiresInMinutes: number;
}

export function OTPVerificationEmailTemplate({
  otp,
  expiresInMinutes,
}: OTPVerificationEmailTemplateProps) {
  return (
    <EmailBodyLayout preview={`Your verification code is ${otp}`}>
      <Heading style={heading}>Your Verification Code</Heading>

      <Text style={paragraph}>
        Here's the code you requested. Pop this into the verification field and
        you're good to go:
      </Text>

      {/* OTP Code Box */}
      <div style={otpContainer}>
        <Text style={otpCode}>{otp}</Text>
      </div>

      <Text style={expiryText}>
        Quick heads up - this code expires in <strong>{expiresInMinutes} minutes</strong>.
      </Text>

      <Hr style={divider} />

      <Text style={securityNote}>
        <strong>Quick security tip:</strong>
      </Text>

      <Text style={securityItem}>• Keep this code to yourself</Text>
      <Text style={securityItem}>
        • We'll never ask you for this code
      </Text>
      <Text style={securityItem}>
        • Didn't request this? Just ignore this email
      </Text>

      <Hr style={divider} />

      <Text style={footerNote}>
        Need help? Drop us a line at{' '}
        <a href="mailto:dev@foldly.com" style={link}>
          dev@foldly.com
        </a>
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
  margin: '0 0 24px',
};

const otpContainer = {
  backgroundColor: '#f6f9fc',
  border: '2px dashed #5469d4',
  borderRadius: '8px',
  padding: '32px',
  textAlign: 'center' as const,
  margin: '32px 0',
};

const otpCode = {
  fontSize: '48px',
  fontWeight: '700',
  color: '#5469d4',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'monospace',
};

const expiryText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
};

const securityNote = {
  fontSize: '15px',
  lineHeight: '1.5',
  color: '#1a1a1a',
  margin: '0 0 12px',
};

const securityItem = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0 0 8px',
};

const footerNote = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#666666',
  margin: '24px 0 0',
  textAlign: 'center' as const,
};

const link = {
  color: '#5469d4',
  textDecoration: 'none',
};
