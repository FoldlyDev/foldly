// =============================================================================
// USE EMAIL HOOKS - Global Data Hooks
// =============================================================================
// 🎯 Email operations (send OTP, notifications, invitations, promotions)
//
// NOTE: Toast notifications are temporary until we finish implementing the
// internal notifications module. These will be replaced with the proper
// notification system once it's ready.

'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  sendOTPEmailAction,
  sendUploadNotificationEmailAction,
  sendInvitationEmailAction,
  sendBulkInvitationEmailsAction,
  sendEditorPromotionEmailAction,
} from '@/lib/actions/email.actions';
import type {
  SendOTPEmailInput,
  SendUploadNotificationInput,
  SendInvitationInput,
  SendBulkInvitationInput,
  SendEditorPromotionInput,
} from '@/lib/email/types';

/**
 * Send OTP verification email
 *
 * Used by:
 * - Authentication module (email verification)
 * - Permissions module (editor promotion verification)
 *
 * Features:
 * - Rate limited (5 per minute per email)
 * - Auto-expiry (10 minutes default)
 * - Success/error toast notifications
 *
 * @returns Mutation to send OTP email
 *
 * @example
 * ```typescript
 * const { mutate: sendOTP, isPending } = useSendOTPEmail();
 *
 * sendOTP({
 *   email: 'user@example.com',
 *   otp: '123456',
 *   expiresInMinutes: 10
 * });
 * ```
 */
export function useSendOTPEmail() {
  return useMutation({
    mutationFn: (data: SendOTPEmailInput) => sendOTPEmailAction(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Verification code sent! Check your email.');
      } else if (result.blocked) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(result.error || 'Failed to send verification code.');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred while sending code.');
    },
    retry: false,
  });
}

/**
 * Send upload notification email
 *
 * Used by:
 * - Uploads module (notify owner when file is uploaded)
 *
 * Features:
 * - Rate limited (20 per minute per owner)
 * - Silent operation (no user-facing toast notifications)
 * - Background execution
 *
 * Note: This is typically called from server actions after file upload completes.
 * Silent failures prevent blocking the upload flow.
 *
 * @returns Mutation to send upload notification
 *
 * @example
 * ```typescript
 * const { mutate: sendNotification } = useSendUploadNotification();
 *
 * sendNotification({
 *   ownerEmail: 'owner@example.com',
 *   uploaderEmail: 'uploader@example.com',
 *   uploaderName: 'John Doe',
 *   fileName: 'document.pdf',
 *   linkName: 'Tax Documents',
 *   linkUrl: 'https://foldly.com/john/tax-docs'
 * });
 * ```
 */
export function useSendUploadNotification() {
  return useMutation({
    mutationFn: (data: SendUploadNotificationInput) =>
      sendUploadNotificationEmailAction(data),
    // Silent operation - no toast notifications
    // Upload should succeed even if notification fails
    retry: false,
  });
}

/**
 * Send invitation email to single recipient
 *
 * Used by:
 * - Links module (invite users to upload files)
 * - Workspace module (share links with specific people)
 *
 * Features:
 * - Rate limited (20 per minute per sender)
 * - Custom message support (max 500 characters)
 * - Success/error toast notifications
 *
 * @returns Mutation to send invitation email
 *
 * @example
 * ```typescript
 * const { mutate: sendInvite, isPending } = useSendInvitation();
 *
 * sendInvite({
 *   recipientEmail: 'client@example.com',
 *   recipientName: 'Jane Smith',
 *   senderName: 'John Doe',
 *   senderEmail: 'john@example.com',
 *   senderUserId: 'user_123',
 *   customMessage: 'Please upload your documents here.',
 *   linkUrl: 'https://foldly.com/john/docs',
 *   linkName: 'Client Documents'
 * });
 * ```
 */
export function useSendInvitation() {
  return useMutation({
    mutationFn: (data: SendInvitationInput) => sendInvitationEmailAction(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Invitation sent successfully!');
      } else if (result.blocked) {
        toast.error('Too many invitations sent. Please try again later.');
      } else {
        toast.error(result.error || 'Failed to send invitation.');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred while sending invitation.');
    },
    retry: false,
  });
}

/**
 * Send bulk invitation emails to multiple recipients
 *
 * Used by:
 * - Links module (invite multiple users at once)
 * - Workspace module (bulk sharing)
 *
 * Features:
 * - Rate limited (5 bulk sends per minute)
 * - Maximum 100 recipients per bulk send
 * - Delay between sends (100ms) to respect Resend limits
 * - Detailed results (sent count, failed count, errors)
 * - Success/error toast with detailed feedback
 *
 * @returns Mutation to send bulk invitation emails
 *
 * @example
 * ```typescript
 * const { mutate: sendBulkInvites, isPending } = useSendBulkInvitations();
 *
 * sendBulkInvites({
 *   recipients: [
 *     { email: 'client1@example.com', name: 'Client One' },
 *     { email: 'client2@example.com', name: 'Client Two' }
 *   ],
 *   senderUserId: 'user_123',
 *   senderName: 'John Doe',
 *   senderEmail: 'john@example.com',
 *   customMessage: 'Please upload your documents.',
 *   linkUrl: 'https://foldly.com/john/docs',
 *   linkName: 'Client Documents'
 * });
 * ```
 */
export function useSendBulkInvitations() {
  return useMutation({
    mutationFn: (data: SendBulkInvitationInput) =>
      sendBulkInvitationEmailsAction(data),
    onSuccess: (result) => {
      if (result.success) {
        const message =
          result.failed > 0
            ? `${result.sent} invitations sent, ${result.failed} failed.`
            : `${result.sent} invitations sent successfully!`;
        toast.success(message);

        // Show errors if any (first 3 only to avoid overwhelming UI)
        if (result.errors && result.errors.length > 0) {
          const errorPreview = result.errors.slice(0, 3).join('\n');
          toast.error(`Some invitations failed:\n${errorPreview}`);
        }
      } else {
        const errorMessage =
          result.errors && result.errors.length > 0
            ? result.errors[0]
            : 'Failed to send invitations.';
        toast.error(errorMessage);
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred while sending invitations.');
    },
    retry: false,
  });
}

/**
 * Send editor promotion email
 *
 * Used by:
 * - Permissions module (promote user to editor)
 * - Links module (share edit access)
 * - Workspace module (collaboration invites)
 *
 * Features:
 * - Rate limited (5 per minute per email)
 * - Includes OTP for email verification
 * - Success/error toast notifications
 *
 * @returns Mutation to send editor promotion email
 *
 * @example
 * ```typescript
 * const { mutate: sendPromotion, isPending } = useSendEditorPromotion();
 *
 * sendPromotion({
 *   email: 'editor@example.com',
 *   otp: '123456',
 *   ownerName: 'John Doe',
 *   ownerEmail: 'john@example.com',
 *   resourceType: 'link',
 *   resourceName: 'Tax Documents',
 *   resourceUrl: 'https://foldly.com/john/tax-docs'
 * });
 * ```
 */
export function useSendEditorPromotion() {
  return useMutation({
    mutationFn: (data: SendEditorPromotionInput) =>
      sendEditorPromotionEmailAction(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Editor promotion email sent!');
      } else if (result.blocked) {
        toast.error('Too many promotion emails sent. Please try again later.');
      } else {
        toast.error(result.error || 'Failed to send promotion email.');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred while sending promotion email.');
    },
    retry: false,
  });
}
