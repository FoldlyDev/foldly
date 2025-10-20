// =============================================================================
// EMAIL SERVICE TYPES
// =============================================================================
// TypeScript type definitions for email service operations

// =============================================================================
// EMAIL TEMPLATE PROPS
// =============================================================================

/**
 * Props for OTP verification email template
 */
export type OTPVerificationEmailProps = {
  otp: string;
  expiresInMinutes: number;
};

/**
 * Props for upload notification email template
 */
export type UploadNotificationEmailProps = {
  uploaderName?: string;
  uploaderEmail: string;
  fileName: string;
  linkName: string;
  linkUrl: string;
};

/**
 * Props for invitation email template
 */
export type InvitationEmailProps = {
  recipientName?: string;
  senderName: string;
  customMessage?: string;
  linkUrl: string;
  linkName: string;
};

/**
 * Props for editor promotion email template
 */
export type EditorPromotionEmailProps = {
  email: string;
  otp: string;
  linkName: string;
  ownerName: string;
};

// =============================================================================
// SERVER ACTION PAYLOADS
// =============================================================================

/**
 * Input data for sending OTP verification email
 */
export type SendOTPEmailInput = {
  email: string;
  otp: string;
  expiresInMinutes: number;
};

/**
 * Input data for sending upload notification email
 */
export type SendUploadNotificationInput = {
  ownerEmail: string;
  uploaderEmail: string;
  uploaderName?: string;
  fileName: string;
  linkName: string;
  linkUrl: string;
};

/**
 * Input data for sending invitation email
 */
export type SendInvitationInput = {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderEmail: string;
  senderUserId: string;
  customMessage?: string;
  linkUrl: string;
  linkName: string;
};

/**
 * Recipient information for bulk invitations
 */
export type InvitationRecipient = {
  email: string;
  name?: string;
};

/**
 * Input data for sending bulk invitation emails
 */
export type SendBulkInvitationInput = {
  recipients: InvitationRecipient[];
  senderUserId: string;
  senderName: string;
  senderEmail: string;
  customMessage?: string;
  linkUrl: string;
  linkName: string;
};

/**
 * Input data for sending editor promotion email
 */
export type SendEditorPromotionInput = {
  email: string;
  otp: string;
  ownerName: string;
  ownerEmail: string;
  resourceType: 'link' | 'folder';
  resourceName: string;
  resourceUrl: string;
};

// =============================================================================
// ACTION RESPONSE TYPES
// =============================================================================

/**
 * Standard email action response
 */
export type EmailActionResponse = {
  success: boolean;
  error?: string;
  blocked?: boolean;
  resetAt?: number;
};

/**
 * Bulk email action response with detailed results
 */
export type BulkEmailActionResponse = {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
};

// =============================================================================
// EMAIL CATEGORIES
// =============================================================================

/**
 * Email category types for tracking and analytics
 */
export type EmailCategory =
  | 'otp-verification'
  | 'upload-notification'
  | 'invitation'
  | 'editor-promotion'
  | 'system';

// =============================================================================
// EMAIL METADATA
// =============================================================================

/**
 * Metadata for email tracking and analytics
 */
export type EmailMetadata = {
  category: EmailCategory;
  userId?: string;
  workspaceId?: string;
  linkId?: string;
  timestamp: string;
};
